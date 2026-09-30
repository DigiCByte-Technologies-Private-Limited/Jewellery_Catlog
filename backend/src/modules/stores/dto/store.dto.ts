import { IsString, IsOptional, IsNumber, IsBoolean, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoreDto {
  @ApiProperty({ example: 'Vijayawada Showroom' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'STR-VIJ-01' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Vijayawada' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Andhra Pradesh' })
  @IsString()
  state: string;

  @ApiPropertyOptional({ example: 'MG Road, Governorpet, Vijayawada' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '+91 866 247 1234' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'vijayawada@jewellery.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 16.506174 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 80.648015 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateStoreDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
