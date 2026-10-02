import { IsUUID, IsBoolean, IsOptional, IsString, IsNumber } from 'class-validator';

export class PublishToCatalogDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsString()
  fileId?: string; // The submitted image item ID

  @IsOptional()
  @IsNumber()
  imageIndex?: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  replacePrimary?: boolean;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  @IsString()
  altText?: string;
}
