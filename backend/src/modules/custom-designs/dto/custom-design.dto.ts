import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PreferredContactMethod,
  CustomDesignStatus,
} from '../../../common/enums';
import { AttachmentFileItem } from '../entities/custom-design-request.entity';

export class CreateCustomDesignDto {
  @IsString()
  customerName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsString()
  productName: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsString()
  designDescription: string;

  @IsOptional()
  @IsString()
  designRequirements?: string;

  @IsOptional()
  @IsString()
  quantity?: string;

  @IsOptional()
  @IsString()
  materialRequirements?: string;

  @IsOptional()
  @IsString()
  dimensions?: string;

  @IsOptional()
  @IsString()
  additionalNotes?: string;

  @IsOptional()
  @IsEnum(PreferredContactMethod)
  preferredContactMethod?: PreferredContactMethod;

  @IsOptional()
  @IsArray()
  attachments?: AttachmentFileItem[];
}

export class UpdateCustomDesignStatusDto {
  @IsEnum(CustomDesignStatus)
  status: CustomDesignStatus;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class QueryCustomDesignDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CustomDesignStatus)
  status?: CustomDesignStatus;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
