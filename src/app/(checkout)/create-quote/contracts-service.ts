"use server";
import { cookies } from "next/headers";
import { getServerSideCredentialsClientWihoutAccountToken } from "../../../lib/epcc-server-side-credentials-client";
import {
  getSelectedAccount,
  retrieveAccountMemberCredentials,
} from "../../../lib/retrieve-account-member-credentials";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../lib/cookie-constants";
import { c } from "vitest/dist/reporters-5f784f42";

export async function getAllActiveContracts() {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookies(),
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );
  let accountId = "";
  if (accountMemberCookie) {
    const selectedAccount = getSelectedAccount(accountMemberCookie);
    accountId = selectedAccount.account_id;
  }
  return await client.request.send(
    `/extensions/contract-terms?filter=eq(elastic_path_account_id,${accountId})`,
    "GET",
    undefined,
    undefined,
    client,
    false,
    "v2",
  );
}

export async function getContractDisplayData(contractId: string) {
  if (!contractId) return null;
  const contract = await getContractById(contractId);
  console.log("contract", contract);
  return {
    id: contract.data.id,
    name: contract.data.display_name,
  };
}

export async function getContractById(contractId: string) {
  if (!contractId) return null;

  const client = getServerSideCredentialsClientWihoutAccountToken();

  const accessToken = (await client.Authenticate()).access_token;

  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookies(),
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );
  let accountId = "";
  if (accountMemberCookie) {
    const selectedAccount = getSelectedAccount(accountMemberCookie);
    accountId = selectedAccount.account_id;
  }

  const response = await fetch(
    `https://${client.config.host}/v2/extensions/contract-terms/${contractId}?filter=eq(elastic_path_account_id,${accountId})`,
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

  console.log(
    "url: ",
    `https://${client.config.host}/v2/extensions/contract-terms/${contractId}?filter=eq(elastic_path_account_id,${accountId})`,
  );
  console.log("accessToken", accessToken);

  const data = await response.json().then((data) => {
    console.log("response data", data);
    return {
      ...data,
      data: {
        ...data.data,
        ...(data.data.line_items && {
          line_items: JSON.parse(data.data.line_items) as ContractLineItem[],
        }),
      },
    };
  });

  return data;
}

export type ContractLineItem = {
  product_id: string;
  sku: string;
  quantity: number;
};

export async function getMultipleContractsByIds(contractIds: string[]) {
  if (!contractIds || contractIds.length === 0) return { data: [] };

  const client = getServerSideCredentialsClientWihoutAccountToken();

  // Format IDs string for the filter
  const idsParam = contractIds.join(",");

  // Get the account ID for additional filtering if needed
  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookies(),
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );
  let accountIdFilter = "";
  if (accountMemberCookie) {
    const selectedAccount = getSelectedAccount(accountMemberCookie);
    const accountId = selectedAccount.account_id;
    // Add account ID filter to ensure security
    accountIdFilter = `:eq(elastic_path_account_id,${accountId})`;
  }

  return await client.request
    .send(
      `/extensions/contract-terms?filter=in(id,${idsParam})${accountIdFilter}`,
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
