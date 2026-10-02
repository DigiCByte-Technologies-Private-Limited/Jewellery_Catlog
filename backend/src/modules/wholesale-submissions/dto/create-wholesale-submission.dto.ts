import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';
import { SubmittedImageItem } from '../entities/wholesale-product-submission.entity';

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
  images?: SubmittedImageItem[];
}
