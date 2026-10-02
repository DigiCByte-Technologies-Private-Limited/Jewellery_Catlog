import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StorageDriver, MediaCategory } from '../../../common/enums';

export class CreateStorageFileDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  originalName: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsNumber()
  sizeBytes: number;

  @IsEnum(StorageDriver)
  @IsOptional()
  driver?: StorageDriver;

  @IsEnum(MediaCategory)
  @IsOptional()
  category?: MediaCategory;

  @IsString()
  @IsNotEmpty()
  publicUrl: string;

  @IsString()
  @IsNotEmpty()
  storagePath: string;

  @IsNumber()
  @IsOptional()
  width?: number;

  @IsNumber()
  @IsOptional()
  height?: number;

  @IsString()
  @IsOptional()
  checksum?: string;
}

export class StorageFilterDto {
  @IsEnum(MediaCategory)
  @IsOptional()
  category?: MediaCategory;

  @IsString()
  @IsOptional()
  search?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

export class UpdateStorageConfigDto {
  @ApiPropertyOptional({ enum: StorageDriver })
  @IsEnum(StorageDriver)
  @IsOptional()
  activeDriver?: StorageDriver;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bucketName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endpoint?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  accessKeyId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  secretAccessKey?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  publicCdnUrl?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  enableAutoCompression?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  quotaLimitGb?: number;
}

export class TestConnectionDto {
  @ApiPropertyOptional({ enum: StorageDriver })
  @IsEnum(StorageDriver)
  @IsOptional()
  driver?: StorageDriver;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bucketName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endpoint?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  accessKeyId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  secretAccessKey?: string;
}

export class UnifiedStorageFilterDto {
  @ApiPropertyOptional({ description: 'Filter by domain e.g. PRODUCT_CATALOG, WHOLESALE_KYC, MEDIA_LIBRARY, CUSTOM_DESIGNS' })
  @IsString()
  @IsOptional()
  domain?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by type e.g. image, pdf, video' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;
}
