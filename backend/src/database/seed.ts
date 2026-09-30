/**
 * Seed Script — run with: npx ts-node -r tsconfig-paths/register src/database/seed.ts
 * Creates: 1 Super Admin, base categories, metal rates for all purities, 3 sample products
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load .env
dotenv.config({ path: join(__dirname, '../../.env') });

// Import entities
import { User } from '../modules/users/entities/user.entity';
import { Category } from '../modules/categories/entities/category.entity';
import { MetalRate } from '../modules/metal-rates/entities/metal-rate.entity';
import { Product } from '../modules/products/entities/product.entity';
import { ProductStone } from '../modules/products/entities/product-stone.entity';
import { ProductMedia } from '../modules/products/entities/product-media.entity';
import { AuditLog } from '../modules/audit/entities/audit-log.entity';
import { Approval } from '../modules/approvals/entities/approval.entity';
import {
  UserRole,
  MetalType,
  MetalPurity,
  ProductStatus,
  PricingMode,
  MakingChargeType,
  ApprovalStatus,
  StoneType,
  StoneUnit,
  CategoryAudience,
  Occasion,
} from '../common/enums';

const AppDataSource = new DataSource({
  type: (process.env.DB_TYPE || 'postgres') as any,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || (process.env.DB_TYPE === 'mysql' ? '3306' : '5432')),
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASS || 'admin',
  database: process.env.DB_NAME || 'app_db',
  synchronize: true,
  logging: false,
  entities: [User, Category, MetalRate, Product, ProductStone, ProductMedia, AuditLog, Approval],
});

async function seed() {
  console.log('🌱 Connecting to database...');
  await AppDataSource.initialize();
  console.log('✅ Connected');

  // ── 1. Super Admin ───────────────────────────────────────────────────────
  const userRepo = AppDataSource.getRepository(User);
  let admin = await userRepo.findOne({ where: { email: 'admin@jewellery.com' } });

  if (!admin) {
    const passwordHash = await argon2.hash('Admin@1234', { type: argon2.argon2id });
    admin = userRepo.create({
      email: 'admin@jewellery.com',
      passwordHash,
      fullName: 'Super Administrator',
      phone: '+91 9000000000',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    });
    await userRepo.save(admin);
    console.log('👤 Super Admin created: admin@jewellery.com / Admin@1234');
  } else {
    console.log('👤 Super Admin already exists, skipping');
  }

  // ── 2. Categories ─────────────────────────────────────────────────────────
  const categoryRepo = AppDataSource.getTreeRepository(Category);

  const categoryData = [
    {
      name: 'Gold Jewellery',
      slug: 'gold-jewellery',
      defaultWastagePercent: 8,
      defaultMakingChargeType: MakingChargeType.PER_GRAM,
      defaultMakingChargeValue: 400,
      hsnCode: '7113',
      children: [
        { name: 'Necklaces', slug: 'gold-necklaces' },
        { name: 'Rings', slug: 'gold-rings' },
        { name: 'Bangles', slug: 'gold-bangles' },
        { name: 'Earrings', slug: 'gold-earrings' },
        { name: 'Pendants', slug: 'gold-pendants' },
        { name: 'Chains', slug: 'gold-chains' },
        { name: 'Bracelets', slug: 'gold-bracelets' },
      ],
    },
    {
      name: 'Silver Jewellery',
      slug: 'silver-jewellery',
      defaultWastagePercent: 5,
      defaultMakingChargeType: MakingChargeType.FLAT,
      defaultMakingChargeValue: 200,
      hsnCode: '7113',
      children: [
        { name: 'Silver Chains', slug: 'silver-chains' },
        { name: 'Silver Anklets', slug: 'silver-anklets' },
        { name: 'Silver Rings', slug: 'silver-rings' },
      ],
    },
    {
      name: 'Diamond Jewellery',
      slug: 'diamond-jewellery',
      defaultWastagePercent: 10,
      hsnCode: '7113',
      children: [
        { name: 'Diamond Rings', slug: 'diamond-rings' },
        { name: 'Diamond Earrings', slug: 'diamond-earrings' },
      ],
    },
  ];

  for (const catData of categoryData) {
    let parent = await categoryRepo.findOne({ where: { slug: catData.slug } });
    if (!parent) {
      parent = categoryRepo.create({
        name: catData.name,
        slug: catData.slug,
        defaultWastagePercent: catData.defaultWastagePercent,
        defaultMakingChargeType: catData.defaultMakingChargeType,
        defaultMakingChargeValue: catData.defaultMakingChargeValue,
        hsnCode: catData.hsnCode,
        isVisible: true,
        createdById: admin.id,
      });
      await categoryRepo.save(parent);
      console.log(`📁 Category: ${catData.name}`);
    }

    for (const child of catData.children || []) {
      const exists = await categoryRepo.findOne({ where: { slug: child.slug } });
      if (!exists) {
        const childCat = categoryRepo.create({
          name: child.name,
          slug: child.slug,
          parent,
          isVisible: true,
          createdById: admin.id,
        });
        await categoryRepo.save(childCat);
        console.log(`  └─ ${child.name}`);
      }
    }
  }

  // ── 3. Metal Rates (India 2024 approximate) ───────────────────────────────
  const rateRepo = AppDataSource.getRepository(MetalRate);

  const rates = [
    { metalType: MetalType.GOLD, purity: MetalPurity.K24, ratePerGram: 6200 },
    { metalType: MetalType.GOLD, purity: MetalPurity.K22, ratePerGram: 5683 },  // 6200 × 22/24
    { metalType: MetalType.GOLD, purity: MetalPurity.K18, ratePerGram: 4650 },  // 6200 × 18/24
    { metalType: MetalType.GOLD, purity: MetalPurity.K14, ratePerGram: 3617 },  // 6200 × 14/24
    { metalType: MetalType.SILVER, purity: MetalPurity.SILVER_999, ratePerGram: 78 },
    { metalType: MetalType.SILVER, purity: MetalPurity.SILVER_925, ratePerGram: 72.15 },
    { metalType: MetalType.PLATINUM, purity: MetalPurity.PLATINUM_950, ratePerGram: 3100 },
  ];

  for (const rate of rates) {
    const exists = await rateRepo.findOne({
      where: { metalType: rate.metalType, purity: rate.purity, isActive: true },
    });
    if (!exists) {
      const metalRate = rateRepo.create({
        ...rate,
        isActive: true,
        status: ApprovalStatus.APPROVED,
        effectiveFrom: new Date(),
        notes: 'Initial seed rate (approximate India 2024)',
        createdById: admin.id,
        approvedById: admin.id,
        approvedAt: new Date(),
      });
      await rateRepo.save(metalRate);
      console.log(`💰 Rate: ${rate.metalType} ${rate.purity} = ₹${rate.ratePerGram}/g`);
    }
  }

  // ── 4. Sample Products ────────────────────────────────────────────────────
  const productRepo = AppDataSource.getRepository(Product);
  const necklacesCat = await categoryRepo.findOne({ where: { slug: 'gold-necklaces' } });

  const sampleProducts = [
    {
      name: 'Classic 22K Gold Necklace',
      sku: 'GN-CL-001',
      slug: 'classic-22k-gold-necklace',
      shortDescription: 'Elegant 22K gold necklace, perfect for daily wear and festive occasions.',
      metalType: MetalType.GOLD,
      purity: MetalPurity.K22,
      grossWeight: 12.500,
      stoneWeight: 0,
      lacWeight: 0,
      netMetalWeight: 12.500,
      hasStones: false,
      pricingMode: PricingMode.DYNAMIC,
      wastagePercent: 8,
      makingChargeType: MakingChargeType.PER_GRAM,
      makingChargeValue: 450,
      majuriType: MakingChargeType.FLAT,
      majuriValue: 0,
      serviceCharges: 45,
      hsnCode: '7113',
      countryOfOrigin: 'India',
      status: ProductStatus.PUBLISHED,
      categoryId: necklacesCat?.id,
      audience: CategoryAudience.WOMEN,
      occasion: Occasion.DAILY_WEAR,
      metaTitle: 'Classic 22K Gold Necklace | Jewellery',
      metaDescription: 'Buy elegant 22K gold necklace. Hallmark certified. Daily wear design.',
    },
    {
      name: 'Bridal Kundan Necklace Set',
      sku: 'GN-KD-002',
      slug: 'bridal-kundan-necklace-set',
      shortDescription: 'Traditional Kundan bridal necklace set with polki stones.',
      metalType: MetalType.GOLD,
      purity: MetalPurity.K22,
      grossWeight: 35.000,
      stoneWeight: 5.200,
      lacWeight: 3.500,
      netMetalWeight: 26.300,
      hasStones: true,
      pricingMode: PricingMode.DYNAMIC,
      wastagePercent: 12,
      makingChargeType: MakingChargeType.PER_GRAM,
      makingChargeValue: 600,
      majuriType: MakingChargeType.FLAT,
      majuriValue: 2000,
      serviceCharges: 150,
      hsnCode: '7113',
      countryOfOrigin: 'India',
      status: ProductStatus.DRAFT,
      categoryId: necklacesCat?.id,
      audience: CategoryAudience.WOMEN,
      occasion: Occasion.BRIDAL,
    },
    {
      name: '18K Rose Gold Diamond Ring',
      sku: 'GR-DI-003',
      slug: '18k-rose-gold-diamond-ring',
      shortDescription: 'Solitaire 18K rose gold diamond ring. IGI certified diamond.',
      metalType: MetalType.GOLD,
      purity: MetalPurity.K18,
      grossWeight: 4.200,
      stoneWeight: 0.400,
      lacWeight: 0,
      netMetalWeight: 3.800,
      hasStones: true,
      pricingMode: PricingMode.DYNAMIC,
      wastagePercent: 10,
      makingChargeType: MakingChargeType.PERCENTAGE,
      makingChargeValue: 15,
      majuriType: MakingChargeType.FLAT,
      majuriValue: 500,
      serviceCharges: 200,
      hsnCode: '7113',
      countryOfOrigin: 'India',
      status: ProductStatus.PENDING_APPROVAL,
      categoryId: necklacesCat?.id,
      audience: CategoryAudience.WOMEN,
      occasion: Occasion.BRIDAL,
    },
  ];

  for (const pd of sampleProducts) {
    const exists = await productRepo.findOne({ where: { sku: pd.sku } });
    if (!exists) {
      const product = productRepo.create({ ...pd, createdById: admin.id, updatedById: admin.id } as any);
      await productRepo.save(product);
      console.log(`💍 Product: ${pd.name} (${pd.sku})`);
    }
  }

  console.log('\n✅ Seed complete!\n');
  console.log('─────────────────────────────────────────');
  console.log('🔑 Login credentials:');
  console.log('   Email:    admin@jewellery.com');
  console.log('   Password: Admin@1234');
  console.log('─────────────────────────────────────────');
  console.log('📚 API Docs: http://localhost:3000/api/docs');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
