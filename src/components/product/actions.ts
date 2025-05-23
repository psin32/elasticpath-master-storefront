"use server";

import { getServerSideCredentialsClientWihoutAccountToken } from "../../lib/epcc-server-side-credentials-client";

export async function getInventoryDetails(productId: string) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  const inventory = await client.Inventories.Get(productId).catch((error) => {
    console.error("Error fetching inventory details:", error);
    return null;
  });
  if (!inventory) {
    console.error("No inventory details found for product ID:", productId);
    return null;
  }
  return inventory;
}
