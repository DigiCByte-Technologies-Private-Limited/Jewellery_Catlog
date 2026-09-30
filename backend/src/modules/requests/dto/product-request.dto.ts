import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RequestStatus,
  RequestPriority,
  PreferredContactMethod,
  PurchaseStatus,
  PurchaseRejectionReason,
} from '../../../common/enums';

export class CreateProductRequestDto {
  @ApiProperty({ example: 'Rahul Kumar', description: 'Customer full name' })
  @IsNotEmpty({ message: 'Customer name is required' })
  @IsString()
  customerName: string;

  @ApiProperty({ example: 'rahul@example.com', description: 'Customer email' })
  @IsNotEmpty({ message: 'Email address is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: '+91 9876543210', description: 'Customer phone number' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'ABC Enterprises', description: 'Company name' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: 'Vijayawada', description: 'Customer city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Andhra Pradesh', description: 'Customer state' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 16.506174 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 80.648015 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'a06f48e1-1db3-42b8-81e5-39ef8d37630e', description: 'Associated Product UUID' })
  @IsOptional()
  @IsUUID('4', { message: 'Invalid product ID' })
  productId?: string;

  @ApiProperty({ example: 'Kundan Polki Choker Necklace', description: 'Product title / name' })
  @IsNotEmpty({ message: 'Product name is required' })
  @IsString()
  productName: string;

  @ApiProperty({ example: 'I am interested in purchasing this product. Please contact regarding availability and price.', description: 'Inquiry requirement message' })
  @IsNotEmpty({ message: 'Message is required' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ example: '5 units', description: 'Quantity required' })
  @IsOptional()
  @IsString()
  quantity?: string;

  @ApiPropertyOptional({ example: 'India', description: 'Customer country' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ enum: PreferredContactMethod, example: PreferredContactMethod.EMAIL })
  @IsOptional()
  @IsEnum(PreferredContactMethod)
  preferredContactMethod?: PreferredContactMethod;

  @ApiPropertyOptional({ example: '22K Hallmarked gold with certification', description: 'Technical specifications' })
  @IsOptional()
  @IsString()
  technicalRequirement?: string;
}

export class UpdateProductRequestDto {
  @ApiPropertyOptional({ enum: RequestStatus })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiPropertyOptional({ enum: PurchaseStatus })
  @IsOptional()
  @IsEnum(PurchaseStatus)
  purchaseStatus?: PurchaseStatus;

  @ApiPropertyOptional({ enum: RequestPriority })
  @IsOptional()
  @IsEnum(RequestPriority)
  priority?: RequestPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchaseNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchaseReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  assignedStoreId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  assignedToUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  followUpAt?: string;
}

export class AssignStoreDto {
  @ApiProperty({ example: 'a06f48e1-1db3-42b8-81e5-39ef8d37630e', description: 'Store UUID' })
  @IsNotEmpty({ message: 'Store ID is required' })
  @IsUUID('4')
  storeId: string;

  @ApiPropertyOptional({ example: 'Assigned to nearest branch with stock available.' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class StoreFollowUpDto {
  @ApiProperty({ example: 'Contacted customer by phone. Discussed 22K rate and delivery schedule.' })
  @IsNotEmpty({ message: 'Follow-up note is required' })
  @IsString()
  note: string;

  @ApiPropertyOptional({ example: '2026-10-05T10:00:00.000Z' })
  @IsOptional()
  @IsString()
  nextFollowUpDate?: string;

  @ApiPropertyOptional({ example: 'Customer visiting store on weekend.' })
  @IsOptional()
  @IsString()
  customerResponse?: string;
}

export class StorePurchaseOutcomeDto {
  @ApiProperty({ enum: PurchaseStatus, example: PurchaseStatus.APPROVED, description: 'Final customer purchase outcome: APPROVED (customer bought), REJECTED (customer declined), PENDING (still deciding)' })
  @IsNotEmpty({ message: 'Purchase status is required' })
  @IsEnum(PurchaseStatus)
  purchaseStatus: PurchaseStatus;

  @ApiPropertyOptional({ enum: PurchaseRejectionReason, example: PurchaseRejectionReason.CUSTOMER_DECLINED, description: 'Required if purchaseStatus is REJECTED' })
  @IsOptional()
  @IsString()
  purchaseReason?: string;

  @ApiPropertyOptional({ example: 'Customer completed purchase in Vijayawada showroom. Invoice #INV-8821.' })
  @IsOptional()
  @IsString()
  purchaseNotes?: string;

  @ApiPropertyOptional({ example: '2026-10-08T10:00:00.000Z', description: 'Required if purchaseStatus remains PENDING' })
  @IsOptional()
  @IsString()
  nextFollowUpDate?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  confirmedQuantity?: number;
}

export class QueryProductRequestsDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ example: 'Rahul' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: RequestStatus })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiPropertyOptional({ enum: PurchaseStatus })
  @IsOptional()
  @IsEnum(PurchaseStatus)
  purchaseStatus?: PurchaseStatus;

  @ApiPropertyOptional({ enum: RequestPriority })
  @IsOptional()
  @IsEnum(RequestPriority)
  priority?: RequestPriority;

  @ApiPropertyOptional({ description: 'Filter by assigned store UUID' })
  @IsOptional()
  @IsUUID('4')
  storeId?: string;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], example: 'DESC' })
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';
}
