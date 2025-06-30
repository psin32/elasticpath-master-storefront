"use client";
import { Separator } from "../../../components/separator/Separator";
import * as React from "react";
import { useCheckout } from "./checkout-provider";

export function ConfirmationSidebar() {
  const { confirmationData } = useCheckout();

  if (!confirmationData) {
    return null;
  }

  const { order } = confirmationData;

  // Use order items directly
  const orderItems = (order as any).included?.items || [];

  // Filter out shipping items and separate regular items
  const regularItems = orderItems.filter(
    (item: any) => !item.sku.startsWith("__shipping_"),
  );
  const shippingItems = orderItems.filter((item: any) =>
    item.sku.startsWith("__shipping_"),
  );

  const meta = {
    display_price: order.data.meta.display_price,
  } as any;
  console.log("meta", meta);

  const shippingMethodCustomItem = shippingItems[0]; // Take the first shipping item if any

  return (
    <div className="inline-flex flex-col items-start gap-5 w-full lg:w-[24.375rem] px-5 lg:px-0">
      {/* Order Items */}
      <div className="flex flex-col gap-4 w-full">
        <h3 className="text-lg font-semibold">Order Items</h3>
        {regularItems.length > 0 ? (
          <div className="space-y-3">
            {regularItems.map((item: any) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-gray-600">SKU: {item.sku}</div>
                  <div className="text-xs text-gray-600">
                    Quantity: {item.quantity}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">
                    {item.meta?.display_price?.with_tax?.value?.formatted ||
                      item.meta?.display_price?.without_tax?.value?.formatted ||
                      "N/A"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">No items found</div>
        )}
      </div>

      <Separator />

      {/* Order Summary */}
      <div className="flex flex-col gap-3 w-full">
        <h3 className="text-lg font-semibold">Order Summary</h3>

        {/* Shipping */}
        {shippingMethodCustomItem && (
          <div className="flex justify-between items-center">
            <span className="text-sm">Shipping</span>
            <span className="font-medium">
              {shippingMethodCustomItem.meta?.display_price?.with_tax?.value
                ?.formatted || "N/A"}
            </span>
          </div>
        )}

        {/* Shipping */}
        {!shippingMethodCustomItem && (
          <div className="flex justify-between items-center">
            <span className="text-sm">Shipping</span>
            <span className="font-medium">
              {meta?.display_price?.shipping?.formatted || "N/A"}
            </span>
          </div>
        )}

        {/* Discount */}
        {meta?.display_price?.discount?.amount < 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm">Discount</span>
            <span className="font-medium text-red-600">
              {meta?.display_price?.discount?.formatted || "N/A"}
            </span>
          </div>
        )}

        {/* Tax */}
        <div className="flex justify-between items-center">
          <span className="text-sm">Tax</span>
          <span className="font-medium">
            {meta?.display_price?.tax?.formatted || "N/A"}
          </span>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="font-medium">Total</span>
          <span className="font-bold text-lg">
            {meta?.display_price?.with_tax?.formatted || "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
}
