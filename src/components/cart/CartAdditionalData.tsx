"use client";
import { CartItem as CartItemType } from "@elasticpath/js-sdk";
import { MapPinIcon } from "@heroicons/react/20/solid";

export type CartAdditionalDataProps = {
  item: CartItemType;
  hideLocation?: boolean;
};

export function CartAdditionalData({
  item,
  hideLocation = false,
}: CartAdditionalDataProps) {
  const hasLocation =
    item?.location || item?.custom_inputs?.location?.location_name;
  const locationName = item?.custom_inputs?.location?.location_name;

  return (
    <div className="text-xs">
      {hasLocation && !hideLocation && (
        <div className="mt-1 mb-1">
          <div className="inline-flex items-center gap-1.5 bg-brand-primary/10 border border-brand-primary/30 px-2 py-1 rounded-md">
            <MapPinIcon className="h-3.5 w-3.5 text-brand-primary flex-shrink-0" />
            <span className="text-xs font-medium text-brand-primary">
              Location: {locationName || item?.location}
            </span>
          </div>
        </div>
      )}
      {item?.custom_inputs?.additional_information?.length > 0 && (
        <div className="mt-1">
          <div className="mb-2 font-semibold underline">
            Additional Information:
          </div>
          {item.custom_inputs.additional_information.map((info: any) => {
            return (
              <div className="flex flex-row gap-6 leading-5" key={info.key}>
                <div className="basis-1/3">{info.key}:</div>
                <div className="basis-2/3">{info.value}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
