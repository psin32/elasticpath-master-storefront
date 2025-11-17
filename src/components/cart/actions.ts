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
    return await client.Cart().CreateCart(updatedCartRequest);
  } else {
    return await client.Cart(cartId).UpdateCart(updatedCartRequest);
  }
}

export async function createNewCart(name: string) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  return await client.Cart().CreateCart({ name });
}

export async function updateCartSnapshotDate(
  cartId: string,
  name: string,
  snapshotDate: string | null,
) {
  const client = getServerSideCredentialsClient();
  const updateData: any = { name };
  if (snapshotDate !== null) {
    updateData.snapshot_date = snapshotDate;
  } else {
    // To clear snapshot_date, we need to set it to null or empty
    // Elastic Path might require explicitly setting it to null
    updateData.snapshot_date = "";
  }
  return await client.Cart(cartId).UpdateCart(updateData);
}
