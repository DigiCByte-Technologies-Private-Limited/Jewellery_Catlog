import { IsEnum, IsOptional, IsString, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { SubscriptionTier, BillingCycle } from '../../../common/enums';

export class UpgradeSubscriptionDto {
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @IsString()
  @IsOptional()
  paymentReference?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;
}

export class UpdateFeaturesDto {
  @IsArray()
  enabledFeatures: string[];

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @IsNumber()
  @IsOptional()
  storageQuotaGb?: number;
}
