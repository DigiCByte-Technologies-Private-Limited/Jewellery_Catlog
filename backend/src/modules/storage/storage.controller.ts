import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { StorageService } from './storage.service';
import { CreateStorageFileDto, StorageFilterDto } from './dto/storage.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('metrics')
  async getMetrics(@Query('quotaGb') quotaGb?: number) {
    const quota = quotaGb ? Number(quotaGb) : 50;
    const metrics = await this.storageService.getMetrics(quota);
    return { success: true, data: metrics };
  }

  @Get('files')
  async findAll(@Query() query: StorageFilterDto) {
    const result = await this.storageService.findAll(query);
    return { success: true, ...result };
  }

  @Post('upload')
  async uploadFile(@Body() dto: CreateStorageFileDto, @Req() req: Request) {
    const user = (req as any).user;
    const file = await this.storageService.create(dto, user?.email || user?.fullName);
    return { success: true, message: 'File indexed to storage registry', data: file };
  }

  @Delete('files/:id')
  async removeFile(@Param('id') id: string) {
    const result = await this.storageService.remove(id);
    return result;
  }
}
