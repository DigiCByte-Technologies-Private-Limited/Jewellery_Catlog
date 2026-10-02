import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomDesignRequest } from './entities/custom-design-request.entity';
import { CustomDesignHistory } from './entities/custom-design-history.entity';
import { CustomDesignsController } from './custom-designs.controller';
import { CustomDesignsService } from './custom-designs.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomDesignRequest, CustomDesignHistory]),
    NotificationsModule,
  ],
  controllers: [CustomDesignsController],
  providers: [CustomDesignsService],
  exports: [CustomDesignsService],
})
export class CustomDesignsModule {}
