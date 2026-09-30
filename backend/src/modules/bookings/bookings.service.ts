import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Customer } from '../customers/entities/customer.entity';
import { MetalRatesService } from '../metal-rates/metal-rates.service';
import { BookingStatus, MetalType, MetalPurity } from '../../common/enums';

function generateBookingNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BK-${year}-${rand}`;
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly metalRatesService: MetalRatesService,
  ) {}

  async getBookings(query: { status?: BookingStatus; customerId?: string; page?: number; limit?: number }) {
    const { status, customerId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const qb = this.bookingRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.customer', 'customer')
      .leftJoinAndSelect('b.product', 'product')
      .skip(skip)
      .take(limit)
      .orderBy('b.createdAt', 'DESC');

    if (status) qb.andWhere('b.status = :status', { status });
    if (customerId) qb.andWhere('b.customerId = :customerId', { customerId });

    const [data, total] = await qb.getManyAndCount();
    return {
      success: true,
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createBooking(dto: {
    customerId: string;
    productId?: string;
    metalType: MetalType;
    purity: MetalPurity;
    estimatedGrossWeight: number;
    lockedMetalRatePerGram?: number;
    advanceAmountPaid: number;
    advancePaymentMode?: string;
    targetDeliveryDate?: string;
    notes?: string;
  }, userId?: string) {
    if (!dto.customerId) {
      throw new BadRequestException('customerId is required to create a booking');
    }
    const customer = await this.customerRepo.findOne({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    // If rate not explicitly provided, fetch today's active rate for purity to lock
    let lockedRate = dto.lockedMetalRatePerGram;
    if (!lockedRate) {
      const activeRate = await this.metalRatesService.getRateForPurity(dto.metalType, dto.purity);
      lockedRate = activeRate ? Number(activeRate.ratePerGram) : 5683;
    }

    const bookingNumber = generateBookingNumber();

    const booking = this.bookingRepo.create({
      bookingNumber,
      customerId: dto.customerId,
      productId: dto.productId ?? null,
      metalType: dto.metalType,
      purity: dto.purity,
      estimatedGrossWeight: dto.estimatedGrossWeight,
      lockedMetalRatePerGram: lockedRate,
      advanceAmountPaid: dto.advanceAmountPaid,
      advancePaymentMode: dto.advancePaymentMode || 'UPI',
      targetDeliveryDate: dto.targetDeliveryDate ? new Date(dto.targetDeliveryDate) : null,
      status: BookingStatus.CONFIRMED,
      notes: dto.notes ?? null,
      createdById: userId ?? null,
    } as any);

    await this.bookingRepo.save(booking);

    return {
      success: true,
      message: `Advance booking ${bookingNumber} created with locked rate ₹${lockedRate}/g`,
      data: booking,
    };
  }

  async updateStatus(id: string, status: BookingStatus) {
    const booking = await this.bookingRepo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');

    booking.status = status;
    await this.bookingRepo.save(booking);
    return { success: true, message: `Booking status changed to ${status}`, data: booking };
  }

  // ─── FINAL SETTLEMENT UPON DELIVERY (USING LOCKED RATE CONTRACT) ──────────
  async settleBooking(id: string, dto: {
    actualNetWeight: number;
    makingCharges: number;
    stoneValue?: number;
    discount?: number;
  }) {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: { customer: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status === BookingStatus.SETTLED) {
      throw new BadRequestException('Booking is already settled');
    }

    const lockedRate = Number(booking.lockedMetalRatePerGram);
    const netWeight = Number(dto.actualNetWeight);
    const metalValue = netWeight * lockedRate;
    const makingCharges = Number(dto.makingCharges || 0);
    const stoneValue = Number(dto.stoneValue || 0);
    const discount = Number(dto.discount || 0);

    const taxable = metalValue + makingCharges + stoneValue;
    const gst = taxable * 0.03;
    const totalPrice = Math.round(taxable + gst - discount);
    const advancePaid = Number(booking.advanceAmountPaid);
    const balancePayable = Math.max(0, totalPrice - advancePaid);

    booking.finalSettlementAmount = totalPrice;
    booking.status = BookingStatus.SETTLED;
    await this.bookingRepo.save(booking);

    // Update customer's total spend
    if (booking.customer) {
      booking.customer.totalSpend = Number(booking.customer.totalSpend || 0) + totalPrice;
      await this.customerRepo.save(booking.customer);
    }

    return {
      success: true,
      message: 'Booking settled successfully against locked rate contract',
      data: {
        booking,
        settlement: {
          lockedRate,
          actualNetWeight: netWeight,
          metalValue,
          makingCharges,
          stoneValue,
          taxable,
          gst,
          totalPrice,
          advancePaid,
          balancePayable,
        },
      },
    };
  }
}
