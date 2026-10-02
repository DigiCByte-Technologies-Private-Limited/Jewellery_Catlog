import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as path from 'path';
import * as fs from 'fs';
import type { Response } from 'express';

import { User } from '../users/entities/user.entity';
import { WholesalePartner } from './entities/wholesale-partner.entity';
import { WholesaleDocument } from './entities/wholesale-document.entity';
import { WholesalePartnerHistory } from './entities/wholesale-partner-history.entity';
import { WholesaleProductSubmission } from '../wholesale-submissions/entities/wholesale-product-submission.entity';
import { ProductRequest } from '../requests/entities/request.entity';
import { RequestHistory } from '../requests/entities/request-history.entity';
import { NotificationsService } from '../notifications/notifications.service';

import { WholesaleApplicationRegisterDto } from './dto/wholesale-application-register.dto';
import { WholesaleProfileUpdateDto } from './dto/wholesale-profile-update.dto';
import { WholesaleResubmitDto } from './dto/wholesale-resubmit.dto';
import {
  UpdateApplicationStatusDto,
  UpdateDocumentStatusDto,
  AddAdminNoteDto,
  WholesaleApplicationFilterDto,
} from './dto/wholesale-admin-action.dto';
import { LoginDto } from '../auth/dto/login.dto';
import {
  UserRole,
  WholesaleApplicationStatus,
  WholesaleDocumentType,
  WholesaleDocumentStatus,
  WholesalePartnerHistoryAction,
  WholesaleSubmissionStatus,
  RequestStatus,
  PurchaseStatus,
  ActorRole,
  RequestHistoryAction,
} from '../../common/enums';

