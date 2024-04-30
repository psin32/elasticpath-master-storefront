import { CatalogsProductVariation } from "@moltin/sdk"
import { OptionDict } from "../../../../shopper-common/src"

export const createEmptyOptionDict = (
  variations: CatalogsProductVariation[],
): OptionDict =>
  variations.reduce((acc, c) => ({ ...acc, [c.id]: undefined }), {})
