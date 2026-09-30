import { Injectable, BadRequestException } from '@nestjs/common';
import { MakingChargeType, PricingMode } from '../../common/enums';

export interface PriceCalculationInput {
  pricingMode: PricingMode;
  fixedPrice?: number;

  // Weights (grams)
  grossWeight: number;
  stoneWeight?: number;       // 0 if stones disabled
  lacWeight?: number;         // 0 if no lac/wax

  // Metal
  metalRatePerGram: number;   // rate for the specific purity

  // Charges
  wastagePercent?: number;
  makingChargeType?: MakingChargeType;
  makingChargeValue?: number;
  majuriType?: MakingChargeType;
  majuriValue?: number;
  serviceCharges?: number;

  // Stones (if hasStones = true)
  totalStoneValue?: number;

  // Tax config
  gstRatePercent?: number;          // default 3
  gstOnMakingChargePercent?: number; // default 0 (set to 5 for separate MC GST)

  // Discounts
  discountAmount?: number;

  // Rounding
  roundTo?: 1 | 10;
}

export interface PriceBreakdown {
  pricingMode: PricingMode;

  // Weights
  grossWeight: number;
  stoneWeight: number;
  lacWeight: number;
  netMetalWeight: number;

  // Metal
  metalRatePerGram: number;
  metalValue: number;

  // Wastage
  wastagePercent: number;
  wastageValue: number;

  // Making charges
  makingChargeType: string;
  makingChargeValue: number;
  makingChargesAmount: number;

  // Majuri
  majuriType: string;
  majuriValue: number;
  majuriAmount: number;

  // Stone
  totalStoneValue: number;

  // Service
  serviceCharges: number;

  // Tax
  taxableAmount: number;
  gstRatePercent: number;
  gstAmount: number;
  gstOnMakingCharge: number;

  // Discount
  discountAmount: number;

  // Final
  finalPrice: number;
  finalPriceRounded: number;
}

