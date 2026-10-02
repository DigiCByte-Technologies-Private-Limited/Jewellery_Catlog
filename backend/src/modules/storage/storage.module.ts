import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageFile } from './entities/storage-file.entity';
import { StorageConfig } from './entities/storage-config.entity';
import { WholesaleDocument } from '../wholesale-auth/entities/wholesale-document.entity';
import { ProductMedia } from '../products/entities/product-media.entity';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StorageFile,
      StorageConfig,
      WholesaleDocument,
      ProductMedia,
    ]),
  ],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
