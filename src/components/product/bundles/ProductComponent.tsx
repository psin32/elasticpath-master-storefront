import {
  useBundleComponent,
  useBundle,
  useBundleComponentOption,
} from "../../../react-shopper-hooks";
import type {
  BundleComponent,
  ShopperProduct,
} from "../../../react-shopper-hooks";
import { ProductComponentOption, ProductResponse } from "@moltin/sdk";
import { sortByOrder } from "./sort-by-order";
import { useField, useFormikContext } from "formik";

import clsx from "clsx";
import Image from "next/image";
import * as React from "react";
import NoImage from "../../NoImage";
import StrikePrice from "../StrikePrice";
import Price from "../Price";

export const ProductComponent = ({
  component,
  componentLookupKey,
  product,
}: {
  component: BundleComponent;
  componentLookupKey: string;
  product: ShopperProduct["response"];
}): JSX.Element => {
  const { componentProducts } = useBundle();

  const { name, min, max } = component;

  const { errors, touched } = useFormikContext<{
    selectedOptions: any;
  }>();

  const getSelectionMessage = () => {
    let message = "(Optional: Choose any product below)";

    if (min || min === 0) {
      if (min == 0 && max && max >= 1) {
        message = `(Optional: Choose maximum ${max} product${max > 1 ? "s" : ""})`;
      } else if (min == 1 && max && max == 1) {
        message = `(Required: Choose any 1 product)`;
      } else if (min == 1 && max && max > 1) {
        message = `(Required: Choose minimum ${min} product and maximum ${max} products)`;
      } else if (min > 1 && max && max == min) {
        message = `(Required: Choose any ${min} products)`;
      } else if (min > 1 && max && max > min) {
        message = `(Required: Choose minimum ${min} product and maximum ${max} products)`;
      }
    }

    return <span className="text-[11px]">{message}</span>;
  };

  return (
    <fieldset
      id={`selectedOptions.${componentLookupKey}`}
      className={clsx(
        ((errors as any)?.[`selectedOptions.${componentLookupKey}`] &&
          (touched as any)?.[`selectedOptions.${componentLookupKey}`]) ??
          "border-red-500",
        "w-full relative",
      )}
    >
      <div key={name} className="m-2">
        <legend className="mb-2 font-semibold">
          {name} {getSelectionMessage()}
        </legend>
        <div>
          {(errors as any)[`selectedOptions.${componentLookupKey}`] && (
            <div className="">
              {(errors as any)[`selectedOptions.${componentLookupKey}`]}
            </div>
          )}
          <CheckboxComponentOptions
            componentProducts={componentProducts}
            componentLookupKey={componentLookupKey}
            options={component.options}
            max={component.max}
            min={component.min}
            product={product}
          />
        </div>
      </div>
    </fieldset>
  );
};

function CheckboxComponentOptions({
  options,
  componentLookupKey,
  product,
}: {
  componentProducts: ProductResponse[];
  options: ProductComponentOption[];
  max?: number | null;
  min?: number | null;
  componentLookupKey: string;
  product: ShopperProduct["response"];
}): JSX.Element {
  return (
    <div className="flex py-2 flex-wrap gap-2" role="group">
      {options.sort(sortByOrder).map((option) => {
        return (
          <CheckboxComponentOption
            key={option.id}
            option={option}
            componentKey={componentLookupKey}
            product={product}
          />
        );
      })}
    </div>
  );
}

function CheckboxComponentOption({
  option,
  componentKey,
  product,
}: {
  option: ProductComponentOption;
  componentKey: string;
  product: ShopperProduct["response"];
}): JSX.Element {
  const { selected, component } = useBundleComponent(componentKey);
  const { optionProduct, mainImage } = useBundleComponentOption(
    componentKey,
    option.id,
  );

  const selectedOptionKey = Object.keys(selected);

  const reachedMax =
    !!component.max && Object.keys(selected).length === component.max;

  const isDisabled =
    reachedMax &&
    !selectedOptionKey.some((optionKey) => optionKey === option.id);
  const { display_price, original_display_price } =
    (product?.meta?.component_products?.[optionProduct.id] as any) || {};
  const name = `selectedOptions.${componentKey}`;
  const inputId = `${name}.${option.id}`;

  const [field] = useField({
    name,
    type: "checkbox",
    value: JSON.stringify({ [option.id]: option.quantity }),
    disabled: isDisabled,
    id: inputId,
  });

  return (
    <div
      className={clsx(
        "w-full",
        field.checked
          ? "border-2 rounded-lg border-brand-primary"
          : "border-2 rounded-lg border-gray-500",
      )}
    >
      <label
        htmlFor={inputId}
        className={clsx(
          "cursor-pointer",
          !field.checked && isDisabled ? "opacity-50" : "",
        )}
      >
        <input
          {...field}
          type="checkbox"
          id={inputId}
          disabled={isDisabled}
          className="hidden"
          hidden
        />
        <div className="flex flex-row">
          <div
            className={clsx(isDisabled && "opacity-50", "w-14 ml-4 mt-2")}
            key={option.id}
          >
            <div>
              <div className="relative aspect-square">
                {mainImage?.link.href ? (
                  <Image
                    alt={mainImage?.id!}
                    src={mainImage?.link?.href ?? "/150-placeholder.png"}
                    className="rounded-lg"
                    sizes="(max-width: 160px)"
                    fill
                    style={{
                      objectFit: "contain",
                      objectPosition: "center",
                    }}
                  />
                ) : (
                  <NoImage />
                )}
              </div>
            </div>
          </div>
          <div className="ml-4 mt-2">
            <p className="text-sm">{optionProduct.attributes.name}</p>
            <p className="text-sm">
              {display_price && (
                <div className="flex items-center mb-6">
                  {original_display_price && (
                    <StrikePrice
                      price={
                        original_display_price?.without_tax?.formatted
                          ? original_display_price?.without_tax?.formatted
                          : original_display_price.with_tax.formatted
                      }
                      currency={
                        original_display_price.without_tax?.currency
                          ? original_display_price?.without_tax?.currency
                          : original_display_price.with_tax.currency
                      }
                      size="text-md"
                    />
                  )}
                  <Price
                    price={
                      display_price?.without_tax?.formatted
                        ? display_price?.without_tax?.formatted
                        : display_price.with_tax.formatted
                    }
                    currency={
                      display_price?.without_tax?.currency
                        ? display_price?.without_tax?.currency
                        : display_price.with_tax.currency
                    }
                    original_display_price={original_display_price}
                    size="text-md"
                  />
                </div>
              )}
            </p>
          </div>
        </div>
      </label>
    </div>
  );
}
