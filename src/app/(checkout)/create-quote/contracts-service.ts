"use server";
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

export async function getContractById(contractId: string) {
  if (!contractId) return null;

  const client = getServerSideCredentialsClientWihoutAccountToken();

  const accessToken = (await client.Authenticate()).access_token;

  const response = await fetch(
    `https://${client.config.host}/v2/extensions/contract-terms/${contractId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      next: {
        revalidate: 0,
        tags: ["active-contract"],
      },
    },
  );

  const data = await response.json();
  console.log("data", data);

  return data;
}

export async function getMultipleContractsByIds(contractIds: string[]) {
  if (!contractIds || contractIds.length === 0) return { data: [] };

  const client = getServerSideCredentialsClientWihoutAccountToken();

  // Format IDs string for the filter
  const idsParam = contractIds.join(",");

  return await client.request
    .send(
      `/extensions/contract-terms?filter=in(id,${idsParam})`,
      "GET",
      undefined,
      undefined,
      client,
      false,
      "v2",
    )
    .catch((err) => {
      console.error("Error fetching multiple contracts:", err);
      return { data: [] };
    });
}
