import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { Customer } from '../customers/entities/customer.entity';
import { MetalRatesModule } from '../metal-rates/metal-rates.module';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Customer]), MetalRatesModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
