import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { StorageFile } from './entities/storage-file.entity';
import { CreateStorageFileDto, StorageFilterDto } from './dto/storage.dto';
import { MediaCategory } from '../../common/enums';

@Injectable()
export class StorageService {
  constructor(
    @InjectRepository(StorageFile)
    private readonly storageRepo: Repository<StorageFile>,
  ) {}

  async getMetrics(quotaLimitGb = 50) {
    const files = await this.storageRepo.find();

    const totalBytes = files.reduce((acc, f) => acc + Number(f.sizeBytes || 0), 0);
    const quotaBytes = quotaLimitGb * 1024 * 1024 * 1024;
    const usagePercent = quotaBytes > 0 ? Math.min(100, Math.round((totalBytes / quotaBytes) * 10000) / 100) : 0;

    // Category breakdown
    const categoryTotals: Record<string, { sizeBytes: number; count: number }> = {
      [MediaCategory.PRODUCT_IMAGE]: { sizeBytes: 0, count: 0 },
      [MediaCategory.CERTIFICATE_PDF]: { sizeBytes: 0, count: 0 },
      [MediaCategory.SHOWROOM_BANNER]: { sizeBytes: 0, count: 0 },
      [MediaCategory.SYSTEM_BACKUP]: { sizeBytes: 0, count: 0 },
    };

    for (const f of files) {
      if (!categoryTotals[f.category]) {
        categoryTotals[f.category] = { sizeBytes: 0, count: 0 };
      }
      categoryTotals[f.category].sizeBytes += Number(f.sizeBytes || 0);
      categoryTotals[f.category].count += 1;
    }

    const breakdown = Object.entries(categoryTotals).map(([cat, data]) => ({
      category: cat,
      count: data.count,
      sizeBytes: data.sizeBytes,
      sizeFormatted: this.formatBytes(data.sizeBytes),
      percentageOfTotal: totalBytes > 0 ? Math.round((data.sizeBytes / totalBytes) * 100) : 0,
    }));

    // Recent 5 files
    const recent = files
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalFiles: files.length,
      totalSizeBytes: totalBytes,
      totalSizeFormatted: this.formatBytes(totalBytes),
      quotaLimitGb,
      quotaLimitFormatted: `${quotaLimitGb} GB`,
      usagePercent,
      breakdown,
      recentUploads: recent,
    };
  }

  async findAll(filter: StorageFilterDto) {
    const { category, search, page = 1, limit = 50 } = filter;
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.originalName = Like(`%${search}%`);
    }

    const [items, total] = await this.storageRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(dto: CreateStorageFileDto, username?: string): Promise<StorageFile> {
    const file = this.storageRepo.create({
      ...dto,
      uploadedBy: username || 'SUPER_ADMIN',
    });
    return this.storageRepo.save(file);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const file = await this.storageRepo.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }
    await this.storageRepo.remove(file);
    return { success: true, message: `File ${file.originalName} removed from storage` };
  }

  private formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
