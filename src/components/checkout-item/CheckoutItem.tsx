"use client";
import { ProductThumbnail } from "../../app/(store)/account/orders/[orderId]/ProductThumbnail";
import Link from "next/link";
import { CartItem } from "@moltin/sdk";
import { CartAdditionalData } from "../cart/CartAdditionalData";
import { CartComponentData } from "../cart/CartComponentData";
import Image from "next/image";

export function CheckoutItem({ item }: { item: CartItem }) {
  return (
    <div className="flex w-full lg:w-[24.375rem] gap-5 items-start">
      <div className="flex flex-col w-[4.5rem] h-[5.626rem] justify-start shrink-0 items-center">
        {item.product_id && <ProductThumbnail productId={item.product_id} />}

        {item.custom_inputs?.image_url && (
          <Image
            src={item.custom_inputs?.image_url}
            width="100"
            height="100"
            alt={item.name}
            className="overflow-hidden"
          />
        )}
      </div>
      <div className="flex flex-col items-start gap-1 flex-only-grow">
        {item.product_id && (
          <Link href={`/products/${item.slug}`}>
            <span className="font-medium text-xl lg:text-2xl">
              {item.name}
              {item?.custom_inputs?.options && (
                <div className="mt-1 text-black/60 text-xs">
                  {item?.custom_inputs?.options}
                </div>
              )}
              {item.sku && (
                <div className="mt-1 text-black/60 text-sm font-normal">
                  SKU: {item.sku}
                </div>
              )}
            </span>
          </Link>
        )}
        {!item.product_id && (
          <span className="font-medium text-xl lg:text-2xl">
            {item.name}
            {item?.custom_inputs?.options && (
              <div className="mt-1 text-black/60 text-xs">
                {item?.custom_inputs?.options}
              </div>
            )}
            {item.sku && (
              <div className="mt-1 text-black/60 text-sm font-normal">
                SKU: {item.sku}
              </div>
            )}
          </span>
        )}
        <span className="text-sm text-black/60">Quantity: {item.quantity}</span>
        <div className="w-full">
          <CartComponentData item={item} />
          <CartAdditionalData item={item} />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="font-medium">
          {item.meta.display_price.with_tax.value.formatted}
        </span>
        {item.meta.display_price.without_discount?.value.amount &&
          item.meta.display_price.without_discount?.value.amount !==
            item.meta.display_price.with_tax.value.amount && (
            <span className="text-black/60 text-sm line-through">
              {item.meta.display_price.without_discount?.value.formatted}
            </span>
          )}
      </div>
    </div>
  );
}
