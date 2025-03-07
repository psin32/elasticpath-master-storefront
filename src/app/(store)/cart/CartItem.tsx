"use client";
import { useCart } from "../../../react-shopper-hooks";
import { ProductThumbnail } from "../account/orders/[orderId]/ProductThumbnail";
import { NumberInput } from "../../../components/number-input/NumberInput";
import Link from "next/link";
import { CartItem as CartItemType } from "@elasticpath/js-sdk";
import { LoadingDots } from "../../../components/LoadingDots";
import { CartAdditionalData } from "../../../components/cart/CartAdditionalData";
import { CartComponentData } from "../../../components/cart/CartComponentData";
import Image from "next/image";

export type CartItemProps = {
  item: CartItemType;
};

export function CartItem({ item }: CartItemProps) {
  const { useScopedRemoveCartItem } = useCart();
  const { mutate, isPending } = useScopedRemoveCartItem();

  return (
    <div className="flex gap-5">
      <div className="flex w-16 sm:w-24 h-20 sm:h-[7.5rem] justify-center shrink-0 items-start">
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
      <div className="flex flex-col gap-5 flex-1">
        <div className="flex gap-5 self-stretch">
          <div className="flex flex-col flex-1 gap-1">
            {item.product_id && (
              <Link href={`/products/${item.slug}`}>
                <span className="font-medium text-md">
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
              <span className="font-medium text-md">
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
            <span className="text-sm text-black/60">
              Item Price: {item.meta.display_price.with_tax.unit.formatted}
            </span>
            <span className="text-sm text-black/60">
              Quantity: {item.quantity}
            </span>
          </div>
          <div className="flex h-7 gap-2 flex-col">
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
        <div className="flex w-[15rem] gap-5 items-center">
          <NumberInput item={item} />
          {isPending ? (
            <LoadingDots className="bg-black" />
          ) : (
            <button
              type="button"
              className="text-sm underline text-black/60"
              onClick={() => mutate({ itemId: item.id })}
            >
              Remove
            </button>
          )}
        </div>
        <CartComponentData item={item} />
        <CartAdditionalData item={item} />
      </div>
    </div>
  );
}