@Injectable()
export class WholesaleAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(WholesalePartner)
    private readonly partnerRepo: Repository<WholesalePartner>,

    @InjectRepository(WholesaleDocument)
    private readonly docRepo: Repository<WholesaleDocument>,

    @InjectRepository(WholesalePartnerHistory)
    private readonly historyRepo: Repository<WholesalePartnerHistory>,

    @InjectRepository(WholesaleProductSubmission)
    private readonly submissionRepo: Repository<WholesaleProductSubmission>,

    @InjectRepository(ProductRequest)
    private readonly requestRepo: Repository<ProductRequest>,

    @InjectRepository(RequestHistory)
    private readonly requestHistoryRepo: Repository<RequestHistory>,

    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 1. Register a new Wholesale Application with KYC documents
   */
  async registerApplication(
    dto: WholesaleApplicationRegisterDto,
    files: {
      aadhaarProof?: Express.Multer.File[];
      panProof?: Express.Multer.File[];
      gstProof?: Express.Multer.File[];
    },
  ) {
    if (dto.confirmPassword && dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const normalizedEmail = dto.email.toLowerCase().trim();

    // Check duplicate email in users table
    const existingUser = await this.userRepo.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new ConflictException(`An account with email "${normalizedEmail}" already exists`);
    }

    // Check duplicate PAN number if supplied
    if (dto.panNumber) {
      const cleanPan = dto.panNumber.trim().toUpperCase();
      const existingPan = await this.partnerRepo.findOne({ where: { panNumber: cleanPan } });
      if (existingPan) {
        throw new ConflictException(`A wholesale application with PAN "${cleanPan}" already exists`);
      }
    }

    // Hash password securely with Argon2id
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Create inactive user account (Access is strictly gated until admin approval)
    const user = this.userRepo.create({
      email: normalizedEmail,
      passwordHash,
      fullName: dto.ownerName.trim(),
      phone: dto.phone.trim(),
      role: UserRole.WHOLESALE_USER,
      isActive: false, // Locked until admin approves
    });
    await this.userRepo.save(user);

    // Generate unique Application ID (e.g. WH-2026-0001)
    const year = new Date().getFullYear();
    const count = await this.partnerRepo.count();
    const applicationId = `WH-${year}-${String(count + 1).padStart(4, '0')}`;

    // Create Wholesale Partner Profile in PENDING_REVIEW state
    const partner = this.partnerRepo.create({
      userId: user.id,
      applicationId,
      companyName: dto.companyName.trim(),
      ownerName: dto.ownerName.trim(),
      phone: dto.phone.trim(),
      whatsappNumber: dto.whatsappNumber?.trim() || dto.phone.trim(),
      addressLine: dto.addressLine.trim(),
      city: dto.city.trim(),
      state: dto.state.trim(),
      pincode: dto.pincode.trim(),
      country: dto.country?.trim() || 'India',
      address: `${dto.addressLine.trim()}, ${dto.city.trim()}, ${dto.state.trim()} - ${dto.pincode.trim()}`,
      panNumber: dto.panNumber ? dto.panNumber.trim().toUpperCase() : null,
      aadhaarNumber: dto.aadhaarNumber ? dto.aadhaarNumber.trim() : null,
      gstNumber: dto.gstNumber ? dto.gstNumber.trim().toUpperCase() : null,
      businessType: dto.businessType?.trim() || 'Wholesaler',
      status: WholesaleApplicationStatus.PENDING_REVIEW,
      isVerified: false,
      verifiedAt: null,
    });
    await this.partnerRepo.save(partner);

    // Process & Record KYC Documents
    const savedDocs: WholesaleDocument[] = [];

    const attachDoc = async (fileList: Express.Multer.File[] | undefined, type: WholesaleDocumentType) => {
      if (!fileList || fileList.length === 0) return;
      const file = fileList[0];
      const doc = this.docRepo.create({
        partnerId: partner.id,
        documentType: type,
        originalFilename: file.originalname,
        storageFileName: file.filename,
        storagePath: file.path,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        status: WholesaleDocumentStatus.PENDING,
      });
      await this.docRepo.save(doc);
      savedDocs.push(doc);
    };

    await attachDoc(files?.aadhaarProof, WholesaleDocumentType.AADHAAR);
    await attachDoc(files?.panProof, WholesaleDocumentType.PAN);
    await attachDoc(files?.gstProof, WholesaleDocumentType.GST);

    // Record Immutable Audit History
    const history = this.historyRepo.create({
      partnerId: partner.id,
      action: WholesalePartnerHistoryAction.APPLICATION_SUBMITTED,
      fromStatus: null,
      toStatus: WholesaleApplicationStatus.PENDING_REVIEW,
      actorRole: 'WHOLESALE_APPLICANT',
      actorName: dto.ownerName.trim(),
      note: `Application submitted with ${savedDocs.length} KYC document(s)`,
    });
    await this.historyRepo.save(history);

    // Dispatch Asynchronous Notification to Admin
    this.notificationsService.sendWholesaleRegistrationAlert({
      applicationId: partner.applicationId || applicationId,
      companyName: partner.companyName,
      ownerName: partner.ownerName || user.fullName || 'Wholesale Applicant',
      email: user.email,
      phone: partner.phone || user.phone || 'N/A',
      whatsappNumber: partner.whatsappNumber,
      city: partner.city,
      state: partner.state,
      panNumber: partner.panNumber,
      gstNumber: partner.gstNumber,
      documentCount: savedDocs.length,
    }).catch(() => { /* non-blocking */ });

    return {
      success: true,
      message: 'Wholesale partner registration submitted successfully. Your application is under review.',
      data: {
        id: partner.id,
        applicationId: partner.applicationId,
        companyName: partner.companyName,
        status: partner.status,
        submittedAt: partner.createdAt,
        documentCount: savedDocs.length,
      },
    };
  }

  /**
   * 2. Gated Login: Rejects users who are not yet approved
   */
  async login(dto: LoginDto, ip?: string) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.userRepo.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.role !== UserRole.WHOLESALE_USER) {
      throw new UnauthorizedException('This portal is reserved for wholesale partners only.');
    }

    const isValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const partner = await this.partnerRepo.findOne({ where: { userId: user.id } });

    // ── Gated Access Verification ──
    if (!partner || partner.status !== WholesaleApplicationStatus.APPROVED) {
      const status = partner?.status || WholesaleApplicationStatus.PENDING_REVIEW;
      let message = 'Your wholesale registration is currently under review. You will be able to access your wholesale account after approval.';

      if (status === WholesaleApplicationStatus.UNDER_REVIEW) {
        message = 'Your wholesale registration is actively being verified by our compliance team. Please check back shortly.';
      } else if (status === WholesaleApplicationStatus.REJECTED) {
        message = `Your wholesale registration was not approved. Reason: ${partner?.rejectionReason || 'Documentation requires correction'}. Please update your details and resubmit.`;
      }

      throw new ForbiddenException({
        code: 'WHOLESALE_APPLICATION_NOT_APPROVED',
        status,
        applicationId: partner?.applicationId,
        rejectionReason: partner?.status === WholesaleApplicationStatus.REJECTED ? partner?.rejectionReason : null,
        message,
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your wholesale account has been deactivated. Please contact support.');
    }

    const tokens = await this._generateTokens(user);

    user.refreshTokenHash = await argon2.hash(tokens.refreshToken);
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip ?? null;
    await this.userRepo.save(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this._sanitizeUser(user),
      partner: this._sanitizePartner(partner),
    };
  }

  /**
   * 3. Correct & Resubmit a Rejected Application
   */
  async resubmitApplication(
    dto: WholesaleResubmitDto,
    files: {
      aadhaarProof?: Express.Multer.File[];
      panProof?: Express.Multer.File[];
      gstProof?: Express.Multer.File[];
    },
  ) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.userRepo.findOne({ where: { email: normalizedEmail } });
    if (!user) throw new NotFoundException('Account not found');

    const isValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    const partner = await this.partnerRepo.findOne({
      where: { userId: user.id },
      relations: { documents: true },
    });
    if (!partner) throw new NotFoundException('Wholesale application profile not found');

    if (partner.status !== WholesaleApplicationStatus.REJECTED) {
      throw new BadRequestException('Only rejected applications can be resubmitted');
    }

    // Update mutable details
    if (dto.companyName) partner.companyName = dto.companyName.trim();
    if (dto.ownerName) {
      partner.ownerName = dto.ownerName.trim();
      user.fullName = dto.ownerName.trim();
    }
    if (dto.phone) {
      partner.phone = dto.phone.trim();
      user.phone = dto.phone.trim();
    }
    if (dto.whatsappNumber) partner.whatsappNumber = dto.whatsappNumber.trim();
    if (dto.addressLine) partner.addressLine = dto.addressLine.trim();
    if (dto.city) partner.city = dto.city.trim();
    if (dto.state) partner.state = dto.state.trim();
    if (dto.pincode) partner.pincode = dto.pincode.trim();
    if (dto.panNumber) partner.panNumber = dto.panNumber.trim().toUpperCase();
    if (dto.aadhaarNumber) partner.aadhaarNumber = dto.aadhaarNumber.trim();
    if (dto.gstNumber) partner.gstNumber = dto.gstNumber.trim().toUpperCase();
    if (dto.businessType) partner.businessType = dto.businessType.trim();

    // Reset status to PENDING_REVIEW
    partner.status = WholesaleApplicationStatus.PENDING_REVIEW;
    partner.resubmittedAt = new Date();
    await Promise.all([this.userRepo.save(user), this.partnerRepo.save(partner)]);

    // Update or append documents
    const attachDoc = async (fileList: Express.Multer.File[] | undefined, type: WholesaleDocumentType) => {
      if (!fileList || fileList.length === 0) return;
      const file = fileList[0];
      const doc = this.docRepo.create({
        partnerId: partner.id,
        documentType: type,
        originalFilename: file.originalname,
        storageFileName: file.filename,
        storagePath: file.path,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        status: WholesaleDocumentStatus.PENDING,
      });
      await this.docRepo.save(doc);
    };

    await attachDoc(files?.aadhaarProof, WholesaleDocumentType.AADHAAR);
    await attachDoc(files?.panProof, WholesaleDocumentType.PAN);
    await attachDoc(files?.gstProof, WholesaleDocumentType.GST);

    // Audit log
    const history = this.historyRepo.create({
      partnerId: partner.id,
      action: WholesalePartnerHistoryAction.APPLICATION_RESUBMITTED,
      fromStatus: WholesaleApplicationStatus.REJECTED,
      toStatus: WholesaleApplicationStatus.PENDING_REVIEW,
      actorRole: 'WHOLESALE_APPLICANT',
      actorName: partner.ownerName || user.fullName || 'Wholesale Applicant',
      note: 'Corrected information and KYC documents resubmitted for verification',
    });
    await this.historyRepo.save(history);

    // Re-notify Admin
    this.notificationsService.sendWholesaleRegistrationAlert({
      applicationId: partner.applicationId || 'RESUBMITTED',
      companyName: partner.companyName,
      ownerName: partner.ownerName || user.fullName || 'Wholesale Applicant',
      email: user.email,
      phone: partner.phone || user.phone || 'N/A',
      whatsappNumber: partner.whatsappNumber,
      city: partner.city,
      state: partner.state,
      panNumber: partner.panNumber,
      gstNumber: partner.gstNumber,
      documentCount: files ? Object.keys(files).length : 0,
    }).catch(() => { /* non-blocking */ });

    return {
      success: true,
      message: 'Application resubmitted successfully. Our team will review your updated details.',
      data: { applicationId: partner.applicationId, status: partner.status },
    };
  }

  /**
   * 4. Get Current Authenticated Wholesale Partner Profile (with masked sensitive fields)
   */
  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const partner = await this.partnerRepo.findOne({
      where: { userId },
      relations: { documents: true },
    });

    return {
      success: true,
      data: {
        user: this._sanitizeUser(user),
        partner: partner ? this._sanitizePartner(partner) : null,
      },
    };
  }

  /**
   * 5. Update Wholesale Partner Profile (post-approval)
   */
  async updateProfile(userId: string, dto: WholesaleProfileUpdateDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    let partner = await this.partnerRepo.findOne({ where: { userId } });
    if (!partner) throw new NotFoundException('Wholesale partner profile not found');

    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.phone !== undefined) {
      user.phone = dto.phone;
      partner.phone = dto.phone;
    }
    await this.userRepo.save(user);

    if (dto.companyName !== undefined) partner.companyName = dto.companyName;
    if (dto.gstNumber !== undefined) partner.gstNumber = dto.gstNumber;
    if (dto.businessType !== undefined) partner.businessType = dto.businessType;
    if (dto.city !== undefined) partner.city = dto.city;
    if (dto.state !== undefined) partner.state = dto.state;
    if (dto.address !== undefined || dto.addressLine !== undefined) {
      const addr = (dto.addressLine ?? dto.address) ?? null;
      partner.address = addr;
      partner.addressLine = addr;
    }
    partner = await this.partnerRepo.save(partner);

    return {
      success: true,
      message: 'Profile updated successfully',
      data: { user: this._sanitizeUser(user), partner: this._sanitizePartner(partner) },
    };
  }

  // ─── ADMIN MANAGEMENT METHODS ──────────────────────────────────────────────

  /**
   * 6. Admin: List All Wholesale Applications with Filters, Search & Summary Metrics
   */
  async listApplicationsForAdmin(query: WholesaleApplicationFilterDto) {
    const qb = this.partnerRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.documents', 'd')
      .orderBy('p.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('p.status = :status', { status: query.status });
    }

    if (query.search) {
      const s = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(p.companyName) LIKE :s OR LOWER(p.ownerName) LIKE :s OR LOWER(p.applicationId) LIKE :s OR LOWER(p.phone) LIKE :s OR LOWER(p.panNumber) LIKE :s OR LOWER(p.gstNumber) LIKE :s)',
        { s },
      );
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Fetch user email for each partner
    const userIds = items.map((i) => i.userId);
    const users = userIds.length > 0 ? await this.userRepo.find({ where: { id: In(userIds) } }) : [];
    const userMap = new Map<string, User>(users.map((u) => [u.id, u]));

    const enriched = items.map((item) => {
      const u = userMap.get(item.userId);
      return {
        ...item,
        email: u?.email || 'N/A',
      };
    });

    // Summary Statistics
    const [totalAll, pendingReview, underReview, approved, rejected] = await Promise.all([
      this.partnerRepo.count(),
      this.partnerRepo.count({ where: { status: WholesaleApplicationStatus.PENDING_REVIEW } }),
      this.partnerRepo.count({ where: { status: WholesaleApplicationStatus.UNDER_REVIEW } }),
      this.partnerRepo.count({ where: { status: WholesaleApplicationStatus.APPROVED } }),
      this.partnerRepo.count({ where: { status: WholesaleApplicationStatus.REJECTED } }),
    ]);

    return {
      success: true,
      data: enriched,
      total,
      page,
      limit,
      stats: {
        totalAll,
        pendingReview,
        underReview,
        approved,
        rejected,
      },
    };
  }

  /**
   * 7. Admin: Get Full Application Details (including secure document metadata and audit history)
   */
  async getApplicationDetailForAdmin(id: string) {
    const partner = await this.partnerRepo.findOne({
      where: this._partnerWhere(id),
      relations: { documents: true, history: true },
    });
    if (!partner) throw new NotFoundException('Wholesale application not found');

    const user = await this.userRepo.findOne({ where: { id: partner.userId } });

    return {
      success: true,
      data: {
        ...partner,
        email: user?.email || null,
        user: user ? this._sanitizeUser(user) : null,
      },
    };
  }

  /**
   * 8. Admin: Update Wholesale Application Status (Approve / Reject / Under Review)
   */
  async updateApplicationStatus(
    id: string,
    adminUser: any,
    dto: UpdateApplicationStatusDto,
  ) {
    const partner = await this.partnerRepo.findOne({
      where: this._partnerWhere(id),
    });
    if (!partner) throw new NotFoundException('Wholesale application not found');

    const user = await this.userRepo.findOne({ where: { id: partner.userId } });
    if (!user) throw new NotFoundException('Associated user account not found');

    const prevStatus = partner.status;
    partner.status = dto.status;
    partner.reviewedById = adminUser?.id || null;
    partner.reviewedAt = new Date();

    if (dto.adminNotes) {
      const entry = `[${new Date().toLocaleDateString('en-IN')}] ${dto.adminNotes}`;
      partner.adminNotes = partner.adminNotes ? `${partner.adminNotes}\n${entry}` : entry;
    }

    if (dto.status === WholesaleApplicationStatus.APPROVED) {
      partner.isVerified = true;
      partner.verifiedAt = new Date();
      partner.rejectionReason = null;
      user.isActive = true; // Activate wholesale account
      await Promise.all([this.partnerRepo.save(partner), this.userRepo.save(user)]);

      // Audit Log
      await this.historyRepo.save(
        this.historyRepo.create({
          partnerId: partner.id,
          action: WholesalePartnerHistoryAction.APPLICATION_APPROVED,
          fromStatus: prevStatus,
          toStatus: WholesaleApplicationStatus.APPROVED,
          actorId: adminUser?.id,
          actorRole: adminUser?.role || 'ADMIN',
          actorName: adminUser?.fullName || 'Administrator',
          note: dto.adminNotes || 'Wholesale partner account verified and approved',
        }),
      );

      // Dispatch Approval Notification to Partner
      this.notificationsService.sendWholesaleApprovalNotification({
        applicationId: partner.applicationId || partner.id,
        companyName: partner.companyName,
        ownerName: partner.ownerName || user.fullName || 'Wholesale Partner',
        email: user.email,
      }).catch(() => { /* non-blocking */ });

    } else if (dto.status === WholesaleApplicationStatus.REJECTED) {
      if (!dto.rejectionReason) {
        throw new BadRequestException('A reason for rejection is required');
      }
      partner.rejectionReason = dto.rejectionReason;
      partner.rejectedAt = new Date();
      partner.isVerified = false;
      user.isActive = false;
      await Promise.all([this.partnerRepo.save(partner), this.userRepo.save(user)]);

      // Audit Log
      await this.historyRepo.save(
        this.historyRepo.create({
          partnerId: partner.id,
          action: WholesalePartnerHistoryAction.APPLICATION_REJECTED,
          fromStatus: prevStatus,
          toStatus: WholesaleApplicationStatus.REJECTED,
          actorId: adminUser?.id,
          actorRole: adminUser?.role || 'ADMIN',
          actorName: adminUser?.fullName || 'Administrator',
          note: `Rejection reason: ${dto.rejectionReason}`,
        }),
      );

      // Dispatch Rejection Notification to Partner
      this.notificationsService.sendWholesaleRejectionNotification(
        {
          applicationId: partner.applicationId || partner.id,
          companyName: partner.companyName,
          ownerName: partner.ownerName || user.fullName || 'Wholesale Partner',
          rejectionReason: dto.rejectionReason,
        },
        user.email,
      ).catch(() => { /* non-blocking */ });

    } else {
      // UNDER_REVIEW or other transitions
      await this.partnerRepo.save(partner);
      await this.historyRepo.save(
        this.historyRepo.create({
          partnerId: partner.id,
          action: WholesalePartnerHistoryAction.STATUS_UPDATED,
          fromStatus: prevStatus,
          toStatus: dto.status,
          actorId: adminUser?.id,
          actorRole: adminUser?.role || 'ADMIN',
          actorName: adminUser?.fullName || 'Administrator',
          note: dto.adminNotes || `Status updated to ${dto.status}`,
        }),
      );
    }

    return {
      success: true,
      message: `Wholesale application updated to ${dto.status}`,
      data: {
        applicationId: partner.applicationId,
        status: partner.status,
        isVerified: partner.isVerified,
      },
    };
  }

  /**
   * 9. Admin: Verify or Reject an Individual Document
   */
  async updateDocumentStatus(
    docId: string,
    adminUser: any,
    dto: UpdateDocumentStatusDto,
  ) {
    const doc = await this.docRepo.findOne({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document not found');

    doc.status = dto.status;
    doc.verifiedAt = new Date();
    doc.verifiedById = adminUser?.id || null;
    if (dto.rejectionReason) doc.rejectionReason = dto.rejectionReason;
    await this.docRepo.save(doc);

    await this.historyRepo.save(
      this.historyRepo.create({
        partnerId: doc.partnerId,
        action:
          dto.status === WholesaleDocumentStatus.VERIFIED
            ? WholesalePartnerHistoryAction.DOCUMENT_VERIFIED
            : WholesalePartnerHistoryAction.DOCUMENT_REJECTED,
        actorId: adminUser?.id,
        actorRole: adminUser?.role || 'ADMIN',
        actorName: adminUser?.fullName || 'Administrator',
        note: `${doc.documentType} document marked ${dto.status}${dto.rejectionReason ? ` (${dto.rejectionReason})` : ''}`,
      }),
    );

    return { success: true, message: `Document marked ${dto.status}`, data: doc };
  }

  /**
   * 10. Admin: Append Internal Notes
   */
  async addAdminNote(partnerId: string, adminUser: any, dto: AddAdminNoteDto) {
    const partner = await this.partnerRepo.findOne({ where: this._partnerWhere(partnerId) });
    if (!partner) throw new NotFoundException('Wholesale partner not found');

    const adminLabel = adminUser?.fullName || 'Admin';
    const noteEntry = `[${adminLabel} - ${new Date().toLocaleDateString('en-IN')}] ${dto.note}`;
    partner.adminNotes = partner.adminNotes ? `${partner.adminNotes}\n${noteEntry}` : noteEntry;
    await this.partnerRepo.save(partner);

    await this.historyRepo.save(
      this.historyRepo.create({
        partnerId: partner.id,
        action: WholesalePartnerHistoryAction.NOTE_ADDED,
        actorId: adminUser?.id,
        actorRole: adminUser?.role || 'ADMIN',
        actorName: adminLabel,
        note: dto.note,
      }),
    );

    return { success: true, message: 'Internal note saved', data: { adminNotes: partner.adminNotes } };
  }

  /**
   * 11. Secure Private Document Stream (Anti-IDOR & Permission Checking)
   */
  async streamDocument(docId: string, reqUser: any, res: Response, download: boolean) {
    const doc = await this.docRepo.findOne({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document not found');

    const partner = await this.partnerRepo.findOne({ where: { id: doc.partnerId } });
    if (!partner) throw new NotFoundException('Associated partner not found');

    // Security Authorization Gate:
    // User must be an Admin/Staff role OR the owning Wholesale User
    const isAdmin =
      reqUser.role === UserRole.SUPER_ADMIN ||
      reqUser.role === UserRole.STORE_MANAGER ||
      reqUser.role === UserRole.AUDITOR;
    const isOwner = reqUser.id === partner.userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Access to this document is restricted.');
    }

    const filePath = doc.storagePath;
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Document file not found on storage disk');
    }

    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    const disposition = download ? 'attachment' : 'inline';
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${encodeURIComponent(doc.originalFilename)}"`,
    );

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }

  // ─── EXISTING WHOLESALE FUNCTIONALITY PRESERVED ───────────────────────────

  async logout(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user) {
      user.refreshTokenHash = null;
      await this.userRepo.save(user);
    }
    return { success: true, message: 'Logged out successfully' };
  }

  async getDashboardStats(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const partner = await this.partnerRepo.findOne({ where: { userId } });

    const baseQuery = this.submissionRepo
      .createQueryBuilder('s')
      .where('(s.wholesaleUserId = :userId OR LOWER(s.email) = LOWER(:email))', {
        userId,
        email: user.email,
      });

    const [total, pending, underReview, accepted, rejected, completed] = await Promise.all([
      baseQuery.clone().getCount(),
      baseQuery.clone().andWhere('s.status = :status', { status: WholesaleSubmissionStatus.PENDING_REVIEW }).getCount(),
      baseQuery.clone().andWhere('s.status = :status', { status: WholesaleSubmissionStatus.UNDER_REVIEW }).getCount(),
      baseQuery.clone().andWhere('s.status = :status', { status: WholesaleSubmissionStatus.IMAGE_ACCEPTED }).getCount(),
      baseQuery.clone().andWhere('s.status = :status', { status: WholesaleSubmissionStatus.IMAGE_REJECTED }).getCount(),
      baseQuery.clone().andWhere('s.status = :status', { status: WholesaleSubmissionStatus.COMPLETED }).getCount(),
    ]);

    const customerQb = this.requestRepo
      .createQueryBuilder('r')
      .where('r.assignedToUserId = :userId', { userId });
    if (partner?.city) {
      customerQb.orWhere('(r.assignedToUserId IS NULL AND LOWER(r.city) = LOWER(:city) AND r.status != :comp)', {
        city: partner.city,
        comp: 'COMPLETED',
      });
    }
    const assignedCustomersCount = await customerQb.getCount();

    return {
      success: true,
      data: {
        totalSubmissions: total,
        pendingSubmissions: pending,
        underReviewSubmissions: underReview,
        acceptedSubmissions: accepted,
        rejectedSubmissions: rejected,
        completedSubmissions: completed,
        assignedCustomersCount,
      },
    };
  }

  async getAssignedCustomers(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const partner = await this.partnerRepo.findOne({ where: { userId } });

    const qb = this.requestRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.product', 'p')
      .leftJoinAndSelect('p.media', 'pm')
      .leftJoinAndSelect('r.assignedStore', 's')
      .leftJoinAndSelect('r.history', 'h')
      .where('r.assignedToUserId = :userId', { userId });

    if (partner?.city) {
      qb.orWhere('(r.assignedToUserId IS NULL AND LOWER(r.city) = LOWER(:city) AND r.status != :comp)', {
        city: partner.city,
        comp: 'COMPLETED',
      });
    }

    qb.orderBy('r.createdAt', 'DESC');
    const items = await qb.getMany();

    return {
      success: true,
      data: items,
      total: items.length,
    };
  }

  async updateCustomerFollowUp(
    userId: string,
    requestId: string,
    dto: { note: string; customerResponse?: string; nextFollowUpDate?: string },
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const partner = await this.partnerRepo.findOne({ where: { userId } });

    const request = await this.requestRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Customer request not found');

    if (!request.assignedToUserId) {
      request.assignedToUserId = user.id;
      request.assignedAt = new Date();
    }

    request.status = RequestStatus.FOLLOW_UP;
    if (dto.nextFollowUpDate) {
      request.followUpAt = new Date(dto.nextFollowUpDate);
    }

    const partnerLabel = partner?.companyName || user.fullName || 'Wholesale Partner';
    const noteEntry = `[${partnerLabel} - ${new Date().toLocaleDateString('en-IN')}] ${dto.note}${dto.customerResponse ? ` (Customer: "${dto.customerResponse}")` : ''}`;
    request.purchaseNotes = request.purchaseNotes ? `${request.purchaseNotes}\n${noteEntry}` : noteEntry;

    await this.requestRepo.save(request);

    const history = this.requestHistoryRepo.create({
      requestId: request.id,
      actorRole: ActorRole.STORE,
      actorId: user.id,
      actorName: partnerLabel,
      action: RequestHistoryAction.FOLLOW_UP_ADDED,
      note: `Wholesale Follow-up: ${dto.note}${dto.customerResponse ? ` | Customer: "${dto.customerResponse}"` : ''}`,
    });
    await this.requestHistoryRepo.save(history);

    return { success: true, message: 'Follow-up logged successfully', data: request };
  }

  async updateCustomerOutcome(
    userId: string,
    requestId: string,
    dto: { purchaseStatus: PurchaseStatus; purchaseNotes?: string; confirmedQuantity?: number; purchaseReason?: string },
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const partner = await this.partnerRepo.findOne({ where: { userId } });

    const request = await this.requestRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Customer request not found');

    request.purchaseStatus = dto.purchaseStatus;
    const partnerLabel = partner?.companyName || user.fullName || 'Wholesale Partner';

    if (dto.purchaseStatus === PurchaseStatus.APPROVED) {
      request.status = RequestStatus.COMPLETED;
      request.purchaseConfirmedAt = new Date();
      if (dto.confirmedQuantity) request.quantity = `${dto.confirmedQuantity} units`;
      const note = `[ORDER FULFILLED by ${partnerLabel}] ${dto.purchaseNotes || ''}`;
      request.purchaseNotes = request.purchaseNotes ? `${request.purchaseNotes}\n${note}` : note;
    } else if (dto.purchaseStatus === PurchaseStatus.REJECTED) {
      request.status = RequestStatus.COMPLETED;
      request.purchaseReason = dto.purchaseReason || 'Customer declined';
      const note = `[DECLINED - ${partnerLabel}] Reason: ${request.purchaseReason}. ${dto.purchaseNotes || ''}`;
      request.purchaseNotes = request.purchaseNotes ? `${request.purchaseNotes}\n${note}` : note;
    } else {
      request.status = RequestStatus.FOLLOW_UP;
    }

    await this.requestRepo.save(request);

    const history = this.requestHistoryRepo.create({
      requestId: request.id,
      actorRole: ActorRole.STORE,
      actorId: user.id,
      actorName: partnerLabel,
      action:
        dto.purchaseStatus === PurchaseStatus.APPROVED
          ? RequestHistoryAction.PURCHASE_APPROVED
          : RequestHistoryAction.PURCHASE_REJECTED,
      note: `Wholesale Outcome: ${dto.purchaseStatus}. ${dto.purchaseNotes || ''}`,
    });
    await this.requestHistoryRepo.save(history);

    return { success: true, message: `Outcome updated to ${dto.purchaseStatus}`, data: request };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isValid = await argon2.verify(user.passwordHash, currentPassword);
    if (!isValid) throw new BadRequestException('Current password is incorrect');
    if (newPassword.length < 8) throw new BadRequestException('New password must be at least 8 characters');

    user.passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    user.refreshTokenHash = null;
    await this.userRepo.save(user);

    return { success: true, message: 'Password changed successfully. Please log in again.' };
  }

  async listAllPartnersForAdmin() {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .where('u.role = :role', { role: UserRole.WHOLESALE_USER })
      .select(['u.id', 'u.fullName', 'u.email', 'u.phone', 'u.createdAt', 'u.isActive']);

    const users = await qb.getMany();
    const userIds = users.map((u) => u.id);

    const partners =
      userIds.length > 0
        ? await this.partnerRepo.find({ where: userIds.map((id) => ({ userId: id })) })
        : [];
    const partnerMap = new Map(partners.map((p) => [p.userId, p]));

    const combined = users.map((u) => {
      const p = partnerMap.get(u.id);
      return {
        userId: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        companyName: p?.companyName || u.fullName,
        city: p?.city || null,
        state: p?.state || null,
        businessType: p?.businessType || null,
        isVerified: p?.isVerified || false,
        status: p?.status || WholesaleApplicationStatus.PENDING_REVIEW,
        applicationId: p?.applicationId || null,
        gstNumber: p?.gstNumber || null,
      };
    });

    return {
      success: true,
      data: combined,
    };
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private async _generateTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this._generateAccessToken(user),
      this._generateRefreshToken(user),
    ]);
    return { accessToken, refreshToken };
  }

  private _generateAccessToken(user: User): string {
    return this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m') as any,
      },
    );
  }

  private _generateRefreshToken(user: User): string {
    return this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d') as any,
      },
    );
  }

  private _sanitizeUser(user: User) {
    const { passwordHash, refreshTokenHash, totpSecret, ...safe } = user as any;
    return safe;
  }

  private _sanitizePartner(partner: WholesalePartner) {
    // Mask sensitive identification numbers for user-facing profile views
    const safe = { ...partner } as any;
    delete safe.adminNotes; // Never leak internal admin notes to client

    if (safe.aadhaarNumber && safe.aadhaarNumber.length === 12) {
      safe.aadhaarNumberMasked = `XXXX XXXX ${safe.aadhaarNumber.slice(-4)}`;
    }
    if (safe.panNumber && safe.panNumber.length === 10) {
      safe.panNumberMasked = `${safe.panNumber.slice(0, 2)}XXXXX${safe.panNumber.slice(-3)}`;
    }

    return safe;
  }

  private _isUuid(val: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  }

  private _partnerWhere(idOrAppId: string): any {
    return this._isUuid(idOrAppId) ? { id: idOrAppId } : { applicationId: idOrAppId };
  }
}
