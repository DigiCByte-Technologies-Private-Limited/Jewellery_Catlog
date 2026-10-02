import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { CustomDesignRequest, AttachmentFileItem } from './entities/custom-design-request.entity';
import { CustomDesignHistory } from './entities/custom-design-history.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateCustomDesignDto,
  UpdateCustomDesignStatusDto,
  QueryCustomDesignDto,
} from './dto/custom-design.dto';
import {
  CustomDesignStatus,
  CustomDesignHistoryAction,
  ActorRole,
  UserRole,
} from '../../common/enums';

@Injectable()
export class CustomDesignsService {
  private readonly logger = new Logger(CustomDesignsService.name);

  constructor(
    @InjectRepository(CustomDesignRequest)
    private readonly requestRepo: Repository<CustomDesignRequest>,
    @InjectRepository(CustomDesignHistory)
    private readonly historyRepo: Repository<CustomDesignHistory>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Generates sequential Request IDs in the format: CDR-2026-0001
   */
  private async generateRequestId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.requestRepo.count();
    let nextNum = count + 1;
    let candidate = `CDR-${year}-${String(nextNum).padStart(4, '0')}`;

    while (await this.requestRepo.findOne({ where: { requestId: candidate } })) {
      nextNum++;
      candidate = `CDR-${year}-${String(nextNum).padStart(4, '0')}`;
    }

    return candidate;
  }

  private sanitizeAttachments(attachments: any): AttachmentFileItem[] {
    if (!Array.isArray(attachments)) return [];
    return attachments.filter(
      (f: any) => f && typeof f === 'object' && !Array.isArray(f) && (f.url || f.originalName),
    );
  }

  /**
   * 1. Public: Customer submits custom design request
   */
  async create(dto: CreateCustomDesignDto, customerId?: string) {
    const requestId = await this.generateRequestId();
    const sanitizedAttachments = this.sanitizeAttachments(dto.attachments);

    const request = this.requestRepo.create({
      ...dto,
      requestId,
      customerId: customerId || null,
      status: CustomDesignStatus.NEW,
      notificationStatus: 'PROCESSING',
      attachments: sanitizedAttachments,
    });

    const savedRequest = await this.requestRepo.save(request);

    // Initial audit event
    const history = this.historyRepo.create({
      requestId: savedRequest.id,
      actorRole: ActorRole.CUSTOMER,
      actorName: dto.customerName,
      action: CustomDesignHistoryAction.REQUEST_CREATED,
      note: `Custom design request submitted from customer storefront. Product/Category: "${dto.productName}". Attached files: ${sanitizedAttachments.length}`,
    });
    await this.historyRepo.save(history);

    this.logger.log(`Created Custom Design Request ${requestId} for ${dto.customerName}`);

    // Asynchronously trigger Admin Notifications (Fire and track, never block customer response)
    this.dispatchNotificationsAsync(savedRequest, dto);

    return {
      success: true,
      message: `Your custom design request has been submitted successfully. Your Request ID is ${requestId}. Our team will contact you shortly.`,
      data: savedRequest,
    };
  }

  /**
   * Asynchronous dispatch to guarantee customer response is instant and decoupled
   */
  private async dispatchNotificationsAsync(
    savedRequest: CustomDesignRequest,
    dto: CreateCustomDesignDto,
  ) {
    try {
      const result = await this.notificationsService.sendNewCustomDesignNotification({
        requestId: savedRequest.requestId,
        customerName: dto.customerName,
        companyName: dto.companyName,
        email: dto.email,
        phone: dto.phone,
        productName: dto.productName,
        quantity: dto.quantity || '1 unit',
        materialRequirements: dto.materialRequirements,
        designDescription: dto.designDescription,
        designRequirements: dto.designRequirements,
        dimensions: dto.dimensions,
        additionalNotes: dto.additionalNotes,
        preferredContactMethod: dto.preferredContactMethod,
      });

      // Update notification status on the request
      await this.requestRepo.update(savedRequest.id, {
        notificationStatus: result.notificationStatus,
      });

      // Log notification audit event
      const notifHistory = this.historyRepo.create({
        requestId: savedRequest.id,
        actorRole: ActorRole.ADMIN,
        actorName: 'System Notification Engine',
        action: result.emailSent
          ? CustomDesignHistoryAction.NOTIFICATION_EMAIL_SENT
          : CustomDesignHistoryAction.NOTIFICATION_EMAIL_FAILED,
        note: `Notification outcome: ${result.notificationStatus}. Email sent: ${result.emailSent}, WhatsApp sent: ${result.whatsappSent}`,
      });
      await this.historyRepo.save(notifHistory);
    } catch (err: any) {
      this.logger.error(`Error in async notification dispatch: ${err.message}`);
      await this.requestRepo.update(savedRequest.id, {
        notificationStatus: 'DISPATCH_ERROR',
      });
    }
  }

