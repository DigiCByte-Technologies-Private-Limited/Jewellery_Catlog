import { IsOptional, IsString, Matches, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerProfileUpdateDto {
  @ApiPropertyOptional({ example: 'Rohan Sharma' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,14}$/, {
    message: 'Please provide a valid 10-digit mobile number',
  })
  phone?: string;

  @ApiPropertyOptional({ example: '9811122233' })
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,14}$/, {
    message: 'Alternative phone number must be a valid mobile number',
  })
  altPhone?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9]{10,14}$/, {
    message: 'WhatsApp number must be a valid mobile number',
  })
  whatsappNumber?: string;

  @ApiPropertyOptional({ example: 'Flat 402, Royal Palms, MG Road' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: '400001' })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{4,8}$/, { message: 'PIN code must be a valid 4 to 8 digit code' })
  pincode?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: '2018-12-10' })
  @IsDateString()
  @IsOptional()
  anniversaryDate?: string;
}
