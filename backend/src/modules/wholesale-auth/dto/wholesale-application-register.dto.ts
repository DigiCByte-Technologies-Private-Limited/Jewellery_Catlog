import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WholesaleApplicationRegisterDto {
  // ── Firm / Business Info ──
  @ApiProperty({ example: 'ABC Jewellers Ltd' })
  @IsString()
  @IsNotEmpty({ message: 'Business or Firm Name is required' })
  companyName: string;

  @ApiProperty({ example: '101, Jewel Arcade, Zaveri Bazaar' })
  @IsString()
  @IsNotEmpty({ message: 'Business address is required' })
  addressLine: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  city: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  @IsNotEmpty({ message: 'State is required' })
  state: string;

  @ApiProperty({ example: '400002' })
  @IsString()
  @IsNotEmpty({ message: 'Pincode is required' })
  pincode: string;

  @ApiPropertyOptional({ example: 'India', default: 'India' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'Wholesaler' })
  @IsOptional()
  @IsString()
  businessType?: string;

  // ── Shop Owner Info ──
  @ApiProperty({ example: 'Rajesh Kumar' })
  @IsString()
  @IsNotEmpty({ message: 'Shop owner name is required' })
  ownerName: string;

  @ApiProperty({ example: '+91 9876543210' })
  @IsString()
  @IsNotEmpty({ message: 'Owner phone number is required' })
  phone: string;

  @ApiPropertyOptional({ example: '+91 9876543210' })
  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  // ── Authentication Credentials ──
  @ApiProperty({ example: 'partner@abcjewellers.com' })
  @IsEmail({}, { message: 'A valid email address is required' })
  email: string;

  @ApiProperty({ example: 'SecurePass@123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiPropertyOptional({ example: 'SecurePass@123' })
  @IsOptional()
  @IsString()
  confirmPassword?: string;

  // ── Business Verification Details ──
  @ApiProperty({ example: 'ABCDE1234F' })
  @IsString()
  @IsNotEmpty({ message: 'PAN number is required' })
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
    message: 'PAN number must be valid 10 characters (e.g. ABCDE1234F)',
  })
  panNumber: string;

  @ApiPropertyOptional({ example: '123456789012' })
  @IsOptional()
  @IsString()
  aadhaarNumber?: string;

  @ApiPropertyOptional({ example: '27ABCDE1234F1Z5' })
  @IsOptional()
  @IsString()
  gstNumber?: string;
}
