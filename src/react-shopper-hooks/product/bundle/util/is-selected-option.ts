import { BundleConfigurationSelectedOptions } from "../../../../shopper-common/src"

export function isSelectedOption(
  selectedOptions: BundleConfigurationSelectedOptions[0],
) {
  return function _innerIsSelectedOption(optionId: string): boolean {
    return Object.keys(selectedOptions).some(
      (optionKey) => optionKey === optionId,
    )
  }
}
