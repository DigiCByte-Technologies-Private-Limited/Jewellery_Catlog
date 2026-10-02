import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionTier, BillingCycle } from '../../../common/enums';

export class UpgradeSubscriptionDto {
  @ApiProperty({ enum: SubscriptionTier })
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @ApiProperty({ enum: BillingCycle })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paymentReference?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paymentMethod?: string;
}

export class UpdateFeaturesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  enabledFeatures: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  storageQuotaGb?: number;
}

export class B2BSubscribeDto {
  @ApiProperty({ example: 'WH-2026-0008 or UUID' })
  @IsString()
  @IsNotEmpty()
  partnerId: string;

  @ApiPropertyOptional({ example: 'PLATINUM_BULLION_CLUB' })
  @IsString()
  @IsOptional()
  tierName?: string;

  @ApiPropertyOptional({ example: 'PLATINUM_BULLION_CLUB' })
  @IsString()
  @IsOptional()
  tierId?: string;

  @ApiPropertyOptional({ example: 'PLATINUM_BULLION_CLUB' })
  @IsString()
  @IsOptional()
  tier?: string;

  @ApiPropertyOptional({ enum: BillingCycle, default: BillingCycle.ANNUAL })
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paymentReference?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paymentMethod?: string;
}
