import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WholesaleSubmissionStatus } from '../../../common/enums';

export class UpdateWholesaleSubmissionStatusDto {
  @IsEnum(WholesaleSubmissionStatus)
  status: WholesaleSubmissionStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
