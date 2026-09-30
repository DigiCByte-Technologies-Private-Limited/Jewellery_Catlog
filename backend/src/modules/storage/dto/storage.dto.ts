import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';
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

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  limit?: number;
}
