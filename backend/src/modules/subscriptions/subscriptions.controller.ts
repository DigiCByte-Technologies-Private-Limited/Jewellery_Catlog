import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { UpgradeSubscriptionDto, UpdateFeaturesDto } from './dto/subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subsService: SubscriptionsService) {}

  @Get('current')
  async getCurrent() {
    const sub = await this.subsService.getCurrent();
    return { success: true, data: sub };
  }

  @Get('plans')
  async getPlans() {
    const plans = await this.subsService.getPlans();
    return { success: true, data: plans };
  }

  @Post('upgrade')
  async upgrade(@Body() dto: UpgradeSubscriptionDto) {
    const updated = await this.subsService.upgrade(dto);
    return { success: true, message: `Successfully upgraded to ${updated.tier} plan`, data: updated };
  }

  @Patch('features')
  async updateFeatures(@Body() dto: UpdateFeaturesDto) {
    const updated = await this.subsService.updateFeatures(dto);
    return { success: true, message: 'Subscription configuration updated', data: updated };
  }
}
