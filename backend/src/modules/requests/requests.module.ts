import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductRequest } from './entities/request.entity';
import { RequestHistory } from './entities/request-history.entity';
import { Product } from '../products/entities/product.entity';
import { Store } from '../stores/entities/store.entity';
import { StoresModule } from '../stores/stores.module';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductRequest, RequestHistory, Product, Store]),
    StoresModule,
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
