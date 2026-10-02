import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { StoresService } from '../stores/stores.service';
import {
  CreateProductRequestDto,
  UpdateProductRequestDto,
  QueryProductRequestsDto,
  AssignStoreDto,
  StoreFollowUpDto,
  StorePurchaseOutcomeDto,
} from './dto/product-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Product Inquiries & Store Requests')
@Controller('requests')
export class RequestsController {
  constructor(
    private readonly requestsService: RequestsService,
    private readonly storesService: StoresService,
  ) {}

  /**
   * 1. Public / Authenticated: Customer submits inquiry from website
   */
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit customer product inquiry (Public or Authenticated)' })
  @ApiResponse({ status: 201, description: 'Inquiry registered with unique Request ID' })
  createInquiry(@Body() dto: CreateProductRequestDto, @Req() req?: any) {
    const customerId = req?.user?.id || null;
    return this.requestsService.create(dto, customerId);
  }

  /**
   * 1.1 Customer Endpoint: Retrieve own submitted requests
   */
  @Get('my')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Customer gets their own inquiries' })
  findMyRequests(@Req() req: any) {
    return this.requestsService.findMyRequests(req.user.id);
  }

  /**
   * 2. Public Endpoint: Customer tracks their own request status by Request ID + Phone
   */
  @Get('track/:requestId')
  @ApiOperation({ summary: 'Customer tracks request status by Request ID and registered phone (Public)' })
  trackRequest(
    @Param('requestId') requestId: string,
    @Query('phone') phone: string,
  ) {
    return this.requestsService.trackRequestForCustomer(requestId, phone);
  }

  /**
   * 3. Admin / Store Endpoint: Pipeline stats breakdown
   */
  @Get('pipeline-stats')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get customer request pipeline & conversion stats' })
  getPipelineStats(@Query('storeId') storeId?: string, @Req() req?: any) {
    const effectiveStoreId =
      req?.user?.role === UserRole.STORE_MANAGER || req?.user?.role === UserRole.SALES_STAFF
        ? req?.user?.storeId
        : storeId;
    return this.requestsService.getPipelineStats(effectiveStoreId);
  }

  /**
   * 4. Backwards compatibility alias: /requests/stats
   */
  @Get('stats')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Alias for pipeline-stats' })
  getStats(@Query('storeId') storeId?: string, @Req() req?: any) {
    const effectiveStoreId =
      req?.user?.role === UserRole.STORE_MANAGER || req?.user?.role === UserRole.SALES_STAFF
        ? req?.user?.storeId
        : storeId;
    return this.requestsService.getPipelineStats(effectiveStoreId);
  }

  /**
   * 5. Admin / Store Endpoint: List inquiries with filters and pagination
   */
  @Get()
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List customer inquiries with filters, store scoping and pagination' })
  findAll(@Query() query: QueryProductRequestsDto, @Req() req?: any) {
    return this.requestsService.findAll(query, req?.user);
  }

  /**
   * 6. Admin / Store Endpoint: Get single request details
   */
  @Get(':id')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get single inquiry details with history timeline' })
  findOne(@Param('id') id: string, @Req() req?: any) {
    return this.requestsService.findOne(id, req?.user);
  }

  /**
   * 7. Admin Endpoint: Rank nearby stores for this request based on customer location
   */
  @Get(':id/nearby-stores')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Get stores ranked by proximity to this request customer' })
  async getNearbyStoresForRequest(@Param('id') id: string) {
    const res = await this.requestsService.findOne(id);
    const req = res.data;
    const lat = req.latitude ? Number(req.latitude) : undefined;
    const lng = req.longitude ? Number(req.longitude) : undefined;
    const data = await this.storesService.findNearby(lat, lng, req.city || undefined, req.state || undefined);
    return { success: true, data };
  }

  /**
   * 8. Admin Endpoint: Assign or reassign request to a nearby store
   */
  @Patch(':id/assign-store')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Assign request to a nearby store (Admin)' })
  assignStore(
    @Param('id') id: string,
    @Body() dto: AssignStoreDto,
    @Req() req?: any,
  ) {
    return this.requestsService.assignStore(id, dto, req?.user);
  }

  /**
   * 9. Store Endpoint: Log customer outreach or schedule follow-up
   */
  @Patch(':id/follow-up')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Store records customer contact or follow-up note' })
  recordFollowUp(
    @Param('id') id: string,
    @Body() dto: StoreFollowUpDto,
    @Req() req?: any,
  ) {
    return this.requestsService.recordFollowUp(id, dto, req?.user);
  }

  /**
   * 10. Store Endpoint: Record customer purchase outcome (APPROVED, REJECTED, PENDING)
   */
  @Patch(':id/purchase-outcome')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Record final customer purchase outcome (APPROVED / REJECTED / PENDING)' })
  recordPurchaseOutcome(
    @Param('id') id: string,
    @Body() dto: StorePurchaseOutcomeDto,
    @Req() req?: any,
  ) {
    return this.requestsService.recordPurchaseOutcome(id, dto, req?.user);
  }

  /**
   * 11. Admin Endpoint: Update basic details (adminNotes, priority)
   */
  @Patch(':id')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update inquiry basic details (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateProductRequestDto) {
    return this.requestsService.update(id, dto);
  }

  /**
   * 12. Admin Endpoint: Delete / Archive request
   */
  @Delete(':id')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Delete inquiry record (Super Admin / Manager)' })
  remove(@Param('id') id: string) {
    return this.requestsService.remove(id);
  }
}
