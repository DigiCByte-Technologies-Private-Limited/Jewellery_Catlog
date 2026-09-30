import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Location } from './entities/location.entity';
import { ItemTag } from './entities/item-tag.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Location, ItemTag, InventoryMovement, Product])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
