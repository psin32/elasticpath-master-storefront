"use client";

import { CartItemWide } from "./CartItemWide";
import { useCart } from "../../../react-shopper-hooks";
import { CartItemsGrouped } from "../../../components/cart/CartItemsGrouped";

export function YourBag() {
  const { state } = useCart();
  const enableClickAndCollect =
    process.env.NEXT_PUBLIC_ENABLE_CLICK_AND_COLLECT === "true";

  return (
    <ul role="list" className="flex flex-col items-start gap-5 self-stretch">
      {!enableClickAndCollect &&
        state?.items.map((item) => {
          return (
            <li
              key={item.id}
              className="self-stretch border-t border-zinc-300 py-5"
            >
              <CartItemWide item={item} />
            </li>
          );
        })}
      {enableClickAndCollect && (
        <CartItemsGrouped items={state?.items || []} isFullCart={true} />
      )}
    </ul>
  );
}
