import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'P@ssword123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsString()
  @IsOptional()
  fullName?: string;
}
