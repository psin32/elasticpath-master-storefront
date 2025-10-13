"use client";
import { CartItem } from "../../app/(store)/cart/CartItem";
import { Fragment } from "react";
import { Separator } from "../separator/Separator";
import { CartItemWide } from "../../app/(store)/cart/CartItemWide";

export function CartItemsGrouped({
  items,
  isFullCart,
}: {
  items: any;
  isFullCart: boolean;
}) {
  // Group items by delivery_mode
  const homeDeliveryItems = items.filter(
    (item: any) =>
      item.custom_inputs?.location?.delivery_mode != "Click & Collect",
  );

  const clickAndCollectItems = items.filter(
    (item: any) =>
      item.custom_inputs?.location?.delivery_mode === "Click & Collect",
  );

  // Further group home delivery items by location (for multi-location inventory)
  const homeDeliveryByLocation = homeDeliveryItems.reduce(
    (groups: any, item: any) => {
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
    },
    {},
  );

  const hasMultipleHomeDeliveryLocations =
    Object.keys(homeDeliveryByLocation).length > 1;

  // Further group click and collect items by location_name
  const clickAndCollectGroups = clickAndCollectItems.reduce(
    (groups: any, item: any) => {
      const locationName =
        item.custom_inputs?.location?.location_name || "Unknown Location";
      if (!groups[locationName]) {
        groups[locationName] = [];
      }
      groups[locationName].push(item);
      return groups;
    },
    {},
  );

  return (
    <div>
      {homeDeliveryItems.length > 0 && (
        <div className="border-2 rounded-md border-brand-primary/80 mb-4">
          <h2 className="text-xl p-4 font-semibold mb-4 bg-brand-primary/80 text-white">
            Home Delivery
          </h2>
          {Object.entries(homeDeliveryByLocation).map(
            ([locationSlug, group]: [string, any]) => (
              <div key={locationSlug}>
                {hasMultipleHomeDeliveryLocations && (
                  <div className="px-4 pt-4">
                    <div className="flex items-center gap-2 bg-brand-primary/10 border-l-4 border-brand-primary px-3 py-2 rounded-r-md mb-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4 text-brand-primary"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-semibold text-brand-primary text-sm">
                        {locationSlug === "no-location"
                          ? "Items without location"
                          : group.locationName}
                      </span>
                      <span className="text-xs text-gray-600 ml-auto">
                        {group.items.length}{" "}
                        {group.items.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                  </div>
                )}
                {group.items.map((item: any, index: number) => (
                  <Fragment key={item.id}>
                    <li key={item.id} className="self-stretch mb-4 mt-4 p-4">
                      {isFullCart ? (
                        <CartItemWide
                          key={item.id}
                          item={item}
                          hideLocation={hasMultipleHomeDeliveryLocations}
                        />
                      ) : (
                        <CartItem
                          key={item.id}
                          item={item}
                          hideLocation={hasMultipleHomeDeliveryLocations}
                        />
                      )}
                    </li>
                    {index !== group.items.length - 1 && <Separator />}
                  </Fragment>
                ))}
              </div>
            ),
          )}
        </div>
      )}
      {Object.keys(clickAndCollectGroups).length > 0 && (
        <div className="border-2 rounded-md border-brand-primary/80">
          <h2 className="text-xl font-semibold mb-4 p-4 bg-brand-primary/80 text-white">
            Click & Collect
          </h2>
          {Object.entries(clickAndCollectGroups).map(
            ([locationName, items]: any) => (
              <div key={locationName}>
                <div className="px-4 pt-2">
                  <div className="flex items-center gap-2 bg-brand-primary/10 border-l-4 border-brand-primary px-3 py-2 rounded-r-md mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4 text-brand-primary"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-semibold text-brand-primary text-sm">
                      {locationName}
                    </span>
                    <span className="text-xs text-gray-600 ml-auto">
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                </div>
                {items.map((item: any, index: number) => (
                  <Fragment key={item.id}>
                    <li key={item.id} className="self-stretch mb-4 mt-4 p-4">
                      {isFullCart ? (
                        <CartItemWide
                          key={item.id}
                          item={item}
                          hideLocation={true}
                        />
                      ) : (
                        <CartItem
                          key={item.id}
                          item={item}
                          hideLocation={true}
                        />
                      )}
                    </li>
                    {index !== items.length - 1 && <Separator />}
                  </Fragment>
                ))}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
