"use client";

import { useCart } from "../../react-shopper-hooks";
import { CartItem as CartItemType } from "@elasticpath/js-sdk";
import { useState } from "react";

interface CartItemPromotionsProps {
  item: CartItemType;
}

export function CartItemPromotions({ item }: CartItemPromotionsProps) {
  const { state } = useCart();
  const [hoveredPromotion, setHoveredPromotion] = useState<string | null>(null);

  if (!state?.__extended?.groupedItems?.systemAppliedPromotions) {
    return null;
  }

  // Get all promotions from the cart state
  const allPromotions = state.__extended.groupedItems.systemAppliedPromotions;

  if (!allPromotions || allPromotions.length === 0) {
    return null;
  }

  // Get discounts from the specific cart item
  const itemDiscounts = (item as any)?.discounts || [];
  console.log("itemDiscounts", itemDiscounts);

  // Match discount IDs with promotion data to get promotion names
  const appliedPromotions = itemDiscounts
    .map((discount: any) => {
      // Find the promotion that matches this discount ID
      const promotion = allPromotions.find(
        (promo: any) => promo.id === discount.id,
      );
      return promotion
        ? {
            ...discount,
            promotionName:
              promotion.attributes?.name ||
              promotion.name ||
              `Promotion ${discount.id}`,
            promotionDescription:
              promotion.attributes?.description || promotion.description || "",
            promotion: promotion,
          }
        : null;
    })
    .filter(Boolean); // Remove null entries

  if (appliedPromotions.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 relative">
      <div className="text-xs text-brand-primary font-medium mb-1">
        Applied Promotions:
      </div>
      <div className="flex flex-wrap gap-1">
        {appliedPromotions.map((appliedPromotion: any) => (
          <span
            key={appliedPromotion.id}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary cursor-pointer relative group"
            onMouseEnter={() => setHoveredPromotion(appliedPromotion.id)}
            onMouseLeave={() => setHoveredPromotion(null)}
          >
            {appliedPromotion.promotionName}
            {hoveredPromotion === appliedPromotion.id && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 bg-white border border-gray-200 text-gray-800 text-xs rounded-xl shadow-2xl z-50 w-80 animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="font-semibold text-brand-primary mb-1">
                  {appliedPromotion.promotionName}
                </div>
                <div className="text-gray-600 leading-relaxed mb-2">
                  {appliedPromotion.promotionDescription ||
                    "No description available"}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-gray-500 font-medium">
                    Discount Amount:
                  </span>
                  <span className="font-semibold text-red-600">
                    {new Intl.NumberFormat("en", {
                      style: "currency",
                      currency: appliedPromotion.amount.currency,
                    }).format((appliedPromotion.amount.amount || 0) / 100)}
                  </span>
                </div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-white"></div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-gray-200 -mt-px"></div>
              </div>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
