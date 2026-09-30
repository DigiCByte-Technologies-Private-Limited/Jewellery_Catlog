import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enquiry } from './entities/enquiry.entity';
import { EnquiryStage, MetalType, Occasion } from '../../common/enums';

function generateEnquiryNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ENQ-${year}-${rand}`;
}

@Injectable()
export class EnquiriesService {
  constructor(
    @InjectRepository(Enquiry)
    private readonly enquiryRepo: Repository<Enquiry>,
  ) {}

  async getEnquiries(query: {
    stage?: EnquiryStage;
    metalType?: MetalType;
    occasion?: Occasion;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { stage, metalType, occasion, search, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const qb = this.enquiryRepo.createQueryBuilder('e').skip(skip).take(limit).orderBy('e.createdAt', 'DESC');

    if (stage) qb.andWhere('e.stage = :stage', { stage });
    if (metalType) qb.andWhere('e.metalType = :metalType', { metalType });
    if (occasion) qb.andWhere('e.occasion = :occasion', { occasion });
    if (search) {
      qb.andWhere('(LOWER(e.customerName) LIKE :search OR e.customerPhone LIKE :search OR LOWER(e.preferredCategory) LIKE :search)', {
        search: `%${search.toLowerCase()}%`,
      });
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      success: true,
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createEnquiry(dto: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    preferredCategory?: string;
    metalType?: MetalType;
    budgetMin?: number;
    budgetMax?: number;
    occasion?: Occasion;
    followUpDate?: string;
    assignedStaffName?: string;
    notes?: string;
  }) {
    const enquiryNumber = generateEnquiryNumber();

    let occasion = dto.occasion;
    if ((occasion as any) === 'WEDDING') occasion = Occasion.BRIDAL;

    const enquiry = this.enquiryRepo.create({
      ...dto,
      occasion,
      enquiryNumber,
      followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
      stage: EnquiryStage.NEW,
    } as any);

    await this.enquiryRepo.save(enquiry);
    return { success: true, message: `Enquiry ${enquiryNumber} logged`, data: enquiry };
  }

  async updateStage(id: string, stage: EnquiryStage) {
    const enquiry = await this.enquiryRepo.findOne({ where: { id } });
    if (!enquiry) throw new NotFoundException('Enquiry not found');

    enquiry.stage = stage;
    await this.enquiryRepo.save(enquiry);
    return { success: true, message: `Enquiry moved to ${stage}`, data: enquiry };
  }

  async updateEnquiry(id: string, dto: any) {
    const enquiry = await this.enquiryRepo.findOne({ where: { id } });
    if (!enquiry) throw new NotFoundException('Enquiry not found');

    if (dto.followUpDate) dto.followUpDate = new Date(dto.followUpDate);
    if ((dto.occasion as any) === 'WEDDING') dto.occasion = Occasion.BRIDAL;
    Object.assign(enquiry, dto);
    await this.enquiryRepo.save(enquiry);
    return { success: true, message: 'Enquiry updated', data: enquiry };
  }
}
