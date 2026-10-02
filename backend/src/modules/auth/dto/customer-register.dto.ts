import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerRegisterDto {
  @ApiProperty({ example: 'Rohan Sharma', description: 'Full legal name of the client' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  fullName: string;

  @ApiProperty({ example: 'rohan.sharma@example.com', description: 'Unique email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;

  @ApiProperty({ example: '9876543210', description: 'Primary 10-digit mobile number' })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^[+]?[0-9]{10,14}$/, {
    message: 'Please provide a valid 10-digit mobile number',
  })
  phone: string;

  @ApiProperty({ example: 'Flat 402, Royal Palms, MG Road', description: 'Delivery and billing street address' })
  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  address: string;

  @ApiProperty({ example: '400001', description: 'Postal area PIN code' })
  @IsString()
  @IsNotEmpty({ message: 'PIN code is required' })
  @Matches(/^[0-9]{4,8}$/, { message: 'PIN code must be a valid 4 to 8 digit code' })
  pincode: string;

  @ApiPropertyOptional({ example: 'Mumbai', description: 'City' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Maharashtra', description: 'State' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: '9811122233', description: 'Optional secondary phone number' })
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,14}$/, {
    message: 'Alternative phone number must be a valid mobile number',
  })
  altPhone?: string;

  @ApiPropertyOptional({ example: '9876543210', description: 'Optional WhatsApp dispatch contact number' })
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,14}$/, {
    message: 'WhatsApp number must be a valid mobile number',
  })
  whatsappNumber?: string;

  @ApiProperty({ example: 'ClientPass@1234', minLength: 6, description: 'Secure account password' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiProperty({ example: 'ClientPass@1234', description: 'Confirmation password matching the above' })
  @IsString()
  @IsNotEmpty({ message: 'Please confirm your password' })
  confirmPassword: string;
}
