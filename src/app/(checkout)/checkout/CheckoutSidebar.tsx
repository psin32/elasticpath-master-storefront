"use client";
import { Separator } from "../../../components/separator/Separator";
import { CartDiscounts } from "../../../components/cart/CartDiscounts";
import * as React from "react";
import { useCart, useCurrencies } from "../../../react-shopper-hooks";
import {
  ItemSidebarHideable,
  ItemSidebarItems,
  ItemSidebarPromotions,
  ItemSidebarTotals,
  ItemSidebarTotalsDiscount,
  ItemSidebarTotalsSubTotal,
  ItemSidebarTotalsTax,
  resolveTotalInclShipping,
} from "../../../components/checkout-sidebar/ItemSidebar";
import { useShippingMethod } from "./useShippingMethod";
import { cn } from "../../../lib/cn";
import { useWatch } from "react-hook-form";
import { EP_CURRENCY_CODE } from "../../../lib/resolve-ep-currency-code";
import { formatCurrency } from "../../../lib/format-currency";
import { LoadingDots } from "../../../components/LoadingDots";

type CheckoutSidebarProps = {
  cart?: any;
};

export function CheckoutSidebar({ cart }: CheckoutSidebarProps) {
  const { state } = useCart();
  const shippingMethod = useWatch({ name: "shippingMethod" });

  const { data } = useCurrencies();
  const { shippingMethods, isLoading } = useShippingMethod();

  const storeCurrency = data?.find(
    (currency) => currency.code === EP_CURRENCY_CODE,
  );

  if (!state) {
    return null;
  }

  const shipping = state.meta?.display_price as any;
  const shippingAmount =
    shipping?.shipping?.amount ||
    shippingMethods.find((method) => method.value === shippingMethod)?.amount;

  const { meta, __extended } = cart?.data ? cart?.data : (state as any);

  const items = cart?.included?.items
    ? cart?.included?.items.filter(
        (item: any) => !item.sku.startsWith("__shipping_"),
      )
    : __extended.groupedItems.regular.concat(
        __extended.groupedItems.custom,
        __extended.groupedItems.subscription,
      );

  const formattedTotalAmountInclShipping =
    meta?.display_price?.with_tax?.amount !== undefined &&
    shippingAmount !== undefined &&
    shipping?.shipping?.amount === 0 &&
    storeCurrency
      ? resolveTotalInclShipping(
          shippingAmount,
          meta.display_price.with_tax.amount,
          storeCurrency,
        )
      : meta.display_price.with_tax.formatted;

  return (
    <ItemSidebarHideable meta={meta}>
      <div className="inline-flex flex-col items-start gap-5 w-full lg:w-[24.375rem] px-5 lg:px-0">
        <ItemSidebarItems items={items} />
        <ItemSidebarPromotions />
        <Separator />
        <CartDiscounts promotions={state.__extended.groupedItems.promotion} />
        {/* Totals */}
        <ItemSidebarTotals>
          <div className="flex justify-between items-baseline self-stretch">
            <span className="text-sm">Shipping</span>
            <span
              className={cn(
                "font-medium",
                shippingAmount === undefined && "font-normal text-black/60",
              )}
            >
              {shippingAmount === undefined ? (
                "Select delivery method"
              ) : storeCurrency ? (
                formatCurrency(shippingAmount, storeCurrency)
              ) : (
                <LoadingDots className="h-2 bg-black" />
              )}
            </span>
          </div>
          <ItemSidebarTotalsDiscount meta={meta} />
          <ItemSidebarTotalsTax meta={meta} />
        </ItemSidebarTotals>
        <Separator />
        {/* Sum total incl shipping */}
        {formattedTotalAmountInclShipping ? (
          <div className="flex justify-between items-baseline self-stretch">
            <span>Total</span>
            <div className="flex items-center gap-2.5">
              <span className="font-medium text-2xl">
                {formattedTotalAmountInclShipping}
              </span>
            </div>
          </div>
        ) : (
          <LoadingDots className="h-2 bg-black" />
        )}
      </div>
    </ItemSidebarHideable>
  );
}
