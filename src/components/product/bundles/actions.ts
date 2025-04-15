"use server";

import { getServerSideCredentialsClientWihoutAccountToken } from "../../../lib/epcc-server-side-credentials-client";

export async function updateCustomAttributesForBundlesInCart(
  cartId: string,
  selectedOptions: any,
) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  const request: any = {
    custom_attributes: {},
  };

  let totalOptions = 0;

  for (const key in selectedOptions) {
    if (
      typeof selectedOptions[key] === "object" &&
      selectedOptions[key] !== null
    ) {
      totalOptions += Object.keys(selectedOptions[key]).length;
    }
  }
  const enabledAttribute = {
    type: "boolean",
    value: true,
  };
  if (totalOptions === 2) {
    request.custom_attributes["two_bundle_items"] = enabledAttribute;
  }
  if (totalOptions === 3) {
    request.custom_attributes["three_bundle_items"] = enabledAttribute;
  }
  if (totalOptions === 4) {
    request.custom_attributes["four_bundle_items"] = enabledAttribute;
  }
  await client.Cart(cartId).UpdateCart(request);
}
