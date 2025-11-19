"use client";
import { CartItem as CartItemType } from "@elasticpath/js-sdk";

export type CartComponentDataProps = {
  item: CartItemType;
};

export function CartComponentData({ item }: CartComponentDataProps) {
  const bundleConfig = item?.bundle_configuration;
  const selectedOptions = bundleConfig?.selected_options;
  const componentProducts = bundleConfig?.component_products;

  if (
    !selectedOptions ||
    !componentProducts ||
    !Array.isArray(componentProducts)
  ) {
    return null;
  }

  return (
    <div className="text-xs">
      <div className="mt-2 mb-2 font-semibold underline">Components:</div>
      <ul>
        {Object.keys(selectedOptions).map((componentKey: string) => {
          const componentSelectedOptions = selectedOptions[componentKey];
          return Object.keys(componentSelectedOptions).map(
            (optionId: string) => {
              const quantity = componentSelectedOptions[optionId];
              // component_products is an array, so we need to find the product by id
              const componentProduct = componentProducts.find(
                (product: any) => product.id === optionId,
              );

              if (!componentProduct) {
                return null;
              }

              const productName = componentProduct.attributes?.name || optionId;
              const displayPrice = componentProduct.meta?.display_price;

              return (
                <li className="mt-1 list-disc ml-4" key={optionId}>
                  {productName}: x{quantity}
                  {displayPrice && (
                    <span className="ml-2 text-gray-600">
                      (
                      {displayPrice?.without_tax?.formatted ||
                        displayPrice?.with_tax?.formatted}
                      )
                    </span>
                  )}
                </li>
              );
            },
          );
        })}
      </ul>
    </div>
  );
}
