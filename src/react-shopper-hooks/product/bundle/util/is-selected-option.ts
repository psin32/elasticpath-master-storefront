import { BundleConfigurationSelectedOptions } from "../../../../shopper-common/src";

export function isSelectedOption(
  selectedOptions: BundleConfigurationSelectedOptions[0],
) {
  return function _innerIsSelectedOption(optionId: string): boolean {
    // Handle null/undefined selectedOptions
    if (!selectedOptions) {
      return false;
    }
    return Object.keys(selectedOptions).some(
      (optionKey) => optionKey === optionId,
    );
  };
}
