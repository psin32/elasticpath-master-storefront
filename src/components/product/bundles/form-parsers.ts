import { BundleConfigurationSelectedOptions } from "../../../react-shopper-hooks";
import { ProductComponents } from "@elasticpath/js-sdk";

export interface FormSelectedOptions {
  [key: string]: string[];
}

export interface FormQuantities {
  [componentKey: string]: {
    [optionId: string]: number;
  };
}

export function selectedOptionsToFormValues(
  selectedOptions: BundleConfigurationSelectedOptions,
): FormSelectedOptions {
  return Object.keys(selectedOptions).reduce((acc, componentKey) => {
    const componentOptions = selectedOptions[componentKey];

    return {
      ...acc,
      [componentKey]: Object.keys(componentOptions).reduce(
        (innerAcc, optionKey) => {
          return [
            ...innerAcc,
            JSON.stringify({ [optionKey]: componentOptions[optionKey] }),
          ];
        },
        [] as string[],
      ),
    };
  }, {});
}

export function formSelectedOptionsToData(
  selectedOptions: FormSelectedOptions,
  quantities?: FormQuantities,
  components?: ProductComponents,
): BundleConfigurationSelectedOptions {
  const filteredOptions: BundleConfigurationSelectedOptions = Object.keys(
    selectedOptions,
  ).reduce((acc, componentKey) => {
    const componentOptions = selectedOptions[componentKey];

    return {
      ...acc,
      [componentKey]: componentOptions.reduce(
        (innerAcc, optionStr) => {
          const parsed = JSON.parse(
            optionStr,
          ) as BundleConfigurationSelectedOptions[0];

          // Filter out parent product options (those with product_should_be_substituted_with_child === true)
          const filteredParsed: BundleConfigurationSelectedOptions[0] = {};
          Object.keys(parsed).forEach((optionId) => {
            // Check if this option has product_should_be_substituted_with_child === true
            const component = components?.[componentKey];
            const option = component?.options?.find(
              (opt: any) => opt.id === optionId,
            );
            const shouldSubstituteWithChild =
              (option as any)?.product_should_be_substituted_with_child ===
              true;

            // Only include if it's NOT a parent product that should be substituted
            if (!shouldSubstituteWithChild) {
              filteredParsed[optionId] = parsed[optionId];
            }
          });

          // If quantities are provided, use them instead of the default quantity
          if (quantities && quantities[componentKey]) {
            Object.keys(filteredParsed).forEach((optionId) => {
              const quantity = quantities[componentKey][optionId];
              if (quantity !== undefined) {
                filteredParsed[optionId] = quantity;
              }
            });
          }

          return {
            ...innerAcc,
            ...filteredParsed,
          };
        },
        {} as BundleConfigurationSelectedOptions[0],
      ),
    };
  }, {} as BundleConfigurationSelectedOptions);

  // Remove empty component entries
  Object.keys(filteredOptions).forEach((componentKey) => {
    if (
      Object.keys(filteredOptions[componentKey] as Record<string, any>)
        .length === 0
    ) {
      delete (filteredOptions as Record<string, any>)[componentKey];
    }
  });

  return filteredOptions;
}
