import { BundleConfigurationSelectedOptions } from "../../../react-shopper-hooks";

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
): BundleConfigurationSelectedOptions {
  return Object.keys(selectedOptions).reduce((acc, componentKey) => {
    const componentOptions = selectedOptions[componentKey];

    return {
      ...acc,
      [componentKey]: componentOptions.reduce(
        (innerAcc, optionStr) => {
          const parsed = JSON.parse(
            optionStr,
          ) as BundleConfigurationSelectedOptions[0];

          // If quantities are provided, use them instead of the default quantity
          if (quantities && quantities[componentKey]) {
            Object.keys(parsed).forEach((optionId) => {
              const quantity = quantities[componentKey][optionId];
              if (quantity !== undefined) {
                parsed[optionId] = quantity;
              }
            });
          }

          return {
            ...innerAcc,
            ...parsed,
          };
        },
        {} as BundleConfigurationSelectedOptions[0],
      ),
    };
  }, {});
}