@Injectable()
export class PricingCalculatorService {
  /**
   * Main pricing formula — 12 steps
   * Returns full itemized breakdown
   */
  calculate(input: PriceCalculationInput): PriceBreakdown {
    // ── Step 1: Check pricing mode ──────────────────────────────────────────
    if (input.pricingMode === PricingMode.FIXED) {
      if (!input.fixedPrice || input.fixedPrice <= 0) {
        throw new BadRequestException('Fixed price must be a positive value');
      }
      const fixedBreakdown: PriceBreakdown = {
        pricingMode: PricingMode.FIXED,
        grossWeight: input.grossWeight,
        stoneWeight: 0,
        lacWeight: 0,
        netMetalWeight: 0,
        metalRatePerGram: 0,
        metalValue: 0,
        wastagePercent: 0,
        wastageValue: 0,
        makingChargeType: 'N/A',
        makingChargeValue: 0,
        makingChargesAmount: 0,
        majuriType: 'N/A',
        majuriValue: 0,
        majuriAmount: 0,
        totalStoneValue: 0,
        serviceCharges: 0,
        taxableAmount: input.fixedPrice,
        gstRatePercent: 0,
        gstAmount: 0,
        gstOnMakingCharge: 0,
        discountAmount: input.discountAmount ?? 0,
        finalPrice: input.fixedPrice - (input.discountAmount ?? 0),
        finalPriceRounded: input.fixedPrice - (input.discountAmount ?? 0),
      };
      return fixedBreakdown;
    }

    // ── Step 2: Calculate Net Metal Weight ──────────────────────────────────
    const stoneWeight = input.stoneWeight ?? 0;
    const lacWeight = input.lacWeight ?? 0;
    const netMetalWeight = input.grossWeight - stoneWeight - lacWeight;

    // ── Step 3: Validate net metal weight ───────────────────────────────────
    if (netMetalWeight < 0) {
      throw new BadRequestException(
        `Net metal weight cannot be negative. Gross: ${input.grossWeight}g, Stone: ${stoneWeight}g, Lac: ${lacWeight}g`,
      );
    }

    // ── Step 4: Metal Value ─────────────────────────────────────────────────
    const metalValue = netMetalWeight * input.metalRatePerGram;

    // ── Step 5: Wastage Value ───────────────────────────────────────────────
    const wastagePercent = input.wastagePercent ?? 0;
    const wastageValue = netMetalWeight * (wastagePercent / 100) * input.metalRatePerGram;

    // ── Step 6: Making Charges ──────────────────────────────────────────────
    const mcType = input.makingChargeType ?? MakingChargeType.FLAT;
    const mcValue = input.makingChargeValue ?? 0;
    let makingChargesAmount = 0;
    switch (mcType) {
      case MakingChargeType.FLAT:
        makingChargesAmount = mcValue;
        break;
      case MakingChargeType.PER_GRAM:
        makingChargesAmount = netMetalWeight * mcValue;
        break;
      case MakingChargeType.PERCENTAGE:
        makingChargesAmount = metalValue * (mcValue / 100);
        break;
    }

    // ── Step 7: Majuri ──────────────────────────────────────────────────────
    const majuriType = input.majuriType ?? MakingChargeType.FLAT;
    const majuriValue = input.majuriValue ?? 0;
    let majuriAmount = 0;
    switch (majuriType) {
      case MakingChargeType.FLAT:
        majuriAmount = majuriValue;
        break;
      case MakingChargeType.PER_GRAM:
        majuriAmount = netMetalWeight * majuriValue;
        break;
      case MakingChargeType.PERCENTAGE:
        majuriAmount = metalValue * (majuriValue / 100);
        break;
    }

    // ── Step 8: Stone Value ─────────────────────────────────────────────────
    const totalStoneValue = input.totalStoneValue ?? 0;

    // ── Step 9: Service Charges ─────────────────────────────────────────────
    const serviceCharges = input.serviceCharges ?? 0;

    // ── Step 10: Taxable Amount ─────────────────────────────────────────────
    const taxableAmount =
      metalValue + wastageValue + makingChargesAmount + majuriAmount + totalStoneValue + serviceCharges;

    // ── Step 11: GST ────────────────────────────────────────────────────────
    const gstRatePercent = input.gstRatePercent ?? 3;
    const gstAmount = taxableAmount * (gstRatePercent / 100);
    // Optional: separate 5% GST on making charges (if configured)
    const gstOnMakingCharge =
      input.gstOnMakingChargePercent ? makingChargesAmount * (input.gstOnMakingChargePercent / 100) : 0;

    // ── Step 12: Final Price ─────────────────────────────────────────────────
    const discountAmount = input.discountAmount ?? 0;
    const finalPrice = taxableAmount + gstAmount + gstOnMakingCharge - discountAmount;
    const roundTo = input.roundTo ?? 1;
    const finalPriceRounded = Math.round(finalPrice / roundTo) * roundTo;

    return {
      pricingMode: PricingMode.DYNAMIC,
      grossWeight: input.grossWeight,
      stoneWeight,
      lacWeight,
      netMetalWeight: parseFloat(netMetalWeight.toFixed(3)),
      metalRatePerGram: input.metalRatePerGram,
      metalValue: parseFloat(metalValue.toFixed(2)),
      wastagePercent,
      wastageValue: parseFloat(wastageValue.toFixed(2)),
      makingChargeType: mcType,
      makingChargeValue: mcValue,
      makingChargesAmount: parseFloat(makingChargesAmount.toFixed(2)),
      majuriType,
      majuriValue,
      majuriAmount: parseFloat(majuriAmount.toFixed(2)),
      totalStoneValue: parseFloat(totalStoneValue.toFixed(2)),
      serviceCharges: parseFloat(serviceCharges.toFixed(2)),
      taxableAmount: parseFloat(taxableAmount.toFixed(2)),
      gstRatePercent,
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      gstOnMakingCharge: parseFloat(gstOnMakingCharge.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      finalPrice: parseFloat(finalPrice.toFixed(2)),
      finalPriceRounded,
    };
  }

  /**
   * Bulk calculation for multiple products
   */
  calculateBulk(inputs: PriceCalculationInput[]): PriceBreakdown[] {
    return inputs.map((input) => this.calculate(input));
  }
}
