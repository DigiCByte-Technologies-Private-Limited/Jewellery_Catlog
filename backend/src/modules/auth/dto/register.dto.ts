import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: '+91 9876543210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.SALES_STAFF })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
