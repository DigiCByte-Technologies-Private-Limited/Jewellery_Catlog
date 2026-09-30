import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { UpgradeSubscriptionDto, UpdateFeaturesDto } from './dto/subscription.dto';
import { SubscriptionTier, SubscriptionStatus, BillingCycle } from '../../common/enums';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
  ) {}

  private readonly PLANS = [
    {
      tier: SubscriptionTier.STARTER,
      name: 'Showroom Starter',
      description: 'Ideal for independent jewellery shops & boutiques',
      monthlyPrice: 1999,
      annualPrice: 19999,
      maxBranches: 1,
      maxUsers: 5,
      maxProducts: 1000,
      storageQuotaGb: 10,
      features: [
        'Live Metal Rate Ticker',
        '12-Step Jewellery Calculator',
        'Physical Inventory Tracking',
        'Basic CRM Directory',
        'Standard Tax Invoicing (GST 3%)',
      ],
    },
    {
      tier: SubscriptionTier.PROFESSIONAL,
      name: 'Jewellery Enterprise Pro',
      description: 'Full retail ERP for multi-branch showrooms & manufacturers',
      monthlyPrice: 4999,
      annualPrice: 49999,
      maxBranches: 5,
      maxUsers: 25,
      maxProducts: 10000,
      storageQuotaGb: 50,
      features: [
        'Live Metal Rate Ticker',
        '12-Step Jewellery Calculator',
        'BIS Hallmark HUID Vault Tracking',
        'Karigar Metal Reconciliation Ledger',
        'Old Gold XRF Karatmeter Appraisal',
        'Advance Rate-Lock Contracts',
        'Bridal CRM & Occasion Alerts',
        'Automated Daily Backups',
      ],
    },
    {
      tier: SubscriptionTier.ENTERPRISE,
      name: 'Omnichannel Bullion & Retail Group',
      description: 'For large chain retailers, bullion desks & franchise networks',
      monthlyPrice: 12999,
      annualPrice: 129999,
      maxBranches: 50,
      maxUsers: 100,
      maxProducts: 100000,
      storageQuotaGb: 500,
      features: [
        'Live Metal Rate Ticker',
        '12-Step Jewellery Calculator',
        'BIS Hallmark HUID Vault Tracking',
        'Karigar Metal Reconciliation Ledger',
        'Old Gold XRF Karatmeter Appraisal',
        'Advance Rate-Lock Contracts',
        'Bridal CRM & Occasion Alerts',
        'Automated Daily Backups',
        'Multi-Branch Transfer Dispatch',
        'Custom S3 / Cloudflare R2 Storage',
        'WhatsApp Bot Automation',
        'Dedicated Account Manager & 24/7 SLA',
      ],
    },
  ];

  async getPlans() {
    return this.PLANS;
  }

  async getCurrent(): Promise<Subscription> {
    const list = await this.subRepo.find({
      order: { createdAt: 'DESC' },
      take: 1,
    });
    let sub = list[0] || null;

    if (!sub) {
      // Auto-provision standard Professional plan for showroom
      const proPlan = this.PLANS[1];
      const now = new Date();
      const expiry = new Date();
      expiry.setFullYear(now.getFullYear() + 1);

      sub = this.subRepo.create({
        tenantName: 'Kalyan Heritage Jewellers (Flagship)',
        tier: SubscriptionTier.PROFESSIONAL,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: BillingCycle.ANNUAL,
        pricePerCycle: proPlan.annualPrice,
        startDate: now,
        expiryDate: expiry,
        maxBranches: proPlan.maxBranches,
        currentBranches: 1,
        maxUsers: proPlan.maxUsers,
        currentUsers: 4,
        maxProducts: proPlan.maxProducts,
        currentProducts: 24,
        storageQuotaGb: proPlan.storageQuotaGb,
        enabledFeatures: proPlan.features,
        autoRenew: true,
        lastPaymentReference: 'INV-SUB-2026-9081',
        lastPaymentDate: now,
        paymentMethod: 'NET_BANKING_HDFC',
      });

      sub = await this.subRepo.save(sub);
    }

    return sub;
  }

  async upgrade(dto: UpgradeSubscriptionDto): Promise<Subscription> {
    const current = await this.getCurrent();
    const planConfig = this.PLANS.find((p) => p.tier === dto.tier) || this.PLANS[1];

    current.tier = dto.tier;
    current.billingCycle = dto.billingCycle;
    current.pricePerCycle = dto.billingCycle === BillingCycle.ANNUAL ? planConfig.annualPrice : planConfig.monthlyPrice;
    current.maxBranches = planConfig.maxBranches;
    current.maxUsers = planConfig.maxUsers;
    current.maxProducts = planConfig.maxProducts;
    current.storageQuotaGb = planConfig.storageQuotaGb;
    current.enabledFeatures = planConfig.features;
    current.status = SubscriptionStatus.ACTIVE;

    const now = new Date();
    current.startDate = now;
    const expiry = new Date();
    if (dto.billingCycle === BillingCycle.ANNUAL) {
      expiry.setFullYear(now.getFullYear() + 1);
    } else {
      expiry.setMonth(now.getMonth() + 1);
    }
    current.expiryDate = expiry;
    current.lastPaymentReference = dto.paymentReference || `UPG-${Date.now()}`;
    current.lastPaymentDate = now;
    if (dto.paymentMethod) {
      current.paymentMethod = dto.paymentMethod;
    }

    return this.subRepo.save(current);
  }

  async updateFeatures(dto: UpdateFeaturesDto): Promise<Subscription> {
    const current = await this.getCurrent();
    current.enabledFeatures = dto.enabledFeatures;
    if (dto.autoRenew !== undefined) {
      current.autoRenew = dto.autoRenew;
    }
    if (dto.storageQuotaGb !== undefined) {
      current.storageQuotaGb = dto.storageQuotaGb;
    }
    return this.subRepo.save(current);
  }
}