  /**
   * 2. Admin: Pipeline Summary & Analytics Stats
   */
  async getStats() {
    const [
      total,
      newCount,
      underReviewCount,
      contactedCount,
      quotationCount,
      approvedCount,
      rejectedCount,
      completedCount,
    ] = await Promise.all([
      this.requestRepo.count(),
      this.requestRepo.count({ where: { status: CustomDesignStatus.NEW } }),
      this.requestRepo.count({ where: { status: CustomDesignStatus.UNDER_REVIEW } }),
      this.requestRepo.count({ where: { status: CustomDesignStatus.CONTACTED } }),
      this.requestRepo.count({ where: { status: CustomDesignStatus.QUOTATION } }),
      this.requestRepo.count({ where: { status: CustomDesignStatus.APPROVED } }),
      this.requestRepo.count({ where: { status: CustomDesignStatus.REJECTED } }),
      this.requestRepo.count({ where: { status: CustomDesignStatus.COMPLETED } }),
    ]);

    const activePipeline = newCount + underReviewCount + contactedCount + quotationCount;

    return {
      success: true,
      data: {
        total,
        new: newCount,
        underReview: underReviewCount,
        contacted: contactedCount,
        quotation: quotationCount,
        approved: approvedCount,
        rejected: rejectedCount,
        completed: completedCount,
        activePipeline,
      },
    };
  }

  /**
   * 3. Admin: List All Custom Design Requests with Filtering & Search
   */
  async findAll(query: QueryCustomDesignDto) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const qb = this.requestRepo.createQueryBuilder('r');

    if (search) {
      qb.andWhere(
        '(LOWER(r.customerName) LIKE :search OR LOWER(r.email) LIKE :search OR r.phone LIKE :search OR LOWER(r.requestId) LIKE :search OR LOWER(r.productName) LIKE :search OR LOWER(COALESCE(r.companyName, \'\')) LIKE :search)',
        { search: `%${search.toLowerCase().trim()}%` },
      );
    }

    if (status) {
      qb.andWhere('r.status = :status', { status });
    }

    const allowedSortFields: Record<string, string> = {
      createdAt: 'r.createdAt',
      updatedAt: 'r.updatedAt',
      requestId: 'r.requestId',
      customerName: 'r.customerName',
      status: 'r.status',
    };

    const sortColumn = allowedSortFields[sortBy] || 'r.createdAt';
    qb.orderBy(sortColumn, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();
    items.forEach((item) => {
      item.attachments = this.sanitizeAttachments(item.attachments);
    });

    return {
      success: true,
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 4. Admin / Customer: Fetch Single Request with Audit History
   */
  async findOne(id: string, user?: any) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const request = await this.requestRepo.findOne({
      where: isUuid ? { id } : { requestId: id },
      relations: { history: true },
    });

    if (!request) {
      throw new NotFoundException(`Custom design request "${id}" not found`);
    }

    if (user && user.role === UserRole.CUSTOMER) {
      if (request.customerId !== user.id) {
        throw new ForbiddenException('You only have permission to view your own custom designs');
      }
    }

    request.attachments = this.sanitizeAttachments(request.attachments);

    // Sort history chronologically descending
    if (request.history) {
      request.history.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    return {
      success: true,
      data: request,
    };
  }

  /**
   * Customer Endpoint: List my own submitted custom designs
   */
  async findMyDesigns(customerId: string) {
    const data = await this.requestRepo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
      relations: { history: true },
    });

    return {
      success: true,
      data: data.map((d) => ({
        ...d,
        attachments: this.sanitizeAttachments(d.attachments),
      })),
    };
  }

