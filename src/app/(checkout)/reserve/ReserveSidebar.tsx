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
import { cn } from "../../../lib/cn";
import { useWatch } from "react-hook-form";
import { EP_CURRENCY_CODE } from "../../../lib/resolve-ep-currency-code";
import { formatCurrency } from "../../../lib/format-currency";
import { LoadingDots } from "../../../components/LoadingDots";

type ReserveSidebarProps = {
  cart?: any;
};

export function ReserveSidebar({ cart }: ReserveSidebarProps) {
  const { state } = useCart();
  const shippingMethod = useWatch({ name: "shippingMethod" });

  const { data } = useCurrencies();

  const storeCurrency = data?.find(
    (currency) => currency.code === EP_CURRENCY_CODE,
  );

  if (!state) {
    return null;
  }

  const shipping = state.meta?.display_price as any;
  const shippingAmount = 0; // For reserve orders, no shipping charge

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
    meta?.display_price?.with_tax?.amount !== undefined && storeCurrency
      ? resolveTotalInclShipping(
          shippingAmount,
          meta.display_price.with_tax.amount,
          storeCurrency,
        )
      : meta.display_price.with_tax.formatted;

  return (
    <ItemSidebarHideable meta={meta}>
      <div className="inline-flex flex-col items-start gap-5 w-full lg:w-[24.375rem] px-5 lg:px-0">
        <div className="flex flex-col gap-2 self-stretch">
          <h2 className="text-2xl font-medium">Reserve Order Summary</h2>
          <p className="text-sm text-gray-600">
            Review your items before reserving
          </p>
        </div>
        <ItemSidebarItems items={items} />
        <ItemSidebarPromotions />
        <Separator />
        <CartDiscounts promotions={state.__extended.groupedItems.promotion} />
        {/* Totals */}
        <ItemSidebarTotals>
          <div className="flex justify-between items-baseline self-stretch">
            <span className="text-sm">Shipping</span>
            <span className="font-medium">
              {storeCurrency ? formatCurrency(0, storeCurrency) : "Free"}
            </span>
          </div>
          <ItemSidebarTotalsDiscount meta={meta} />
          <ItemSidebarTotalsTax meta={meta} />
        </ItemSidebarTotals>
        <Separator />
        {/* Sum total */}
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>Note:</strong> This is a reservation. No payment will be
          processed at this time.
        </div>
      </div>
    </ItemSidebarHideable>
  );
}
