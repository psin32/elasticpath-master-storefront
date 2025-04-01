"use server";

import { getServerSideCredentialsClientWihoutAccountToken } from "../../../lib/epcc-server-side-credentials-client";

export async function getAccountQuotes(accountId: string) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  return await client.request.send(
    `/extensions/quotes?filter=eq(account_id,${accountId})`,
    "GET",
    undefined,
    undefined,
    client,
    false,
    "v2",
  );
}
