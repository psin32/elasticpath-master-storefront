import { getServerSideCredentialsClientWihoutAccountToken } from "../../../lib/epcc-server-side-credentials-client";

export async function getAllActiveContracts() {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  return await client.request.send(
    `/extensions/contract-terms`,
    "GET",
    undefined,
    undefined,
    client,
    false,
    "v2",
  );
}
