import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsUUID,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmittedImageItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  fileId?: string;

  @IsOptional()
  @IsString()
  originalName?: string;

  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsNumber()
  sizeBytes?: number;

  @IsOptional()
  @IsNumber()
  size?: number;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  imageTitle?: string;

  @IsOptional()
  @IsString()
  imageDescription?: string;

  @IsOptional()
  @IsString()
  sourceReference?: string;
}

export class CreateWholesaleSubmissionDto {
  @IsString()
  customerName: string;

  @IsString()
  companyName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsString()
  productSku?: string;

  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  productCategory?: string;

  @IsOptional()
  @IsString()
  productSubcategory?: string;

  @IsOptional()
  @IsString()
  brandOrManufacturer?: string;

  @IsOptional()
  @IsString()
  productDescription?: string;

  @IsOptional()
  @IsString()
  productSpecifications?: string;

  @IsOptional()
  @IsString()
  dimensions?: string;

  @IsOptional()
  @IsString()
  colorOrVariant?: string;

  @IsOptional()
  @IsString()
  wholesaleQuantity?: string;

  @IsOptional()
  @IsString()
  additionalNotes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmittedImageItemDto)
  images?: SubmittedImageItemDto[];
}

