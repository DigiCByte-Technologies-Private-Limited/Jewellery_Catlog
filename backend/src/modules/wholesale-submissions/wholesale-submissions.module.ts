import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WholesaleProductSubmission } from './entities/wholesale-product-submission.entity';
import { WholesaleSubmissionHistory } from './entities/wholesale-submission-history.entity';
import { Product } from '../products/entities/product.entity';
import { ProductMedia } from '../products/entities/product-media.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { WholesaleSubmissionsService } from './wholesale-submissions.service';
import { WholesaleSubmissionsController } from './wholesale-submissions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WholesaleProductSubmission,
      WholesaleSubmissionHistory,
      Product,
      ProductMedia,
    ]),
    NotificationsModule,
  ],
  controllers: [WholesaleSubmissionsController],
  providers: [WholesaleSubmissionsService],
  exports: [WholesaleSubmissionsService],
})
export class WholesaleSubmissionsModule {}
