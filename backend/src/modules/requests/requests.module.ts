import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductRequest } from './entities/request.entity';
import { RequestHistory } from './entities/request-history.entity';
import { Product } from '../products/entities/product.entity';
import { Store } from '../stores/entities/store.entity';
import { WholesalePartner } from '../wholesale-auth/entities/wholesale-partner.entity';
import { User } from '../users/entities/user.entity';
import { StoresModule } from '../stores/stores.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductRequest,
      RequestHistory,
      Product,
      Store,
      WholesalePartner,
      User,
    ]),
    StoresModule,
    NotificationsModule,
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
