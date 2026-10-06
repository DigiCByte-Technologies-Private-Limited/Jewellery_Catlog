import { IsOptional, IsString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { WholesaleSubmissionStatus } from '../../../common/enums';

export class QueryWholesaleSubmissionDto {
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
  @Transform(({ value }) => (!value || typeof value !== 'string' || value.trim() === '' ? undefined : value.trim()))
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => (!value || typeof value !== 'string' || value.trim() === '' ? undefined : value.trim()))
  @IsString()
  email?: string;

  @IsOptional()
  @Transform(({ value }) => (!value || typeof value !== 'string' || value.trim() === '' ? undefined : value.trim()))
  @IsString()
  phone?: string;

  @IsOptional()
  @Transform(({ value }) => (!value || value === '' ? undefined : value))
  @IsEnum(WholesaleSubmissionStatus)
  status?: WholesaleSubmissionStatus;

  @IsOptional()
  @Transform(({ value }) => (!value || typeof value !== 'string' || value.trim() === '' ? undefined : value.trim()))
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @Transform(({ value }) => (!value || value === '' ? undefined : value))
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
