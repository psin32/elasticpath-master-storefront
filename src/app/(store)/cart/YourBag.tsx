"use client";

import { CartItemWide } from "./CartItemWide";
import { useCart } from "../../../react-shopper-hooks";
import { CartItemsGrouped } from "../../../components/cart/CartItemsGrouped";
import { Fragment } from "react";
import { Separator } from "../../../components/separator/Separator";

export function YourBag() {
  const { state } = useCart();
  const enableClickAndCollect =
    process.env.NEXT_PUBLIC_ENABLE_CLICK_AND_COLLECT === "true";

  if (enableClickAndCollect) {
    return (
      <ul role="list" className="flex flex-col items-start gap-5 self-stretch">
        <CartItemsGrouped items={state?.items || []} isFullCart={true} />
      </ul>
    );
  }

  // Group items by location for non-Click & Collect mode
  const items = state?.items || [];
  const itemsByLocation = items.reduce((groups: any, item: any) => {
    const locationSlug =
      item?.location ||
      item?.custom_inputs?.location?.location_slug ||
      "no-location";
    const locationName =
      item?.custom_inputs?.location?.location_name || item?.location || null;

    if (!groups[locationSlug]) {
      groups[locationSlug] = {
        locationName,
        items: [],
      };
    }
    groups[locationSlug].items.push(item);
    return groups;
  }, {});

  const hasMultipleLocations = Object.keys(itemsByLocation).length > 1;
  const hasAnyLocation = Object.keys(itemsByLocation).some(
    (key) => key !== "no-location",
  );

  return (
    <ul role="list" className="flex flex-col items-start gap-5 self-stretch">
      {Object.entries(itemsByLocation).map(
        ([locationSlug, group]: [string, any]) => (
          <Fragment key={locationSlug}>
            {hasAnyLocation && hasMultipleLocations && (
              <li className="self-stretch">
                <div className="flex items-center gap-2 bg-brand-primary/10 border-l-4 border-brand-primary px-4 py-3 rounded-r-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5 text-brand-primary"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-semibold text-brand-primary text-base">
                    {locationSlug === "no-location"
                      ? "Items without location"
                      : group.locationName}
                  </span>
                  <span className="text-sm text-gray-600 ml-auto">
                    {group.items.length}{" "}
                    {group.items.length === 1 ? "item" : "items"}
                  </span>
                </div>
              </li>
            )}
            {group.items.map((item: any, index: number) => (
              <Fragment key={item.id}>
                <li className="self-stretch border-t border-zinc-300 py-5">
                  <CartItemWide
                    item={item}
                    hideLocation={hasAnyLocation && hasMultipleLocations}
                  />
                </li>
                {index < group.items.length - 1 && hasMultipleLocations && (
                  <Separator />
                )}
              </Fragment>
            ))}
          </Fragment>
        ),
      )}
    </ul>
  );
}