  /**
   * 5. Public: Customer Tracking (Masked for privacy)
   */
  async track(requestId: string, phoneOrEmail?: string) {
    const request = await this.requestRepo.findOne({
      where: { requestId: requestId.trim() },
    });

    if (!request) {
      throw new NotFoundException(`Request with ID "${requestId}" not found. Please verify your reference number.`);
    }

    // If verification provided, validate
    if (phoneOrEmail) {
      const cleanInput = phoneOrEmail.trim().toLowerCase();
      const matchEmail = request.email.toLowerCase() === cleanInput;
      const cleanPhoneDb = request.phone.replace(/[^0-9]/g, '');
      const cleanPhoneInput = cleanInput.replace(/[^0-9]/g, '');
      const matchPhone = cleanPhoneInput.length > 5 && cleanPhoneDb.includes(cleanPhoneInput);

      if (!matchEmail && !matchPhone) {
        throw new BadRequestException('Verification failed. The phone number or email provided does not match this Request ID.');
      }
    }

    return {
      success: true,
      data: {
        requestId: request.requestId,
        customerName: request.customerName,
        productName: request.productName,
        status: request.status,
        submittedAt: request.createdAt,
        updatedAt: request.updatedAt,
        preferredContactMethod: request.preferredContactMethod,
        attachmentCount: this.sanitizeAttachments(request.attachments).length,
      },
    };
  }

  /**
   * 6. Admin: Update Status & Internal Notes
   */
  async updateStatus(
    id: string,
    dto: UpdateCustomDesignStatusDto,
    adminUser: { id?: string; fullName?: string; email?: string },
  ) {
    const { data: request } = await this.findOne(id);

    const previousStatus = request.status;
    const isStatusChanged = dto.status && dto.status !== previousStatus;

    if (dto.status) {
      request.status = dto.status;
    }

    if (dto.adminNotes !== undefined) {
      request.adminNotes = dto.adminNotes;
    }

    const saved = await this.requestRepo.save(request);

    // Record audit event
    const adminName = adminUser?.fullName || adminUser?.email || 'Admin';
    let noteText = '';
    let actionType = CustomDesignHistoryAction.NOTE_ADDED;

    if (isStatusChanged) {
      actionType = CustomDesignHistoryAction.STATUS_UPDATED;
      noteText = `Status transitioned from ${previousStatus} to ${dto.status}.`;
      if (dto.adminNotes) {
        noteText += ` Notes: ${dto.adminNotes}`;
      }
    } else {
      noteText = `Admin notes updated: "${dto.adminNotes}"`;
    }

    const history = this.historyRepo.create({
      requestId: saved.id,
      actorRole: ActorRole.ADMIN,
      actorName: adminName,
      action: actionType,
      note: noteText,
    });
    await this.historyRepo.save(history);

    this.logger.log(`Request ${saved.requestId} status updated to ${saved.status} by ${adminName}`);

    return {
      success: true,
      message: `Request status updated to ${saved.status}`,
      data: saved,
    };
  }

  /**
   * 7. Admin: Retry Email / WhatsApp Notification
   */
  async retryNotification(id: string, adminUser: { fullName?: string; email?: string }) {
    const { data: request } = await this.findOne(id);

    const result = await this.notificationsService.sendNewCustomDesignNotification({
      requestId: request.requestId,
      customerName: request.customerName,
      companyName: request.companyName,
      email: request.email,
      phone: request.phone,
      productName: request.productName,
      quantity: request.quantity,
      materialRequirements: request.materialRequirements,
      designDescription: request.designDescription,
      designRequirements: request.designRequirements,
      dimensions: request.dimensions,
      additionalNotes: request.additionalNotes,
      preferredContactMethod: request.preferredContactMethod,
    });

    request.notificationStatus = result.notificationStatus;
    await this.requestRepo.save(request);

    const adminName = adminUser?.fullName || adminUser?.email || 'Admin';
    const history = this.historyRepo.create({
      requestId: request.id,
      actorRole: ActorRole.ADMIN,
      actorName: adminName,
      action: result.emailSent
        ? CustomDesignHistoryAction.NOTIFICATION_EMAIL_SENT
        : CustomDesignHistoryAction.NOTIFICATION_EMAIL_FAILED,
      note: `Manual notification re-dispatch by ${adminName}. Outcome: ${result.notificationStatus}`,
    });
    await this.historyRepo.save(history);

    return {
      success: true,
      message: `Notifications re-dispatched. Status: ${result.notificationStatus}`,
      data: {
        notificationStatus: result.notificationStatus,
        emailSent: result.emailSent,
        whatsappSent: result.whatsappSent,
      },
    };
  }
}
