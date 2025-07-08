"use server";

import { getServerSideCredentialsClient } from "../../../../lib/epcc-server-side-credentials-client";

export async function getCartDetails(cartId: string) {
  const client = getServerSideCredentialsClient();
  return await client.Cart(cartId).With("items").Get();
}
