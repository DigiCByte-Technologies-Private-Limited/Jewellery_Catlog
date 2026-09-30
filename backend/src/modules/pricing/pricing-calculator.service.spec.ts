import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PricingCalculatorService } from './pricing-calculator.service';
import { MakingChargeType, PricingMode } from '../../common/enums';

describe('PricingCalculatorService', () => {
  let service: PricingCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PricingCalculatorService],
    }).compile();

    service = module.get<PricingCalculatorService>(PricingCalculatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Dynamic Pricing Mode', () => {
    it('should correctly calculate price with per-gram making charge and wastage', () => {
      // 10g Gold 22K at ₹5,000/g
      // Wastage 10% = 1g * 5000 = ₹5,000
      // Making Charge: ₹400/g = 10 * 400 = ₹4,000
      // Metal Value: 10 * 5000 = ₹50,000
      // Service charges: ₹45
      // Taxable: 50,000 + 5,000 + 4,000 + 45 = ₹59,045
      // GST 3%: 59,045 * 0.03 = ₹1,771.35
      // Final: 59,045 + 1,771.35 = ₹60,816.35 -> rounded ₹60,816
      const result = service.calculate({
        pricingMode: PricingMode.DYNAMIC,
        grossWeight: 10,
        metalRatePerGram: 5000,
        wastagePercent: 10,
        makingChargeType: MakingChargeType.PER_GRAM,
        makingChargeValue: 400,
        serviceCharges: 45,
        gstRatePercent: 3,
        roundTo: 1,
      });

      expect(result.netMetalWeight).toBe(10);
      expect(result.metalValue).toBe(50000);
      expect(result.wastageValue).toBe(5000);
      expect(result.makingChargesAmount).toBe(4000);
      expect(result.taxableAmount).toBe(59045);
      expect(result.gstAmount).toBe(1771.35);
      expect(result.finalPriceRounded).toBe(60816);
    });

    it('should deduct stone weight and lac weight from gross weight to get net metal weight', () => {
      // Gross: 15g, Stone: 2g, Lac: 1g => Net: 12g
      const result = service.calculate({
        pricingMode: PricingMode.DYNAMIC,
        grossWeight: 15,
        stoneWeight: 2,
        lacWeight: 1,
        metalRatePerGram: 6000,
      });

      expect(result.netMetalWeight).toBe(12);
      expect(result.metalValue).toBe(72000); // 12 * 6000
    });

    it('should throw BadRequestException if stone + lac weight exceeds gross weight', () => {
      expect(() => {
        service.calculate({
          pricingMode: PricingMode.DYNAMIC,
          grossWeight: 10,
          stoneWeight: 8,
          lacWeight: 5,
          metalRatePerGram: 6000,
        });
      }).toThrow(BadRequestException);
    });

    it('should calculate percentage-based making charge correctly', () => {
      // 10g Gold at ₹5,000/g = ₹50,000 metal value
      // MC: 15% of metal value = ₹7,500
      const result = service.calculate({
        pricingMode: PricingMode.DYNAMIC,
        grossWeight: 10,
        metalRatePerGram: 5000,
        makingChargeType: MakingChargeType.PERCENTAGE,
        makingChargeValue: 15,
      });

      expect(result.makingChargesAmount).toBe(7500);
    });

    it('should include stone value and majuri in taxable amount', () => {
      // Metal: 10g * ₹5,000 = ₹50,000
      // Stone value: ₹15,000
      // Majuri: ₹2,000 flat
      // Taxable: 50,000 + 15,000 + 2,000 = ₹67,000
      const result = service.calculate({
        pricingMode: PricingMode.DYNAMIC,
        grossWeight: 10,
        metalRatePerGram: 5000,
        totalStoneValue: 15000,
        majuriType: MakingChargeType.FLAT,
        majuriValue: 2000,
        gstRatePercent: 3,
      });

      expect(result.totalStoneValue).toBe(15000);
      expect(result.majuriAmount).toBe(2000);
      expect(result.taxableAmount).toBe(67000);
      expect(result.gstAmount).toBe(2010);
      expect(result.finalPriceRounded).toBe(69010);
    });

    it('should apply discount and round to nearest 10 correctly', () => {
      const result = service.calculate({
        pricingMode: PricingMode.DYNAMIC,
        grossWeight: 10,
        metalRatePerGram: 5000,
        discountAmount: 1500,
        roundTo: 10,
        gstRatePercent: 0,
      });

      // 50,000 - 1,500 = 48,500
      expect(result.finalPriceRounded).toBe(48500);
    });
  });

  describe('Fixed Pricing Mode', () => {
    it('should return fixed price without recomputing metal weights', () => {
      const result = service.calculate({
        pricingMode: PricingMode.FIXED,
        fixedPrice: 25000,
        grossWeight: 5,
        metalRatePerGram: 6000,
        discountAmount: 500,
      });

      expect(result.pricingMode).toBe(PricingMode.FIXED);
      expect(result.taxableAmount).toBe(25000);
      expect(result.finalPrice).toBe(24500);
      expect(result.finalPriceRounded).toBe(24500);
    });

    it('should throw BadRequestException if fixed price is not positive', () => {
      expect(() => {
        service.calculate({
          pricingMode: PricingMode.FIXED,
          fixedPrice: 0,
          grossWeight: 5,
          metalRatePerGram: 6000,
        });
      }).toThrow(BadRequestException);
    });
  });
});
