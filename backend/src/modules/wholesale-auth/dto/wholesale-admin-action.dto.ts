import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WholesaleApplicationStatus, WholesaleDocumentStatus } from '../../../common/enums';

export class UpdateApplicationStatusDto {
  @ApiProperty({ enum: WholesaleApplicationStatus })
  @IsEnum(WholesaleApplicationStatus)
  status: WholesaleApplicationStatus;

  @ApiPropertyOptional({ example: 'PAN card image was illegible' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({ example: 'Verified GST on portal' })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class UpdateDocumentStatusDto {
  @ApiProperty({ enum: WholesaleDocumentStatus })
  @IsEnum(WholesaleDocumentStatus)
  status: WholesaleDocumentStatus;

  @ApiPropertyOptional({ example: 'Document expired or blurred' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class AddAdminNoteDto {
  @ApiProperty({ example: 'Checked with state commercial tax department' })
  @IsString()
  @IsNotEmpty()
  note: string;
}

export class WholesaleApplicationFilterDto {
  @ApiPropertyOptional({ enum: WholesaleApplicationStatus })
  @IsOptional()
  @Transform(({ value }) => (!value || value === '' ? undefined : value))
  @IsEnum(WholesaleApplicationStatus)
  status?: WholesaleApplicationStatus;

  @ApiPropertyOptional({ example: 'ABC Jewellers' })
  @IsOptional()
  @Transform(({ value }) => (!value || typeof value !== 'string' || value.trim() === '' ? undefined : value.trim()))
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
