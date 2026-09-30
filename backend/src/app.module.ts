import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import databaseConfig from './config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { MetalRatesModule } from './modules/metal-rates/metal-rates.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { ProductsModule } from './modules/products/products.module';
import { AuditModule } from './modules/audit/audit.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { KarigarModule } from './modules/karigar/karigar.module';
import { OldGoldModule } from './modules/old-gold/old-gold.module';
import { CustomersModule } from './modules/customers/customers.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { EnquiriesModule } from './modules/enquiries/enquiries.module';
import { StorageModule } from './modules/storage/storage.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { RequestsModule } from './modules/requests/requests.module';
import { StoresModule } from './modules/stores/stores.module';

@Module({
  imports: [
    // Config (global)
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
        autoLoadEntities: true,
        synchronize: process.env.NODE_ENV !== 'production',
      }),
    }),

    // Rate limiting: 100 requests per 60 seconds
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Feature modules
    AuthModule,
    UsersModule,
    CategoriesModule,
    MetalRatesModule,
    PricingModule,
    ProductsModule,
    AuditModule,
    ApprovalsModule,
    InventoryModule,
    KarigarModule,
    OldGoldModule,
    CustomersModule,
    BookingsModule,
    EnquiriesModule,
    StorageModule,
    SubscriptionsModule,
    RequestsModule,
    StoresModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
