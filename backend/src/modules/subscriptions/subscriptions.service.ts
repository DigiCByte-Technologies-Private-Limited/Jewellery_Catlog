import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionInvoice } from './entities/subscription-invoice.entity';
import { WholesalePartner } from '../wholesale-auth/entities/wholesale-partner.entity';
import {
  UpgradeSubscriptionDto,
  UpdateFeaturesDto,
  B2BSubscribeDto,
} from './dto/subscription.dto';
import { SubscriptionTier, SubscriptionStatus, BillingCycle } from '../../common/enums';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionInvoice)
    private readonly invoiceRepo: Repository<SubscriptionInvoice>,
    @InjectRepository(WholesalePartner)
    private readonly partnerRepo: Repository<WholesalePartner>,
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

  private readonly B2B_TIERS = [
    {
      id: 'STANDARD_WHOLESALE',
      name: 'Standard Wholesale Partner',
      tagline: 'Standard wholesale procurement terms',
      annualPrice: 0,
      makingChargeDiscountPercent: 0,
      creditLimitInr: 0,
      creditDays: 0,
      stockHoldHours: 24,
      priorityDispatch: false,
      features: [
        'Full wholesale digital catalog access',
        'Standard B2B trade pricing',
        'Advance payment on dispatch',
        'Standard order tracking',
      ],
    },
    {
      id: 'GOLD_B2B_PREMIUM',
      name: 'Gold Trade Partner',
      tagline: 'For established jewelers & repeat volume buyers',
      annualPrice: 14999,
      makingChargeDiscountPercent: 0.5,
      creditLimitInr: 500000,
      creditDays: 15,
      stockHoldHours: 72,
      priorityDispatch: true,
      features: [
        '0.50% Extra Discount on Gold Making Charges',
        '₹5,00,000 Rolling Credit Line (15 Days)',
        '72-Hour Stock Reservation Lock',
        'Priority artisan batch allocation',
        'Quarterly bullion trend analysis',
      ],
    },
    {
      id: 'PLATINUM_BULLION_CLUB',
      name: 'Platinum Bullion Elite',
      tagline: 'VIP tier for large multi-store retailers & bullion desks',
      annualPrice: 39999,
      makingChargeDiscountPercent: 1.25,
      creditLimitInr: 2500000,
      creditDays: 30,
      stockHoldHours: 120,
      priorityDispatch: true,
      features: [
        '1.25% Extra Discount on Gold Making Charges',
        '₹25,00,000 Rolling Credit Line (30 Days)',
        'Zero booking fee on Advance Rate-Lock Contracts',
        '24/7 Vault Security Dispatch & Same-Day Logistics',
        'Dedicated Senior Bullion Account Manager',
      ],
    },
  ];

  // ─── 1. SHOWROOM ERP SUBSCRIPTION ─────────────────────────────────────────

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

      // Seed initial tax invoices for billing history
      await this._seedInitialInvoices(sub);
    }

    return sub;
  }

  async upgrade(dto: UpgradeSubscriptionDto): Promise<Subscription> {
    const current = await this.getCurrent();
    const planConfig = this.PLANS.find((p) => p.tier === dto.tier) || this.PLANS[1];

    current.tier = dto.tier;
    current.billingCycle = dto.billingCycle;
    const basePrice = dto.billingCycle === BillingCycle.ANNUAL ? planConfig.annualPrice : planConfig.monthlyPrice;
    current.pricePerCycle = basePrice;
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
    current.lastPaymentReference = dto.paymentReference || `UPG-${Date.now().toString().slice(-6)}`;
    current.lastPaymentDate = now;
    if (dto.paymentMethod) {
      current.paymentMethod = dto.paymentMethod;
    }

    const saved = await this.subRepo.save(current);

    // Auto-generate official GST Tax Invoice (18% SAC 997331)
    const gstRate = 18;
    const gstAmount = Math.round((basePrice * 0.18) * 100) / 100;
    const totalAmount = Math.round((basePrice + gstAmount) * 100) / 100;
    const invoiceNum = `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    await this.invoiceRepo.save(
      this.invoiceRepo.create({
        invoiceNumber: invoiceNum,
        subscriptionId: saved.id,
        tier: saved.tier,
        billingCycle: saved.billingCycle,
        amount: basePrice,
        gstRate,
        gstAmount,
        totalAmount,
        sacCode: '997331',
        status: 'PAID',
        paymentMethod: current.paymentMethod || 'RAZORPAY_UPI',
        paymentReference: current.lastPaymentReference,
        periodStart: now,
        periodEnd: expiry,
        customerGstin: '27AABCK1234F1Z5',
        customerCompanyName: current.tenantName,
        customerAddress: '101, Zaveri Bazaar, Kalbadevi, Mumbai 400002',
      }),
    );

    return saved;
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

  // ─── 2. INVOICING & BILLING HISTORY ───────────────────────────────────────

  async getInvoices(): Promise<SubscriptionInvoice[]> {
    let invoices = await this.invoiceRepo.find({ order: { createdAt: 'DESC' } });
    if (invoices.length === 0) {
      const sub = await this.getCurrent();
      await this._seedInitialInvoices(sub);
      invoices = await this.invoiceRepo.find({ order: { createdAt: 'DESC' } });
    }
    return invoices;
  }

  // ─── 3. B2B WHOLESALE SUBSCRIPTIONS ───────────────────────────────────────

  async getB2BPlans() {
    return this.B2B_TIERS;
  }

  async getB2BSubscribers() {
    const partners = await this.partnerRepo.find({
      order: { createdAt: 'DESC' },
    });

    return partners.map((p) => {
      // Mock plan assignment or read from adminNotes
      const isPlatinum = p.adminNotes?.includes('PLATINUM_BULLION_CLUB');
      const isGold = p.adminNotes?.includes('GOLD_B2B_PREMIUM');
      const tierId = isPlatinum
        ? 'PLATINUM_BULLION_CLUB'
        : isGold
        ? 'GOLD_B2B_PREMIUM'
        : 'STANDARD_WHOLESALE';
      const tierConfig = this.B2B_TIERS.find((t) => t.id === tierId)!;

      return {
        id: p.id,
        applicationId: p.applicationId,
        companyName: p.companyName,
        ownerName: p.ownerName,
        phone: p.phone,
        status: p.status,
        tierId,
        tierName: tierConfig.name,
        creditLimitInr: tierConfig.creditLimitInr,
        creditDays: tierConfig.creditDays,
        makingChargeDiscountPercent: tierConfig.makingChargeDiscountPercent,
        joinedAt: p.createdAt,
      };
    });
  }

  async subscribeB2BPartner(dto: B2BSubscribeDto) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.partnerId);
    const partner = await this.partnerRepo.findOne({
      where: isUuid ? { id: dto.partnerId } : { applicationId: dto.partnerId },
    });

    if (!partner) {
      throw new NotFoundException('Wholesale partner not found');
    }

    const targetTierId = dto.tierId || dto.tierName || dto.tier;
    const tierConfig = this.B2B_TIERS.find((t) => t.id === targetTierId) || this.B2B_TIERS[1];
    const cycle = dto.billingCycle || BillingCycle.ANNUAL;

    const note = `[B2B Subscription Upgrade - ${new Date().toLocaleDateString('en-IN')}] Upgraded to ${tierConfig.name} (${cycle}). Credit Limit: ₹${tierConfig.creditLimitInr.toLocaleString('en-IN')}, Tier: ${tierConfig.id}`;
    partner.adminNotes = partner.adminNotes ? `${partner.adminNotes}\n${note}` : note;
    await this.partnerRepo.save(partner);

    let generatedInvoice: SubscriptionInvoice | null = null;
    if (tierConfig.annualPrice > 0) {
      const basePrice = tierConfig.annualPrice;
      const gstRate = 18;
      const gstAmount = Math.round(basePrice * 0.18 * 100) / 100;
      const totalAmount = Math.round((basePrice + gstAmount) * 100) / 100;
      const now = new Date();
      const expiry = new Date();
      expiry.setFullYear(now.getFullYear() + 1);
      const invoiceNum = `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      generatedInvoice = await this.invoiceRepo.save(
        this.invoiceRepo.create({
          invoiceNumber: invoiceNum,
          subscriptionId: partner.id,
          tier: (tierConfig.id.includes('PLATINUM') ? SubscriptionTier.ENTERPRISE : SubscriptionTier.PROFESSIONAL) as any,
          billingCycle: cycle,
          amount: basePrice,
          gstRate,
          gstAmount,
          totalAmount,
          sacCode: '997331',
          status: 'PAID',
          paymentMethod: dto.paymentMethod || 'RTGS_TRANSFER',
          paymentReference: dto.paymentReference || `B2B-${Date.now().toString().slice(-6)}`,
          periodStart: now,
          periodEnd: expiry,
          customerGstin: partner.gstNumber || '27AAECP1234D1Z9',
          customerCompanyName: partner.companyName,
          customerAddress: partner.address || partner.addressLine || `${partner.city || 'Mumbai'}, ${partner.state || 'Maharashtra'}`,
        }),
      );
    }

    return {
      success: true,
      message: `Partner ${partner.companyName} subscribed to ${tierConfig.name}`,
      invoice: generatedInvoice,
      data: {
        applicationId: partner.applicationId,
        companyName: partner.companyName,
        tier: tierConfig,
        billingCycle: cycle,
      },
    };
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private async _seedInitialInvoices(sub: Subscription) {
    const count = await this.invoiceRepo.count();
    if (count > 0) return;

    const baseAmount = 49999.00;
    const gstAmount = 8999.82;
    const total = 58998.82;

    await this.invoiceRepo.save([
      this.invoiceRepo.create({
        invoiceNumber: 'INV-2026-0042',
        subscriptionId: sub.id,
        tier: SubscriptionTier.PROFESSIONAL,
        billingCycle: BillingCycle.ANNUAL,
        amount: baseAmount,
        gstRate: 18.00,
        gstAmount,
        totalAmount: total,
        sacCode: '997331',
        status: 'PAID',
        paymentMethod: 'NET_BANKING_HDFC',
        paymentReference: 'HDFC_N2901928301',
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-12-31'),
        customerGstin: '27AABCK1234F1Z5',
        customerCompanyName: 'Kalyan Heritage Jewellers (Flagship)',
        customerAddress: '101, Zaveri Bazaar, Kalbadevi, Mumbai 400002',
      }),
      this.invoiceRepo.create({
        invoiceNumber: 'INV-2025-0018',
        subscriptionId: sub.id,
        tier: SubscriptionTier.STARTER,
        billingCycle: BillingCycle.ANNUAL,
        amount: 19999.00,
        gstRate: 18.00,
        gstAmount: 3599.82,
        totalAmount: 23598.82,
        sacCode: '997331',
        status: 'PAID',
        paymentMethod: 'RAZORPAY_UPI',
        paymentReference: 'pay_M801928401',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-12-31'),
        customerGstin: '27AABCK1234F1Z5',
        customerCompanyName: 'Kalyan Heritage Jewellers (Flagship)',
        customerAddress: '101, Zaveri Bazaar, Kalbadevi, Mumbai 400002',
      }),
    ]);
  }
}
