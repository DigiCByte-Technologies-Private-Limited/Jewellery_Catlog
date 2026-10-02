import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { WholesaleProductSubmission, SubmittedImageItem } from './entities/wholesale-product-submission.entity';
import { WholesaleSubmissionHistory } from './entities/wholesale-submission-history.entity';
import { Product } from '../products/entities/product.entity';
import { ProductMedia } from '../products/entities/product-media.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateWholesaleSubmissionDto,
  UpdateWholesaleSubmissionStatusDto,
  QueryWholesaleSubmissionDto,
  PublishToCatalogDto,
} from './dto';
import {
  WholesaleSubmissionStatus,
  WholesaleSubmissionHistoryAction,
  ActorRole,
} from '../../common/enums';

const WHOLESALE_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'wholesale-submissions');
const CATALOG_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'products');

if (!fs.existsSync(WHOLESALE_UPLOAD_DIR)) {
  fs.mkdirSync(WHOLESALE_UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(CATALOG_UPLOAD_DIR)) {
  fs.mkdirSync(CATALOG_UPLOAD_DIR, { recursive: true });
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

@Injectable()
export class WholesaleSubmissionsService {
  private readonly logger = new Logger(WholesaleSubmissionsService.name);

  constructor(
    @InjectRepository(WholesaleProductSubmission)
    private readonly submissionRepo: Repository<WholesaleProductSubmission>,
    @InjectRepository(WholesaleSubmissionHistory)
    private readonly historyRepo: Repository<WholesaleSubmissionHistory>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductMedia)
    private readonly mediaRepo: Repository<ProductMedia>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Generates sequential reference ID in format: WPS-2026-0001
   */
  private async generateSubmissionId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.submissionRepo.count();
    let nextNum = count + 1;
    let candidate = `WPS-${year}-${String(nextNum).padStart(4, '0')}`;

    while (await this.submissionRepo.findOne({ where: { submissionId: candidate } })) {
      nextNum++;
      candidate = `WPS-${year}-${String(nextNum).padStart(4, '0')}`;
    }

    return candidate;
  }

  private sanitizeImages(images: any): SubmittedImageItem[] {
    if (!Array.isArray(images)) return [];
    return images.filter(
      (img: any) => img && typeof img === 'object' && !Array.isArray(img) && (img.url || img.filename),
    );
  }

  /**
   * 1. Wholesale User: Submit Product Information + Image Proposal
   */
  async create(dto: CreateWholesaleSubmissionDto, user?: { id?: string; email?: string; fullName?: string }) {
    const submissionId = await this.generateSubmissionId();
    const sanitizedImages = this.sanitizeImages(dto.images);

    if (sanitizedImages.length === 0) {
      throw new BadRequestException('At least one product image must be uploaded with the submission.');
    }

    // Resolve product SKU or details if productId is provided
    let productSku = dto.productSku || null;
    let productName = dto.productName;
    if (dto.productId) {
      const existingProduct = await this.productRepo.findOne({ where: { id: dto.productId } });
      if (existingProduct) {
        if (!productSku) productSku = existingProduct.sku;
        if (!productName) productName = existingProduct.name;
      }
    }

    const submission = this.submissionRepo.create({
      ...dto,
      submissionId,
      productSku,
      productName,
      wholesaleUserId: user?.id || null,
      customerName: dto.customerName || user?.fullName || 'Wholesale Client',
      email: dto.email || user?.email || '',
      images: sanitizedImages,
      status: WholesaleSubmissionStatus.PENDING_REVIEW,
      notificationStatus: 'PROCESSING',
    });

    const saved = await this.submissionRepo.save(submission);

    // Initial audit event
    const history = this.historyRepo.create({
      submissionDbId: saved.id,
      actorRole: ActorRole.CUSTOMER,
      actorName: saved.customerName,
      action: WholesaleSubmissionHistoryAction.SUBMISSION_CREATED,
      note: `Wholesale proposal submitted by ${saved.customerName} (${saved.companyName}). Product: "${saved.productName}". Attached images: ${sanitizedImages.length}.`,
    });
    await this.historyRepo.save(history);

    this.logger.log(`Created Wholesale Product Submission ${submissionId} for ${saved.companyName}`);

    // Asynchronously dispatch Admin Notifications (decoupled)
    this.dispatchNotificationsAsync(saved);

    return {
      success: true,
      message: `Your product image proposal has been submitted successfully with reference ID ${submissionId}. Our admin team has been notified and will review your proposal.`,
      data: saved,
    };
  }

  /**
   * Asynchronous dispatch to guarantee wholesale user response is instant
   */
  private async dispatchNotificationsAsync(saved: WholesaleProductSubmission) {
    try {
      const result = await this.notificationsService.sendNewWholesaleSubmissionNotification({
        submissionId: saved.submissionId,
        customerName: saved.customerName,
        companyName: saved.companyName,
        email: saved.email,
        phone: saved.phone,
        productName: saved.productName,
        productCategory: saved.productCategory,
        productSku: saved.productSku,
        productDescription: saved.productDescription,
        productSpecifications: saved.productSpecifications,
        dimensions: saved.dimensions,
        colorOrVariant: saved.colorOrVariant,
        wholesaleQuantity: saved.wholesaleQuantity,
        additionalNotes: saved.additionalNotes,
        imageCount: (saved.images || []).length,
      });

      await this.submissionRepo.update(saved.id, {
        notificationStatus: result.notificationStatus,
      });

      const notifHistory = this.historyRepo.create({
        submissionDbId: saved.id,
        actorRole: ActorRole.ADMIN,
        actorName: 'System Notification Engine',
        action: WholesaleSubmissionHistoryAction.NOTIFICATION_SENT,
        note: `Notification outcome: ${result.notificationStatus}. Email sent: ${result.emailSent}, WhatsApp sent: ${result.whatsappSent}`,
      });
      await this.historyRepo.save(notifHistory);
    } catch (err: any) {
      this.logger.error(`Error in async wholesale notification dispatch: ${err.message}`);
      await this.submissionRepo.update(saved.id, {
        notificationStatus: 'DISPATCH_ERROR',
      });
    }
  }

  /**
   * 2. Wholesale User: View Own Submissions
   */
  async getMySubmissions(
    user: { id?: string; email?: string } | null | undefined,
    query: QueryWholesaleSubmissionDto,
  ) {
    const { page = 1, limit = 20, status, search, email, phone } = query;
    const qb = this.submissionRepo.createQueryBuilder('s');

    const targetUserId = user?.id;
    const targetEmail = user?.email || email;
    const targetPhone = phone;

    if (targetUserId) {
      qb.where(
        '(s.wholesaleUserId = :userId OR (s.wholesaleUserId IS NULL AND LOWER(s.email) = LOWER(:email)))',
        {
          userId: targetUserId,
          email: targetEmail || '',
        },
      );
    } else if (targetEmail) {
      qb.where('LOWER(s.email) = LOWER(:email)', { email: targetEmail.trim() });
    } else if (targetPhone) {
      qb.where('s.phone = :phone', { phone: targetPhone.trim() });
    } else {
      return { success: true, data: [], total: 0, page: 1, limit, totalPages: 0 };
    }

    if (status) {
      qb.andWhere('s.status = :status', { status });
    }

    if (search) {
      qb.andWhere(
        '(s.submissionId ILIKE :search OR s.productName ILIKE :search OR s.productSku ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('s.createdAt', 'DESC');
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // Sanitize image structures and strip internal admin notes for client
    const sanitizedItems = items.map((item) => {
      const { adminNotes: _, ...safe } = item as any;
      safe.images = this.sanitizeImages(item.images);
      return safe;
    });

    return {
      success: true,
      data: sanitizedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 3. Wholesale User: Get Single Submission Details
   */
  async getMySubmissionById(
    id: string,
    user?: { id?: string; email?: string } | null,
    queryEmailOrPhone?: string,
  ) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const submission = await this.submissionRepo.findOne({
      where: isUuid ? { id } : { submissionId: id },
      relations: { history: true },
    });

    if (!submission) {
      throw new NotFoundException(`Submission "${id}" not found.`);
    }

    // Verify ownership
    const isOwner =
      !user && !queryEmailOrPhone
        ? true
        : (user?.id && submission.wholesaleUserId === user.id) ||
          (user?.email && submission.email.toLowerCase() === user.email.toLowerCase()) ||
          (queryEmailOrPhone &&
            (submission.email.toLowerCase() === queryEmailOrPhone.toLowerCase() ||
              submission.phone === queryEmailOrPhone));

    if (!isOwner) {
      throw new NotFoundException(`Submission "${id}" not found.`);
    }

    submission.images = this.sanitizeImages(submission.images);

    // Strip internal admin notes
    const { adminNotes: _, ...safe } = submission as any;

    return {
      success: true,
      data: safe,
    };
  }

  /**
   * 4. Admin: List All Submissions with Filters & Search
   */
  async findAllAdmin(query: QueryWholesaleSubmissionDto) {
    const { page = 1, limit = 20, status, search, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const qb = this.submissionRepo.createQueryBuilder('s');

    if (status) {
      qb.andWhere('s.status = :status', { status });
    }

    if (search) {
      qb.andWhere(
        '(s.submissionId ILIKE :search OR s.productName ILIKE :search OR s.companyName ILIKE :search OR s.customerName ILIKE :search OR s.productSku ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const allowedSortFields: Record<string, string> = {
      createdAt: 's.createdAt',
      updatedAt: 's.updatedAt',
      submissionId: 's.submissionId',
      productName: 's.productName',
      companyName: 's.companyName',
      status: 's.status',
    };

    const sortCol = allowedSortFields[sortBy] || 's.createdAt';
    qb.orderBy(sortCol, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    items.forEach((item) => {
      item.images = this.sanitizeImages(item.images);
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
   * 5. Admin: Pipeline Metrics & Stats
   */
  async getStats() {
    const [
      total,
      pendingReview,
      underReview,
      imageAccepted,
      imageRejected,
      completed,
    ] = await Promise.all([
      this.submissionRepo.count(),
      this.submissionRepo.count({ where: { status: WholesaleSubmissionStatus.PENDING_REVIEW } }),
      this.submissionRepo.count({ where: { status: WholesaleSubmissionStatus.UNDER_REVIEW } }),
      this.submissionRepo.count({ where: { status: WholesaleSubmissionStatus.IMAGE_ACCEPTED } }),
      this.submissionRepo.count({ where: { status: WholesaleSubmissionStatus.IMAGE_REJECTED } }),
      this.submissionRepo.count({ where: { status: WholesaleSubmissionStatus.COMPLETED } }),
    ]);

    return {
      success: true,
      data: {
        total,
        pendingReview,
        underReview,
        imageAccepted,
        imageRejected,
        completed,
        activePipeline: pendingReview + underReview + imageAccepted,
      },
    };
  }

  /**
   * 6. Admin: Get Single Submission with Full Audit History
   */
  async findOneAdmin(id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const submission = await this.submissionRepo.findOne({
      where: isUuid ? { id } : { submissionId: id },
      relations: { history: true },
    });

    if (!submission) {
      throw new NotFoundException(`Wholesale product submission "${id}" not found.`);
    }

    submission.images = this.sanitizeImages(submission.images);

    if (submission.history) {
      submission.history.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    return {
      success: true,
      data: submission,
    };
  }

  /**
   * 7. Admin: Update Status (Accept Image, Reject Image, Keep Pending / Under Review)
   */
  async updateStatus(
    id: string,
    dto: UpdateWholesaleSubmissionStatusDto,
    adminUser: { id?: string; fullName?: string; email?: string },
  ) {
    const { data: submission } = await this.findOneAdmin(id);

    if (dto.status === WholesaleSubmissionStatus.IMAGE_REJECTED && !dto.rejectionReason?.trim()) {
      throw new BadRequestException('A rejection reason must be provided when rejecting a submitted image.');
    }

    const prevStatus = submission.status;
    submission.status = dto.status;
    if (dto.rejectionReason !== undefined) {
      submission.rejectionReason = dto.rejectionReason.trim() || null;
    }
    if (dto.adminNotes !== undefined) {
      submission.adminNotes = dto.adminNotes.trim() || null;
    }

    submission.reviewedById = adminUser.id || null;
    submission.reviewedByName = adminUser.fullName || adminUser.email || 'Admin';
    submission.reviewedAt = new Date();

    const saved = await this.submissionRepo.save(submission);

    // Audit log
    let historyAction = WholesaleSubmissionHistoryAction.STATUS_UPDATED;
    if (dto.status === WholesaleSubmissionStatus.IMAGE_ACCEPTED) {
      historyAction = WholesaleSubmissionHistoryAction.IMAGE_ACCEPTED;
    } else if (dto.status === WholesaleSubmissionStatus.IMAGE_REJECTED) {
      historyAction = WholesaleSubmissionHistoryAction.IMAGE_REJECTED;
    }

    const history = this.historyRepo.create({
      submissionDbId: saved.id,
      actorRole: ActorRole.ADMIN,
      actorName: submission.reviewedByName,
      action: historyAction,
      note: `Status changed from "${prevStatus}" to "${dto.status}". ${
        dto.rejectionReason ? `Rejection reason: "${dto.rejectionReason}". ` : ''
      }${dto.adminNotes ? `Admin Notes: "${dto.adminNotes}".` : ''}`,
    });
    await this.historyRepo.save(history);

    this.logger.log(`Admin ${submission.reviewedByName} updated submission ${submission.submissionId} to ${dto.status}`);

    return {
      success: true,
      message: `Submission status successfully updated to ${dto.status}.`,
      data: saved,
    };
  }

  /**
   * 8. Admin: Download Original Submitted Image (Stream file with clean name)
   */
  async getImageForDownload(
    submissionId: string,
    fileIdOrIndex: string | undefined,
    adminUser: { fullName?: string; email?: string },
  ) {
    const { data: submission } = await this.findOneAdmin(submissionId);
    let image: SubmittedImageItem | undefined;

    if (fileIdOrIndex) {
      image = (submission.images || []).find(
        (img) => img.id === fileIdOrIndex || img.filename === fileIdOrIndex,
      );
      if (!image && /^\d+$/.test(fileIdOrIndex)) {
        const idx = parseInt(fileIdOrIndex, 10);
        image = submission.images?.[idx];
      }
    }

    if (!image && submission.images && submission.images.length > 0) {
      image = submission.images[0];
    }

    if (!image) {
      throw new NotFoundException(`No image file available for download on this submission.`);
    }

    const sanitizedFilename = path.basename(image.filename);
    const filePath = path.join(WHOLESALE_UPLOAD_DIR, sanitizedFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Original file not found on server storage.');
    }

    // Audit log download event
    const history = this.historyRepo.create({
      submissionDbId: submission.id,
      actorRole: ActorRole.ADMIN,
      actorName: adminUser.fullName || adminUser.email || 'Admin',
      action: WholesaleSubmissionHistoryAction.IMAGE_DOWNLOADED,
      note: `Admin downloaded original image "${image.originalName}" (${(image.sizeBytes / 1024 / 1024).toFixed(2)} MB).`,
    });
    await this.historyRepo.save(history);

    const ext = path.extname(image.originalName) || '.jpg';
    const cleanProductName = slugify(submission.productName || 'product');
    const downloadFileName = `${submission.submissionId}-${cleanProductName}${ext}`;

    return {
      filePath,
      mimeType: image.mimeType,
      downloadFileName,
    };
  }

  /**
   * 9. Conflict Check: Inspect existing images of a product before publishing
   */
  async checkProductMediaConflict(idOrProductId: string) {
    let targetProductId = idOrProductId;

    // Check if passed string is a submission ID or WPS code
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrProductId);
    const sub = await this.submissionRepo.findOne({
      where: isUuid ? [{ id: idOrProductId }, { productId: idOrProductId }] : [{ submissionId: idOrProductId }],
    });

    if (sub && sub.productId) {
      targetProductId = sub.productId;
    }

    const product = await this.productRepo.findOne({
      where: { id: targetProductId },
      relations: { media: true },
    });

    if (!product) {
      return {
        success: true,
        data: {
          product: {
            id: targetProductId,
            title: sub?.productName || 'Unlinked Product',
            name: sub?.productName || 'Unlinked Product',
            sku: sub?.productSku || 'NEW',
          },
          hasExistingImages: false,
          hasExistingMedia: false,
          totalExistingImages: 0,
          existingMediaCount: 0,
          primaryImage: null,
          currentPrimaryMedia: null,
          existingMedia: [],
          allMedia: [],
        },
      };
    }

    const existingMedia = await this.mediaRepo.find({
      where: { productId: targetProductId },
      order: { isPrimary: 'DESC', sortOrder: 'ASC', createdAt: 'ASC' },
    });

    const primaryImage = existingMedia.find((m) => m.isPrimary) || null;

    const formattedMedia = existingMedia.map((m) => ({
      id: m.id,
      url: m.standardUrl || m.originalUrl,
      altText: m.altText || '',
      isPrimary: m.isPrimary,
      sortOrder: m.sortOrder || 0,
    }));

    return {
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          title: product.name,
          sku: product.sku,
          metalType: product.metalType,
          purity: product.purity,
        },
        hasExistingImages: existingMedia.length > 0,
        hasExistingMedia: existingMedia.length > 0,
        totalExistingImages: existingMedia.length,
        existingMediaCount: existingMedia.length,
        primaryImage: primaryImage
          ? {
              id: primaryImage.id,
              url: primaryImage.standardUrl || primaryImage.originalUrl,
              altText: primaryImage.altText || '',
              isPrimary: primaryImage.isPrimary,
            }
          : null,
        currentPrimaryMedia: primaryImage
          ? {
              id: primaryImage.id,
              url: primaryImage.standardUrl || primaryImage.originalUrl,
              altText: primaryImage.altText || '',
              isPrimary: primaryImage.isPrimary,
            }
          : null,
        existingMedia: formattedMedia,
        allMedia: formattedMedia,
      },
    };
  }

  /**
   * 10. Admin: Explicitly Publish Accepted Image into Official Product Catalog
   */
  async publishToCatalog(
    submissionId: string,
    dto: PublishToCatalogDto,
    adminUser: { id?: string; fullName?: string; email?: string },
  ) {
    const { data: submission } = await this.findOneAdmin(submissionId);

    const targetProductId = dto.productId || submission.productId;
    if (!targetProductId) {
      throw new BadRequestException('No target product specified to publish this image to.');
    }

    const targetProduct = await this.productRepo.findOne({ where: { id: targetProductId } });
    if (!targetProduct) {
      throw new NotFoundException(`Target product "${targetProductId}" not found.`);
    }

    const targetFileId = dto.fileId || submission.images?.[dto.imageIndex || 0]?.id;
    let image = (submission.images || []).find(
      (img) => img.id === targetFileId || img.filename === targetFileId,
    );
    if (!image && submission.images && submission.images.length > 0) {
      image = submission.images[0];
    }

    if (!image) {
      throw new BadRequestException(`No image found on this submission to publish.`);
    }

    const isPrimary = dto.isPrimary ?? (dto.replacePrimary ?? true);

    const sourcePath = path.join(WHOLESALE_UPLOAD_DIR, path.basename(image.filename));
    if (!fs.existsSync(sourcePath)) {
      throw new NotFoundException('Source image file not found in wholesale upload storage.');
    }

    // Copy file to official product upload directory
    const ext = path.extname(image.filename);
    const catalogFileName = `catalog-prod-${Date.now()}-${slugify(targetProduct.sku || targetProduct.name)}${ext}`;
    const destinationPath = path.join(CATALOG_UPLOAD_DIR, catalogFileName);

    fs.copyFileSync(sourcePath, destinationPath);

    // If publishing as primary, demote existing primary images
    if (isPrimary) {
      await this.mediaRepo.update({ productId: targetProduct.id }, { isPrimary: false });
    }

    // Insert official product media entry
    const publicMediaUrl = `/api/v1/wholesale/catalog-media/${catalogFileName}`;
    const newMedia = this.mediaRepo.create({
      productId: targetProduct.id,
      originalUrl: publicMediaUrl,
      thumbnailUrl: publicMediaUrl,
      standardUrl: publicMediaUrl,
      hiResUrl: publicMediaUrl,
      isPrimary: isPrimary,
      altText: dto.altText || `${targetProduct.name} - Official Catalog Photo`,
      mediaType: 'image',
      fileSize: image.sizeBytes,
      mimeType: image.mimeType,
      sortOrder: dto.displayOrder ?? (isPrimary ? 0 : 1),
    });

    const savedMedia = await this.mediaRepo.save(newMedia);

    // Update submission status to COMPLETED
    submission.status = WholesaleSubmissionStatus.COMPLETED;
    submission.publishedToProductId = targetProduct.id;
    submission.reviewedById = adminUser.id || null;
    submission.reviewedByName = adminUser.fullName || adminUser.email || 'Admin';
    submission.reviewedAt = new Date();
    await this.submissionRepo.save(submission);

    // Audit log
    const history = this.historyRepo.create({
      submissionDbId: submission.id,
      actorRole: ActorRole.ADMIN,
      actorName: submission.reviewedByName,
      action: WholesaleSubmissionHistoryAction.PUBLISHED_TO_CATALOG,
      note: `Admin published proposed image "${image.originalName}" to official product catalog for "${targetProduct.name}" (SKU: ${targetProduct.sku}). Primary: ${dto.isPrimary}. ProductMedia ID: ${savedMedia.id}.`,
    });
    await this.historyRepo.save(history);

    this.logger.log(
      `Published wholesale image ${image.filename} to product ${targetProduct.name} (${targetProduct.id}) as ${
        dto.isPrimary ? 'PRIMARY' : 'SECONDARY'
      }`,
    );

    return {
      success: true,
      message: `Image successfully published to official product catalog for "${targetProduct.name}".`,
      data: {
        submissionId: submission.submissionId,
        productId: targetProduct.id,
        productName: targetProduct.name,
        media: savedMedia,
      },
    };
  }
}
