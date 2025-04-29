"use server";
import { cookies } from "next/headers";
import { getServerSideCredentialsClientWihoutAccountToken } from "../../../lib/epcc-server-side-credentials-client";
import {
  getSelectedAccount,
  retrieveAccountMemberCredentials,
} from "../../../lib/retrieve-account-member-credentials";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../lib/cookie-constants";

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
    `/extensions/contract-terms?filter=eq(account_id,${accountId})`,
    "GET",
    undefined,
    undefined,
    client,
    false,
    "v2",
  );
}

export async function getContractDisplayData(contractId: string) {
  const contract = await getContractById(contractId);
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
    `https://${client.config.host}/v2/extensions/contract-terms/${contractId}?filter=eq(account_id,${accountId})`,
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

  const data = await response.json().then((data) => {
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
