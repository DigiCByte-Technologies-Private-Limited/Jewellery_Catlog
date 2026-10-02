import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { StorageService } from './storage.service';
import {
  CreateStorageFileDto,
  StorageFilterDto,
  UpdateStorageConfigDto,
  TestConnectionDto,
  UnifiedStorageFilterDto,
} from './dto/storage.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Storage & Media Management')
@Controller('storage')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('metrics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Get unified storage metrics across all application domains' })
  async getMetrics(@Query('quotaGb') quotaGb?: number) {
    const quota = quotaGb ? Number(quotaGb) : 50;
    const metrics = await this.storageService.getMetrics(quota);
    return { success: true, data: metrics };
  }

  @Get('unified-files')
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Browse all files across Media Library, KYC Vault, and Product Catalog' })
  async getUnifiedFiles(@Query() query: UnifiedStorageFilterDto) {
    return this.storageService.getUnifiedFiles(query);
  }

  @Get('settings')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get current storage server provider configuration' })
  async getConfig() {
    const config = await this.storageService.getConfig();
    return { success: true, data: config };
  }

  @Patch('settings')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update storage server provider settings (S3, Cloudflare R2, MinIO, Local)' })
  async updateConfig(@Body() dto: UpdateStorageConfigDto) {
    const updated = await this.storageService.updateConfig(dto);
    return { success: true, message: 'Storage provider configuration updated', data: updated };
  }

  @Post('settings/test-connection')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Test connectivity and permissions for storage server driver' })
  async testConnection(@Body() dto: TestConnectionDto) {
    return this.storageService.testConnection(dto);
  }

  @Get('diagnostics/orphans')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Scan disk and database for orphaned or missing files' })
  async getOrphanDiagnostics() {
    return this.storageService.getOrphanDiagnostics();
  }

  @Post('diagnostics/cleanup-orphans')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Clean up orphaned files on disk to reclaim storage space' })
  async cleanupOrphans() {
    return this.storageService.cleanupOrphans();
  }

  @Get('files')
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.AUDITOR)
  @ApiOperation({ summary: 'List media assets from storage_files table' })
  async findAll(@Query() query: StorageFilterDto) {
    const result = await this.storageService.findAll(query);
    return { success: true, ...result };
  }

  @Post('upload')
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Index an asset into the storage registry' })
  async uploadFile(@Body() dto: CreateStorageFileDto, @Req() req: Request) {
    const user = (req as any).user;
    const file = await this.storageService.create(dto, user?.email || user?.fullName);
    return { success: true, message: 'File indexed to storage registry', data: file };
  }

  @Delete('files/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a file from the storage registry' })
  async removeFile(@Param('id') id: string) {
    return this.storageService.remove(id);
  }
}
