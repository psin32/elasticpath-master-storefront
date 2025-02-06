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
      item.custom_inputs?.location?.delivery_mode === "Home Delivery",
  );

  const clickAndCollectItems = items.filter(
    (item: any) =>
      item.custom_inputs?.location?.delivery_mode === "Click & Collect",
  );

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
          <h2 className="text-xl p-4 font-semibold mb-4 bg-brand-primary/80">
            Home Delivery
          </h2>
          {homeDeliveryItems.map((item: any, index: number) => (
            <Fragment key={item.id}>
              <li key={item.id} className="self-stretch mb-4 mt-4 p-4">
                {isFullCart ? (
                  <CartItemWide key={item.id} item={item} />
                ) : (
                  <CartItem key={item.id} item={item} />
                )}
              </li>
              {index != homeDeliveryItems.length - 1 && <Separator />}
            </Fragment>
          ))}
        </div>
      )}
      {Object.keys(clickAndCollectGroups).length > 0 && (
        <div className="border-2 rounded-md border-brand-primary/80">
          <h2 className="text-xl font-semibold mb-4 p-4 bg-brand-primary/80">
            Click & Collect
          </h2>
          {Object.entries(clickAndCollectGroups).map(
            ([locationName, items]: any) => (
              <div key={locationName}>
                <h3 className="text-lg font-medium mb-2 mt-4 p-4">
                  Collect from {locationName}
                </h3>
                {items.map((item: any, index: number) => (
                  <Fragment key={item.id}>
                    <li key={item.id} className="self-stretch mb-4 mt-4 p-4">
                      {isFullCart ? (
                        <CartItemWide key={item.id} item={item} />
                      ) : (
                        <CartItem key={item.id} item={item} />
                      )}
                    </li>
                    {index != clickAndCollectItems.length - 1 && <Separator />}
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
