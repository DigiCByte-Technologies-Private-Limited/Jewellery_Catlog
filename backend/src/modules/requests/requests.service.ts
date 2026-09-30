import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductRequest } from './entities/request.entity';
import { RequestHistory } from './entities/request-history.entity';
import { Store } from '../stores/entities/store.entity';
import { StoresService } from '../stores/stores.service';
import {
  CreateProductRequestDto,
  UpdateProductRequestDto,
  QueryProductRequestsDto,
  AssignStoreDto,
  StoreFollowUpDto,
  StorePurchaseOutcomeDto,
} from './dto/product-request.dto';
import {
  RequestStatus,
  RequestPriority,
  PurchaseStatus,
  RequestHistoryAction,
  ActorRole,
  UserRole,
} from '../../common/enums';

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    @InjectRepository(ProductRequest)
    private readonly requestRepo: Repository<ProductRequest>,
    @InjectRepository(RequestHistory)
    private readonly historyRepo: Repository<RequestHistory>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    private readonly storesService: StoresService,
  ) {}

  /**
   * Generates sequential Request IDs with fallback collision check: REQ-000001
   */
  private async generateRequestId(): Promise<string> {
    const count = await this.requestRepo.count();
    let nextNum = count + 1;
    let candidate = `REQ-${String(nextNum).padStart(6, '0')}`;

    while (await this.requestRepo.findOne({ where: { requestId: candidate } })) {
      nextNum++;
      candidate = `REQ-${String(nextNum).padStart(6, '0')}`;
    }

    return candidate;
  }

  /**
   * 1. Public: Customer submits product inquiry from website
   */
  async create(dto: CreateProductRequestDto) {
    const requestId = await this.generateRequestId();

    const request = this.requestRepo.create({
      ...dto,
      requestId,
      status: RequestStatus.NEW,
      purchaseStatus: PurchaseStatus.PENDING,
      priority: RequestPriority.NORMAL,
      assignedStoreId: null,
      adminNotes: null,
    });

    const savedRequest = await this.requestRepo.save(request);

    // Record initial history event
    const history = this.historyRepo.create({
      requestId: savedRequest.id,
      actorRole: ActorRole.CUSTOMER,
      actorName: dto.customerName,
      action: RequestHistoryAction.REQUEST_CREATED,
      note: `Inquiry submitted from customer website for "${dto.productName}". Location: ${dto.city || 'Unspecified'}, ${dto.state || ''}`,
    });
    await this.historyRepo.save(history);

    this.logger.log(`Created Product Request ${requestId} for customer ${dto.customerName}`);

    return {
      success: true,
      message: 'Inquiry submitted successfully',
      data: savedRequest,
    };
  }

  /**
   * 2. Pipeline Analytics Breakdown for Admin Dashboard
   */
  async getPipelineStats(storeId?: string) {
    const baseWhere = storeId ? { assignedStoreId: storeId } : {};

    const [
      total,
      newCount,
      assignedCount,
      followUpCount,
      completedCount,
      pendingPurchases,
      approvedPurchases,
      rejectedPurchases,
    ] = await Promise.all([
      this.requestRepo.count({ where: baseWhere }),
      this.requestRepo.count({ where: { ...baseWhere, status: RequestStatus.NEW } }),
      this.requestRepo.count({ where: { ...baseWhere, status: RequestStatus.ASSIGNED } }),
      this.requestRepo.count({ where: { ...baseWhere, status: RequestStatus.FOLLOW_UP } }),
      this.requestRepo.count({ where: { ...baseWhere, status: RequestStatus.COMPLETED } }),
      this.requestRepo.count({ where: { ...baseWhere, purchaseStatus: PurchaseStatus.PENDING } }),
      this.requestRepo.count({ where: { ...baseWhere, purchaseStatus: PurchaseStatus.APPROVED } }),
      this.requestRepo.count({ where: { ...baseWhere, purchaseStatus: PurchaseStatus.REJECTED } }),
    ]);

    const decided = approvedPurchases + rejectedPurchases;
    const conversionRate = decided > 0 ? Math.round((approvedPurchases / decided) * 100) : 0;

    return {
      success: true,
      data: {
        total,
        new: newCount,
        assigned: assignedCount,
        followUp: followUpCount,
        completed: completedCount,
        pendingPurchases,
        approved: approvedPurchases,
        rejected: rejectedPurchases,
        conversionRate,
      },
    };
  }

  /**
   * 3. Admin / Store List Requests with Filters and Role-based Store Isolation
   */
  async findAll(query: QueryProductRequestsDto, user?: any) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      purchaseStatus,
      priority,
      storeId,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const qb = this.requestRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.product', 'p')
      .leftJoinAndSelect('p.media', 'pm')
      .leftJoinAndSelect('r.assignedStore', 's');

    // Role-based Store Isolation: Store managers/staff only see their store's requests
    if (user && (user.role === UserRole.STORE_MANAGER || user.role === UserRole.SALES_STAFF)) {
      if (user.storeId) {
        qb.andWhere('r.assignedStoreId = :scopedStoreId', { scopedStoreId: user.storeId });
      }
    } else if (storeId) {
      qb.andWhere('r.assignedStoreId = :storeId', { storeId });
    }

    if (search) {
      qb.andWhere(
        '(LOWER(r.customerName) LIKE :search OR LOWER(r.email) LIKE :search OR r.phone LIKE :search OR LOWER(r.requestId) LIKE :search OR LOWER(r.productName) LIKE :search OR LOWER(r.city) LIKE :search)',
        { search: `%${search.toLowerCase().trim()}%` },
      );
    }

    if (status) {
      qb.andWhere('r.status = :status', { status });
    }

    if (purchaseStatus) {
      qb.andWhere('r.purchaseStatus = :purchaseStatus', { purchaseStatus });
    }

    if (priority) {
      qb.andWhere('r.priority = :priority', { priority });
    }

    const allowedSortFields: Record<string, string> = {
      createdAt: 'r.createdAt',
      updatedAt: 'r.updatedAt',
      requestId: 'r.requestId',
      customerName: 'r.customerName',
      status: 'r.status',
      purchaseStatus: 'r.purchaseStatus',
      priority: 'r.priority',
    };

    const sortColumn = allowedSortFields[sortBy] || 'r.createdAt';
    const direction = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(sortColumn, direction);

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      success: true,
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 4. Single Request Details with Store Info and Chronological History Timeline
   */
  async findOne(id: string, user?: any) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const qb = this.requestRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.product', 'p')
      .leftJoinAndSelect('p.media', 'pm')
      .leftJoinAndSelect('p.category', 'pc')
      .leftJoinAndSelect('r.assignedStore', 's')
      .leftJoinAndSelect('r.history', 'h');

    if (isUuid) {
      qb.where('r.id = :id', { id });
    } else {
      qb.where('r.requestId = :id', { id });
    }

    qb.orderBy('h.createdAt', 'ASC');

    const request = await qb.getOne();

    if (!request) {
      throw new NotFoundException(`Request '${id}' not found`);
    }

    // Role-based store isolation
    if (
      user &&
      (user.role === UserRole.STORE_MANAGER || user.role === UserRole.SALES_STAFF) &&
      user.storeId
    ) {
      if (request.assignedStoreId !== user.storeId) {
        throw new ForbiddenException('You only have permission to view requests assigned to your store');
      }
    }

    return {
      success: true,
      data: request,
    };
  }

  /**
   * 5. Admin assigns or reassigns customer request to nearby store
   */
  async assignStore(id: string, dto: AssignStoreDto, user?: any) {
    const res = await this.findOne(id);
    const request = res.data;

    const store = await this.storeRepo.findOne({ where: { id: dto.storeId, isActive: true } });
    if (!store) {
      throw new BadRequestException('Selected store is not active or does not exist');
    }

    const isReassign = !!request.assignedStoreId;
    const previousStoreName = request.assignedStore?.name;

    request.assignedStoreId = store.id;
    request.assignedStore = store;
    request.assignedAt = new Date();

    if (request.status === RequestStatus.NEW) {
      request.status = RequestStatus.ASSIGNED;
    }

    await this.requestRepo.save(request);

    // Record audit trail
    const history = this.historyRepo.create({
      requestId: request.id,
      actorRole: ActorRole.ADMIN,
      actorId: user?.id || null,
      actorName: user?.fullName || 'Central Admin',
      action: isReassign ? RequestHistoryAction.STORE_REASSIGNED : RequestHistoryAction.STORE_ASSIGNED,
      note: isReassign
        ? `Reassigned from ${previousStoreName || 'Previous Store'} to ${store.name} (${store.city}). Note: ${dto.note || 'None'}`
        : `Assigned to ${store.name} (${store.city}). Note: ${dto.note || 'None'}`,
    });
    await this.historyRepo.save(history);

    this.logger.log(`Request ${request.requestId} assigned to store ${store.name}`);

    return {
      success: true,
      message: `Request ${request.requestId} successfully assigned to ${store.name}`,
      data: request,
    };
  }

  /**
   * 6. Store records customer outreach or sets follow-up reminder
   */
  async recordFollowUp(id: string, dto: StoreFollowUpDto, user?: any) {
    const res = await this.findOne(id, user);
    const request = res.data;

    request.status = RequestStatus.FOLLOW_UP;

    if (dto.nextFollowUpDate) {
      request.followUpAt = new Date(dto.nextFollowUpDate);
    }

    const appendNote = `[${new Date().toLocaleDateString('en-IN')}] ${dto.note}${dto.customerResponse ? ` (Customer: "${dto.customerResponse}")` : ''}`;
    request.purchaseNotes = request.purchaseNotes
      ? `${request.purchaseNotes}\n${appendNote}`
      : appendNote;

    await this.requestRepo.save(request);

    // Record history
    const history = this.historyRepo.create({
      requestId: request.id,
      actorRole: user?.role === UserRole.SUPER_ADMIN ? ActorRole.ADMIN : ActorRole.STORE,
      actorId: user?.id || null,
      actorName: user?.fullName || 'Store Representative',
      action: RequestHistoryAction.FOLLOW_UP_ADDED,
      note: dto.note + (dto.customerResponse ? ` — Customer Response: "${dto.customerResponse}"` : ''),
    });
    await this.historyRepo.save(history);

    return {
      success: true,
      message: 'Follow-up activity recorded successfully',
      data: request,
    };
  }

  /**
   * 7. Store records the customer's actual purchase outcome: APPROVED, REJECTED, or PENDING
   */
  async recordPurchaseOutcome(id: string, dto: StorePurchaseOutcomeDto, user?: any) {
    const res = await this.findOne(id, user);
    const request = res.data;

    request.purchaseStatus = dto.purchaseStatus;

    if (dto.purchaseStatus === PurchaseStatus.APPROVED) {
      request.status = RequestStatus.COMPLETED;
      request.purchaseConfirmedAt = new Date();
      if (dto.confirmedQuantity) {
        request.quantity = `${dto.confirmedQuantity} units`;
      }
      if (dto.purchaseNotes) {
        request.purchaseNotes = request.purchaseNotes
          ? `${request.purchaseNotes}\n[PURCHASE CONFIRMED] ${dto.purchaseNotes}`
          : `[PURCHASE CONFIRMED] ${dto.purchaseNotes}`;
      }

      const history = this.historyRepo.create({
        requestId: request.id,
        actorRole: user?.role === UserRole.SUPER_ADMIN ? ActorRole.ADMIN : ActorRole.STORE,
        actorId: user?.id || null,
        actorName: user?.fullName || 'Store Representative',
        action: RequestHistoryAction.PURCHASE_APPROVED,
        note: `Customer purchase confirmed! ${dto.purchaseNotes || ''}`,
      });
      await this.historyRepo.save(history);
    } else if (dto.purchaseStatus === PurchaseStatus.REJECTED) {
      request.status = RequestStatus.COMPLETED;
      request.purchaseReason = dto.purchaseReason || 'Customer declined';
      if (dto.purchaseNotes) {
        request.purchaseNotes = request.purchaseNotes
          ? `${request.purchaseNotes}\n[NOT PURCHASED] Reason: ${dto.purchaseReason}. ${dto.purchaseNotes}`
          : `[NOT PURCHASED] Reason: ${dto.purchaseReason}. ${dto.purchaseNotes}`;
      }

      const history = this.historyRepo.create({
        requestId: request.id,
        actorRole: user?.role === UserRole.SUPER_ADMIN ? ActorRole.ADMIN : ActorRole.STORE,
        actorId: user?.id || null,
        actorName: user?.fullName || 'Store Representative',
        action: RequestHistoryAction.PURCHASE_REJECTED,
        note: `Customer did not purchase. Reason: ${dto.purchaseReason || 'Declined'}. Notes: ${dto.purchaseNotes || 'None'}`,
      });
      await this.historyRepo.save(history);
    } else {
      // PENDING
      request.status = RequestStatus.FOLLOW_UP;
      if (dto.nextFollowUpDate) {
        request.followUpAt = new Date(dto.nextFollowUpDate);
      }
      if (dto.purchaseNotes) {
        request.purchaseNotes = request.purchaseNotes
          ? `${request.purchaseNotes}\n[PURCHASE PENDING] ${dto.purchaseNotes}`
          : `[PURCHASE PENDING] ${dto.purchaseNotes}`;
      }

      const history = this.historyRepo.create({
        requestId: request.id,
        actorRole: user?.role === UserRole.SUPER_ADMIN ? ActorRole.ADMIN : ActorRole.STORE,
        actorId: user?.id || null,
        actorName: user?.fullName || 'Store Representative',
        action: RequestHistoryAction.PURCHASE_PENDING,
        note: `Decision pending. ${dto.purchaseNotes || 'Customer still considering.'}`,
      });
      await this.historyRepo.save(history);
    }

    await this.requestRepo.save(request);

    return {
      success: true,
      message: `Customer purchase outcome updated to: ${dto.purchaseStatus}`,
      data: request,
    };
  }

  /**
   * 8. Public / Customer: Track Request Status with Phone Validation
   */
  async trackRequestForCustomer(requestId: string, phone: string) {
    if (!requestId || !phone) {
      throw new BadRequestException('Request ID and registered phone number are required');
    }

    const cleanRequestId = requestId.trim().toUpperCase();
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const request = await this.requestRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.product', 'p')
      .leftJoinAndSelect('p.media', 'pm')
      .leftJoinAndSelect('r.assignedStore', 's')
      .where('UPPER(r.requestId) = :cleanRequestId', { cleanRequestId })
      .getOne();

    if (!request) {
      throw new NotFoundException('No inquiry found matching this Request ID');
    }

    const storedPhoneClean = request.phone.replace(/[^0-9]/g, '');
    if (!storedPhoneClean.endsWith(cleanPhone.slice(-10)) && !cleanPhone.endsWith(storedPhoneClean.slice(-10))) {
      throw new ForbiddenException('Phone number verification failed for this Request ID');
    }

    // Customer-friendly status description
    let friendlyStatus = 'Your request has been received and is being prepared.';
    if (request.status === RequestStatus.ASSIGNED) {
      friendlyStatus = `Assigned to ${request.assignedStore?.name || 'our regional showroom'}. An associate will contact you shortly.`;
    } else if (request.status === RequestStatus.FOLLOW_UP) {
      friendlyStatus = `${request.assignedStore?.name || 'Store'} is currently assisting you with product details and availability.`;
    } else if (request.status === RequestStatus.COMPLETED) {
      friendlyStatus = request.purchaseStatus === PurchaseStatus.APPROVED
        ? 'Purchase confirmed! Thank you for choosing our showroom.'
        : 'Inquiry concluded.';
    }

    return {
      success: true,
      data: {
        requestId: request.requestId,
        productName: request.productName,
        quantity: request.quantity,
        productImage:
          request.product?.media?.find((m) => m.isPrimary)?.originalUrl ||
          request.product?.media?.[0]?.originalUrl ||
          request.product?.media?.[0]?.thumbnailUrl ||
          null,
        assignedStoreName: request.assignedStore?.name || 'Assigning nearest showroom...',
        assignedStoreCity: request.assignedStore?.city || null,
        assignedStorePhone: request.assignedStore?.phone || null,
        operationalStatus: request.status,
        purchaseStatus: request.purchaseStatus,
        statusMessage: friendlyStatus,
        createdAt: request.createdAt,
      },
    };
  }

  /**
   * 9. Update basic fields (Admin)
   */
  async update(id: string, dto: UpdateProductRequestDto) {
    const res = await this.findOne(id);
    const request = res.data;

    Object.assign(request, dto);
    await this.requestRepo.save(request);

    return {
      success: true,
      message: `Request ${request.requestId} updated successfully`,
      data: request,
    };
  }

  /**
   * 10. Admin: Delete / Archive request
   */
  async remove(id: string) {
    const res = await this.findOne(id);
    await this.requestRepo.remove(res.data);
    return {
      success: true,
      message: `Request ${res.data.requestId} deleted successfully`,
    };
  }
}
