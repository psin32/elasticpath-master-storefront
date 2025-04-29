"use server";

import { getDynamicPricing } from "./add-to-cart";

export type PriceCalculationResponse = {
  success: boolean;
  data?: {
    price: {
      amount: number;
      currency: string;
      includes_tax?: boolean;
    };
    breakdown?: {
      basePrice: number;
      quantity: number;
      discount: number;
      totalBeforeDiscount: number;
      totalAfterDiscount: number;
    };
  };
  error?: string;
};

/**
 * Server action to calculate price for contract items
 * This allows us to use server-side logic in client components safely
 */
export async function calculateContractItemPrice(
  productId: string,
  quantity: number,
): Promise<PriceCalculationResponse> {
  try {
    // Use the server-side dynamic pricing function
    const pricingResult = await getDynamicPricing(productId);

    if (pricingResult.success && pricingResult.product) {
      const basePrice = pricingResult.product.price.amount;
      const includesTax = pricingResult.product.price.includes_tax;

      // Apply volume discounts
      // In a real implementation, this would follow your business logic
      const volumeDiscount = quantity > 5 ? 0.9 : quantity > 2 ? 0.95 : 1;
      const calculatedAmount = Math.round(
        basePrice * quantity * volumeDiscount,
      );

      return {
        success: true,
        data: {
          price: {
            amount: calculatedAmount,
            currency: "USD",
            includes_tax: includesTax,
          },
          breakdown: {
            basePrice: basePrice,
            quantity: quantity,
            discount: (1 - volumeDiscount) * 100,
            totalBeforeDiscount: basePrice * quantity,
            totalAfterDiscount: calculatedAmount,
          },
        },
      };
    } else {
      // If no dynamic pricing is available
      return {
        success: false,
        error: "No dynamic pricing available for this product",
      };
    }
  } catch (error) {
    console.error("Error calculating contract item price:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to calculate price",
    };
  }
}
