"use server";

import { getServerSideCredentialsClient } from "../lib/epcc-server-side-credentials-client";

export async function getAllLocations(): Promise<any> {
  const client = getServerSideCredentialsClient();
  return await client.request.send(
    `/extensions/location`,
    "GET",
    undefined,
    undefined,
    client,
    false,
    "v2",
  );
}

export async function getInventoryBySKUAndLocation(
  sku: string,
  locations: string[],
): Promise<any> {
  const client = getServerSideCredentialsClient();
  return await client.request.send(
    `/extensions/inventory?filter=eq(sku,${sku}):in(location_code,${locations.join(",")})`,
    "GET",
    undefined,
    undefined,
    client,
    false,
    "v2",
  );
}

export async function getCoordinates(address: string): Promise<any> {
  const response = await fetch(
    "https://dev.virtualearth.net/REST/v1/Locations/UK/" +
      address +
      "?maxResults=1&key=" +
      process.env.NEXT_PUBLIC_BING_MAP_API_KEY,
  );
  return await response.json();
}
