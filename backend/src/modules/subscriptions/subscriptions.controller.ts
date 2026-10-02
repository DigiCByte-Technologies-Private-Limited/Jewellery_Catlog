import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import {
  UpgradeSubscriptionDto,
  UpdateFeaturesDto,
  B2BSubscribeDto,
} from './dto/subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Subscriptions & Invoicing')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subsService: SubscriptionsService) {}

  @Get('current')
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Get showroom current ERP subscription plan and license quotas' })
  async getCurrent() {
    const sub = await this.subsService.getCurrent();
    return { success: true, data: sub };
  }

  @Get('plans')
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Get all showroom ERP software tiers' })
  async getPlans() {
    const plans = await this.subsService.getPlans();
    return { success: true, data: plans };
  }

  @Post('upgrade')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Upgrade showroom ERP tier and generate official GST invoice' })
  async upgrade(@Body() dto: UpgradeSubscriptionDto) {
    const updated = await this.subsService.upgrade(dto);
    return { success: true, message: `Successfully upgraded to ${updated.tier} plan`, data: updated };
  }

  @Patch('features')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Toggle add-on modules and auto-renewal' })
  async updateFeatures(@Body() dto: UpdateFeaturesDto) {
    const updated = await this.subsService.updateFeatures(dto);
    return { success: true, message: 'Subscription configuration updated', data: updated };
  }

  @Get('invoices')
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.AUDITOR)
  @ApiOperation({ summary: 'List billing ledger & downloadable GST tax invoices' })
  async getInvoices() {
    const invoices = await this.subsService.getInvoices();
    return { success: true, data: invoices };
  }

  @Get('b2b-plans')
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Get B2B Wholesale Partner membership club tiers' })
  async getB2BPlans() {
    const plans = await this.subsService.getB2BPlans();
    return { success: true, data: plans };
  }

  @Get('b2b-subscribers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'List wholesale partners and their B2B membership tier status' })
  async getB2BSubscribers() {
    const subscribers = await this.subsService.getB2BSubscribers();
    return { success: true, data: subscribers };
  }

  @Post('b2b-subscribe')
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Subscribe or assign a B2B Wholesale Tier to a partner' })
  async subscribeB2BPartner(@Body() dto: B2BSubscribeDto) {
    return this.subsService.subscribeB2BPartner(dto);
  }
}
