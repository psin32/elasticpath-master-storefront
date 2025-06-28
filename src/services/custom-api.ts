"use server";

import { getServerSideCredentialsClient } from "../lib/epcc-server-side-credentials-client";
import { cookies } from "next/headers";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../lib/cookie-constants";
import {
  getSelectedAccount,
  retrieveAccountMemberCredentials,
} from "../lib/retrieve-account-member-credentials";
import { COOKIE_PREFIX_KEY } from "../lib/resolve-cart-env";

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

export async function getShippingDataByCurrency(
  currency?: string,
): Promise<any> {
  try {
    // Get currency from cookie if not provided
    if (!currency) {
      const cookieStore = cookies();
      const currencyInCookie = cookieStore.get(
        `${COOKIE_PREFIX_KEY}_ep_currency`,
      );
      currency =
        currencyInCookie?.value ||
        process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_CODE ||
        "USD";
    }

    const client = getServerSideCredentialsClient();

    // Fetch shipping data from Custom API - only filter by currency and enabled status
    const response = await client.request.send(
      `/extensions/shippings?filter=eq(currency,${currency}):eq(enabled,true)`,
      "GET",
      undefined,
      undefined,
      client,
      false,
      "v2",
    );

    if (response && response.data && response.data.length > 0) {
      const shippingData = response.data;

      return {
        success: true,
        data: shippingData,
        source: "api",
      };
    }

    return {
      success: false,
      data: null,
      source: "api",
    };
  } catch (error) {
    console.error("Error fetching shipping from Custom API:", error);
    return {
      success: false,
      data: null,
      source: "api",
      error: error,
    };
  }
}
