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
  return await client.request
    .send(
      `/extensions/contract-terms/${contractId}`,
      "GET",
      undefined,
      undefined,
      client,
      false,
      "v2",
    )
    .catch((err) => {
      console.error("Error fetching contract by ID:", err);
      return null;
    });
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
