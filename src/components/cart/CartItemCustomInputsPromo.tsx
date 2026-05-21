"use client";

import { CartItem as CartItemType } from "@elasticpath/js-sdk";

function formatMinorAmount(
  amount: string | number | undefined,
  currency: string,
): string | null {
  if (amount === undefined || amount === null || amount === "") {
    return null;
  }
  const minor = typeof amount === "string" ? parseInt(amount, 10) : amount;
  if (Number.isNaN(minor)) {
    return null;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(minor / 100);
}

function getItemCurrency(item: CartItemType): string {
  return (
    item.meta.display_price.with_tax?.value?.currency ||
    item.meta.display_price.without_tax?.value?.currency ||
    process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_CODE ||
    "USD"
  );
}

interface CartItemCustomInputsPromoProps {
  item: CartItemType;
}

export function CartItemCustomInputsPromo({ item }: CartItemCustomInputsPromoProps) {
  const customInputs = item.custom_inputs as
    | {
        promo_message?: string;
        was_price?: string | number;
        you_save?: string | number;
      }
    | undefined;

  const promoMessage = customInputs?.promo_message;
  const wasPrice = customInputs?.was_price;
  const youSave = customInputs?.you_save;

  if (!promoMessage && !wasPrice && !youSave) {
    return null;
  }

  const currency = getItemCurrency(item);
  const formattedWasPrice = formatMinorAmount(wasPrice, currency);

  const youSaveMinor =
    youSave !== undefined && youSave !== null && youSave !== ""
      ? typeof youSave === "string"
        ? parseInt(youSave, 10)
        : youSave
      : NaN;
  const totalYouSaveMinor = Number.isNaN(youSaveMinor)
    ? null
    : youSaveMinor * (item.quantity ?? 1);
  const formattedYouSave = formatMinorAmount(
    totalYouSaveMinor ?? undefined,
    currency,
  );

  return (
    <div className="flex flex-col gap-0.5">
      {promoMessage && (
        <span className="text-xs font-medium text-brand-primary">
          {promoMessage}
        </span>
      )}
      {formattedWasPrice && (
        <span className="text-xs text-black/60 line-through">
          Was {formattedWasPrice}
        </span>
      )}
      {formattedYouSave && (
        <span className="text-xs font-medium text-green-700">
          You save {formattedYouSave}
        </span>
      )}
    </div>
  );
}
