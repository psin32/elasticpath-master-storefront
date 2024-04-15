"use client";
import { CartItem as CartItemType } from "@moltin/sdk";
import { useEffect, useState } from "react";
import { getEpccImplicitClient } from "../../lib/epcc-implicit-client";
import { getProductById } from "../../services/products";

export type CartComponentDataProps = {
  item: CartItemType;
};

export function CartComponentData({ item }: CartComponentDataProps) {

  const [bundleProduct, setBundleProduct] = useState<any>();
  const client = getEpccImplicitClient()

  useEffect(() => {
    const init = async () => {
      const bundleProduct = await getProductById(item.product_id, client)
      setBundleProduct(bundleProduct)
    };
    if (item?.bundle_configuration?.selected_options) {
      init();
    }
  }, [item]);

  return (
    item?.bundle_configuration?.selected_options && (
      <div className="text-xs">
        <div className="mt-2 mb-2 font-semibold underline">Components:</div>
        <ul>
          {item?.bundle_configuration?.selected_options && Object.keys(item?.bundle_configuration?.selected_options).map((optionName: string) => {
            return Object.keys(item?.bundle_configuration?.selected_options[optionName]).map((optionId: string) => {
              const componentProduct = bundleProduct?.included?.component_products.find((component: any) => component.id === optionId)
              return (
                <li className="mt-1 list-disc ml-4" key={optionId}>
                  {componentProduct?.attributes?.name}: x{item?.bundle_configuration?.selected_options[optionName][optionId]}
                </li>
              )
            })
          })}
        </ul>
      </div>
    )
  );
}
