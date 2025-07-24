import { CartItem } from "@elasticpath/js-sdk";
import { GroupedCartItems } from "../../cart";
import { assertCartItemType } from "./assert-cart-item-type";

export function groupCartItems(included: any): GroupedCartItems {
  const items: CartItem[] = included?.items ?? [];
  const customDiscounts: any = included?.custom_discounts ?? [];
  const itemCustomDiscounts: any = included?.itemCustomDiscount ?? [];
  const systemAppliedPromotions: any = included?.promotions ?? [];

  return items.reduce(
    (acc, item) => {
      return {
        ...acc,
        ...(assertCartItemType(item, "cart_item")
          ? { regular: [...acc?.regular, item] }
          : acc.regular),
        ...(assertCartItemType(item, "promotion_item")
          ? { promotion: [...acc?.promotion, item] }
          : acc.promotion),
        ...(assertCartItemType(item, "custom_item")
          ? { custom: [...acc?.custom, item] }
          : acc.custom),
        ...(assertCartItemType(item, "subscription_item")
          ? { subscription: [...acc?.subscription, item] }
          : acc.subscription),
        customDiscounts,
        itemCustomDiscounts,
        // Include promotions from the included data
        systemAppliedPromotions,
      };
    },
    {
      regular: [],
      promotion: [],
      custom: [],
      subscription: [],
      customDiscounts: [],
      itemCustomDiscounts: [],
      systemAppliedPromotions: [],
    } as GroupedCartItems,
  );
}
