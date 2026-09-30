import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  async getCustomers(query: { search?: string; tag?: string; page?: number; limit?: number }) {
    const { search, tag, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const qb = this.customerRepo.createQueryBuilder('c').skip(skip).take(limit).orderBy('c.createdAt', 'DESC');

    if (search) {
      qb.andWhere('(LOWER(c.fullName) LIKE :search OR c.phone LIKE :search OR LOWER(c.panNumber) LIKE :search)', {
        search: `%${search.toLowerCase()}%`,
      });
    }

    if (tag) {
      qb.andWhere('c.tags ::text LIKE :tag', { tag: `%"${tag}"%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      success: true,
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCustomer(id: string) {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    return { success: true, data: customer };
  }

  async createCustomer(dto: {
    fullName: string;
    phone: string;
    email?: string;
    panNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    dateOfBirth?: string;
    anniversaryDate?: string;
    tags?: string[];
    notes?: string;
  }) {
    const existing = await this.customerRepo.findOne({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException(`Customer with phone ${dto.phone} already exists`);

    const customer = this.customerRepo.create({
      ...dto,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
      anniversaryDate: dto.anniversaryDate ? new Date(dto.anniversaryDate) : null,
      tags: dto.tags ?? ['REGULAR'],
      totalSpend: 0,
    } as any);

    await this.customerRepo.save(customer);
    return { success: true, message: 'Customer profile registered', data: customer };
  }

  async updateCustomer(id: string, dto: any) {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');

    if (dto.dateOfBirth) dto.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.anniversaryDate) dto.anniversaryDate = new Date(dto.anniversaryDate);

    Object.assign(customer, dto);
    await this.customerRepo.save(customer);
    return { success: true, message: 'Customer updated', data: customer };
  }

  // ─── UPCOMING OCCASIONS (BIRTHDAYS & ANNIVERSARIES IN NEXT 30 DAYS) ────────
  async getUpcomingOccasions() {
    const customers = await this.customerRepo.find();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    const upcoming = customers
      .map((c) => {
        const events: any[] = [];
        if (c.dateOfBirth) {
          const dob = new Date(c.dateOfBirth);
          events.push({
            type: 'BIRTHDAY',
            date: dob,
            month: dob.getMonth(),
            day: dob.getDate(),
          });
        }
        if (c.anniversaryDate) {
          const ann = new Date(c.anniversaryDate);
          events.push({
            type: 'ANNIVERSARY',
            date: ann,
            month: ann.getMonth(),
            day: ann.getDate(),
          });
        }
        return { customer: c, events };
      })
      .filter((item) => item.events.length > 0);

    return { success: true, data: upcoming };
  }
}
