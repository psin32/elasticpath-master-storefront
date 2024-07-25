"use client";
import { CartItem as CartItemType } from "@moltin/sdk";

export type CartAdditionalDataProps = {
  item: CartItemType;
};

export function CartAdditionalData({ item }: CartAdditionalDataProps) {
  return (
    <div className="text-xs">
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
