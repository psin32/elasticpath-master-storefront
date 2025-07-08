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

/**
 * Create a new shared list entry in the Custom API.
 * @param account_member_id - The account member's ID
 * @param cart_id - The cart ID for the shared list
 * @param is_public - Boolean for public/private
 * @param total_items - Number of items in the list
 */
export async function createOrUpdateSharedListEntry({
  account_member_id,
  name,
  cart_id,
  is_public,
  total_items,
}: {
  account_member_id: string;
  name: string;
  cart_id: string;
  is_public: boolean;
  total_items: number;
}) {
  const client = getServerSideCredentialsClient();
  const payload = {
    type: "shared_list_ext",
    name,
    account_member_id,
    cart_id,
    is_public,
    total_items,
  };
  return await client.request
    .send(
      `/extensions/shared_lists/${cart_id}`,
      "PUT",
      payload,
      undefined,
      client,
      undefined,
      "v2",
    )
    .catch((err) => {
      console.error("Error while creating new quote", err);
      return err;
    });
}

/**
 * Fetch shared lists for the current user from the Custom API.
 */
export async function getSharedLists() {
  try {
    const accountMemberCookie = retrieveAccountMemberCredentials(
      cookies(),
      ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
    );
    let account_member_id = "";
    if (accountMemberCookie) {
      account_member_id = accountMemberCookie?.accountMemberId || "";
    }

    if (!account_member_id) {
      return {
        success: false,
        data: [],
        error: "No account member found",
      };
    }

    const client = getServerSideCredentialsClient();
    const response = await client.request.send(
      `/extensions/shared_lists?filter=eq(account_member_id,${account_member_id})`,
      "GET",
      undefined,
      undefined,
      client,
      false,
      "v2",
    );

    if (response && response.data) {
      return {
        success: true,
        data: response.data,
      };
    }

    return {
      success: false,
      data: [],
      error: "No data received",
    };
  } catch (error) {
    console.error("Error fetching shared lists:", error);
    return {
      success: false,
      data: [],
      error: error,
    };
  }
}

/**
 * Delete a shared list entry from the Custom API.
 * @param id - The ID of the shared list entry to delete
 */
export async function deleteSharedListEntry(id: string) {
  try {
    const client = getServerSideCredentialsClient();
    const response = await client.request.send(
      `/extensions/shared_lists/${id}`,
      "DELETE",
      undefined,
      undefined,
      client,
      false,
      "v2",
    );

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error("Error deleting shared list:", error);
    return {
      success: false,
      error: error,
    };
  }
}

/**
 * Fetch public shared lists (is_public=true) from the Custom API.
 */
export async function getPublicSharedLists() {
  try {
    const client = getServerSideCredentialsClient();
    const response = await client.request.send(
      `/extensions/shared_lists?filter=eq(is_public,true)`,
      "GET",
      undefined,
      undefined,
      client,
      false,
      "v2",
    );
    if (response && response.data) {
      return {
        success: true,
        data: response.data,
      };
    }
    return {
      success: false,
      data: [],
      error: "No data received",
    };
  } catch (error) {
    console.error("Error fetching public shared lists:", error);
    return {
      success: false,
      data: [],
      error: error,
    };
  }
}
