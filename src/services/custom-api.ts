"use server";

import { getServerSideCredentialsClient } from "../lib/epcc-server-side-credentials-client";
import { cookies } from "next/headers";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../lib/cookie-constants";
import {
  getSelectedAccount,
  retrieveAccountMemberCredentials,
} from "../lib/retrieve-account-member-credentials";

export async function getPurchaseHistoryByProductIdAndAccountId(
  productId: string,
): Promise<any> {
  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookies(),
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );
  let accountId = "";
  if (accountMemberCookie) {
    const selectedAccount = getSelectedAccount(accountMemberCookie);
    if (!selectedAccount?.account_id) {
      return null;
    }
    accountId = selectedAccount.account_id;
  }
  const client = getServerSideCredentialsClient();
  return await client.request.send(
    `/extensions/product-order-history?filter=eq(product_id,${productId}):eq(account_id,${accountId})`,
    "GET",
    undefined,
    undefined,
    client,
    false,
    "v2",
  );
}
