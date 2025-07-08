"use server";

import {
  getServerSideCredentialsClient,
  getServerSideCredentialsClientWihoutAccountToken,
} from "../../lib/epcc-server-side-credentials-client";

export async function upsertCart(
  newCart: boolean,
  updatedCartRequest: any,
  cartId?: string,
) {
  const client = getServerSideCredentialsClient();
  if (newCart) {
    await client.Cart().CreateCart(updatedCartRequest);
  } else {
    await client.Cart(cartId).UpdateCart(updatedCartRequest);
  }
}

export async function createNewCart(name: string) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  return await client.Cart().CreateCart({ name });
}
