import {
  useBundleComponent,
  useBundle,
  useBundleComponentOption,
} from "../../../react-shopper-hooks";
import type {
  BundleComponent,
  ShopperProduct,
} from "../../../react-shopper-hooks";
import { ProductComponentOption, ProductResponse } from "@elasticpath/js-sdk";
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
  max,
  min,
}: {
  componentProducts: ProductResponse[];
  options: ProductComponentOption[];
  max?: number | null;
  min?: number | null;
  componentLookupKey: string;
  product: ShopperProduct["response"];
}): JSX.Element {
  // Determine if this should be radio button behavior
  const isRadio = max === 1 && min === 1;
  return (
    <div className="flex py-2 flex-wrap gap-2" role="group">
      {options.sort(sortByOrder).map((option) => {
        return (
          <CheckboxComponentOption
            key={option.id}
            option={option}
            componentKey={componentLookupKey}
            product={product}
            isRadio={isRadio}
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
  isRadio = false,
}: {
  option: ProductComponentOption;
  componentKey: string;
  product: ShopperProduct["response"];
  isRadio?: boolean;
}): JSX.Element {
  const { selected, component } = useBundleComponent(componentKey);
  const { optionProduct, mainImage } = useBundleComponentOption(
    componentKey,
    option.id,
  );

  const selectedOptionKey = Object.keys(selected);

  const reachedMax =
    !!component.max && Object.keys(selected).length === component.max;

  const isDisabled = isRadio
    ? false // radios are only disabled if the whole field is disabled
    : reachedMax &&
      !selectedOptionKey.some((optionKey) => optionKey === option.id);
  const { display_price, original_display_price, sale_id } =
    (product?.meta?.component_products?.[optionProduct.id] as any) || {};
  const name = `selectedOptions.${componentKey}`;
  const inputId = `${name}.${option.id}`;

  // For radio, value is just the option id, for checkbox it's the JSON string
  const [field, , helpers] = useField({
    name,
    type: isRadio ? "radio" : "checkbox",
    value: isRadio
      ? option.id
      : JSON.stringify({ [option.id]: option.quantity }),
    disabled: isDisabled,
    id: inputId,
  });

  // For radio, checked if selected has this option id
  const checked = isRadio
    ? Object.keys(selected)[0] === option.id
    : field.checked;

  // For radio, onChange should set the selected option directly
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isRadio) {
      // Store as array with a single JSON string, matching checkbox structure
      helpers.setValue([JSON.stringify({ [option.id]: option.quantity })]);
    } else {
      field.onChange(e);
    }
  };

  return (
    <div
      className={clsx(
        "w-full",
        checked
          ? "border-4 rounded-lg border-brand-primary bg-gradient-to-br from-slate-100 to-slate-300"
          : "border-2 rounded-lg border-gray-500",
      )}
    >
      <label
        htmlFor={inputId}
        className={clsx(
          "cursor-pointer",
          !checked && isDisabled ? "opacity-50" : "",
        )}
      >
        <input
          {...field}
          type={isRadio ? "radio" : "checkbox"}
          id={inputId}
          disabled={isDisabled}
          className="hidden"
          hidden
          checked={checked}
          onChange={handleChange}
        />
        <div className="flex flex-row items-center justify-between w-full">
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
          <div className="ml-4 mt-2 flex-1">
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
          {/* Sale ID and Bestseller tags on the right, stacked vertically */}
          {sale_id ||
          optionProduct?.attributes?.extensions?.["products(cards)"]
            ?.bestsellers ? (
            <div className="flex flex-col items-end h-full pr-4 space-y-1">
              {sale_id ? (
                <span className="uppercase inline-flex items-center rounded-sm bg-white px-2 py-1 text-xs font-medium text-pink-700 ring-1 ring-inset ring-pink-700">
                  {sale_id}
                </span>
              ) : null}
              {optionProduct?.attributes?.extensions?.["products(cards)"]
                ?.bestsellers ? (
                <span className="uppercase inline-flex items-center rounded-sm bg-white px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700">
                  Bestseller
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </label>
    </div>
  );
}
