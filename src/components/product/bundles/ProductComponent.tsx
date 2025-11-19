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

/**
 * Filter out parent product options (those with product_should_be_substituted_with_child === true)
 * from selected options for counting and validation purposes
 */
function filterParentProductOptions(
  selectedOptions: Record<string, any>,
  component: BundleComponent,
): Record<string, any> {
  // Handle null/undefined selectedOptions
  if (!selectedOptions) {
    return {};
  }

  const filtered: Record<string, any> = {};

  Object.keys(selectedOptions).forEach((optionId) => {
    const option = component.options.find((opt) => opt.id === optionId);
    const shouldSubstituteWithChild =
      (option as any)?.product_should_be_substituted_with_child === true;

    // Only include if it's NOT a parent product that should be substituted
    if (!shouldSubstituteWithChild) {
      filtered[optionId] = selectedOptions[optionId];
    }
  });

  return filtered;
}

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
}: {
  componentProducts: ProductResponse[];
  options: ProductComponentOption[];
  max?: number | null;
  componentLookupKey: string;
  product: ShopperProduct["response"];
}): JSX.Element {
  // Determine if this should be radio button behavior
  const isRadio = max === 1;
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

  // Filter out parent product options for counting
  const filteredSelected = filterParentProductOptions(selected, component);
  const selectedOptionKey = Object.keys(filteredSelected);

  const reachedMax =
    !!component.max && Object.keys(filteredSelected).length === component.max;

  // Check if this option is a child product and if another child from the same parent is selected
  const parentProductId = (option as any)?.meta?.parent_product_id;
  const isChildProduct = !!parentProductId;

  // Find if any other child product from the same parent is already selected
  // Check all selected options (not just filtered) to find sibling children
  const allSelectedOptionKeys = Object.keys(selected || {});
  const hasSiblingChildSelected = isChildProduct
    ? allSelectedOptionKeys.some((selectedOptionId) => {
        if (selectedOptionId === option.id) return false; // Don't disable self
        const selectedOption = component.options?.find(
          (opt) => opt.id === selectedOptionId,
        );
        const selectedParentId = (selectedOption as any)?.meta
          ?.parent_product_id;
        return selectedParentId === parentProductId;
      })
    : false;

  const isDisabled = isRadio
    ? false // radios are only disabled if the whole field is disabled
    : (reachedMax &&
        !selectedOptionKey.some((optionKey) => optionKey === option.id)) ||
      hasSiblingChildSelected; // Disable if another child from same parent is selected

  const { display_price, original_display_price, sale_id } =
    (product?.meta?.component_products?.[optionProduct.id] as any) || {};

  const name = `selectedOptions.${componentKey}`;
  const inputId = `${name}.${option.id}`;
  const quantityName = `quantities.${componentKey}.${option.id}`;

  // Get min/max quantities from the option (assuming they come from API)
  const minQuantity = (option as any).min || 1;
  const maxQuantity = (option as any).max || 99;
  const defaultQuantity = option.quantity || 1;

  // For radio, value is just the option id, for checkbox it's the JSON string
  const [field, , helpers] = useField({
    name,
    type: isRadio ? "radio" : "checkbox",
    value: isRadio
      ? option.id
      : JSON.stringify({ [option.id]: defaultQuantity }),
    disabled: isDisabled,
    id: inputId,
  });

  // Quantity field
  const [quantityField, , quantityHelpers] = useField({
    name: quantityName,
    type: "number",
  });

  // Ensure quantity field has a value
  React.useEffect(() => {
    if (quantityField.value === undefined || quantityField.value === null) {
      quantityHelpers.setValue(defaultQuantity);
    }
  }, [quantityField.value, defaultQuantity, quantityHelpers]);

  // For radio, checked if selected has this option id
  const checked = isRadio
    ? Object.keys(selected)[0] === option.id
    : field.checked;

  // For radio, onChange should set the selected option directly
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isRadio) {
      // Store as array with a single JSON string, matching checkbox structure
      helpers.setValue([JSON.stringify({ [option.id]: defaultQuantity })]);
    } else {
      field.onChange(e);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    quantityHelpers.setValue(newQuantity);

    // Don't update the form field value here as it interferes with checkbox selection
    // The quantities will be handled separately in the form submission
  };

  return (
    <div
      className={clsx(
        "w-full",
        checked
          ? "border-4 rounded-lg border-brand-primary bg-gradient-to-br from-brand-primary/5 via-brand-primary/10 to-brand-primary/15"
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
                <div className="flex items-center mb-2 mt-2">
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

            {/* Sale message under the price */}
            {sale_id && (
              <div className="mb-4">
                <span className="uppercase inline-flex items-center rounded-sm bg-pink-50 px-2 py-1 text-xs font-medium text-pink-700 ring-1 ring-inset ring-pink-700">
                  {sale_id}
                </span>
              </div>
            )}

            {/* Bestseller tag under the price */}
            {optionProduct?.attributes?.extensions?.["products(cards)"]
              ?.bestsellers && (
              <div className="mb-2">
                <span className="uppercase inline-flex items-center rounded-sm bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700">
                  Bestseller
                </span>
              </div>
            )}
          </div>

          {/* Right side container for quantities */}
          <div className="flex flex-col items-end pr-4 space-y-2">
            {/* Quantity controls - only show when option is selected */}
            {checked && (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600 font-medium">
                    Qty:
                  </span>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue =
                          quantityField.value || defaultQuantity;
                        const newValue = Math.max(
                          currentValue - 1,
                          minQuantity,
                        );
                        handleQuantityChange(newValue);
                      }}
                      disabled={
                        (quantityField.value || defaultQuantity) <=
                          minQuantity ||
                        (minQuantity === 1 && maxQuantity === 99)
                      }
                      className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-r border-gray-200"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 12H4"
                        />
                      </svg>
                    </button>
                    <input
                      type="number"
                      min={minQuantity}
                      max={maxQuantity}
                      value={Math.min(
                        Math.max(
                          quantityField.value || defaultQuantity,
                          minQuantity,
                        ),
                        maxQuantity,
                      )}
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value, 10);
                        if (!isNaN(newQuantity)) {
                          // Clamp the value to min/max bounds
                          const clampedQuantity = Math.min(
                            Math.max(newQuantity, minQuantity),
                            maxQuantity,
                          );
                          handleQuantityChange(clampedQuantity);
                        }
                      }}
                      onBlur={(e) => {
                        // Ensure the value is within bounds when user leaves the field
                        const newQuantity = parseInt(e.target.value, 10);
                        if (isNaN(newQuantity) || newQuantity < minQuantity) {
                          handleQuantityChange(minQuantity);
                        } else if (newQuantity > maxQuantity) {
                          handleQuantityChange(maxQuantity);
                        }
                      }}
                      disabled={minQuantity === 1 && maxQuantity === 99}
                      className="w-12 h-8 text-center border-none focus:outline-none focus:ring-0 text-sm font-medium disabled:bg-gray-50 disabled:text-gray-500"
                      style={{
                        WebkitAppearance: "none",
                        MozAppearance: "textfield",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue =
                          quantityField.value || defaultQuantity;
                        const newValue = Math.min(
                          currentValue + 1,
                          maxQuantity,
                        );
                        handleQuantityChange(newValue);
                      }}
                      disabled={
                        (quantityField.value || defaultQuantity) >=
                          maxQuantity ||
                        (minQuantity === 1 && maxQuantity === 99)
                      }
                      className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-l border-gray-200"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                {minQuantity > 1 || maxQuantity < 99 ? (
                  <div className="text-xs text-gray-500 text-center">
                    {minQuantity > 1 && `Min: ${minQuantity}`}
                    {minQuantity > 1 && maxQuantity < 99 && " | "}
                    {maxQuantity < 99 && `Max: ${maxQuantity}`}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </label>
      <style jsx>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
