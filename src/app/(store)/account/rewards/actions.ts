"use server";

import { cookies } from "next/headers";
import { getServerSideImplicitClient } from "../../../../lib/epcc-server-side-implicit-client";
import {
  getSelectedAccount,
  retrieveAccountMemberCredentials,
} from "../../../../lib/retrieve-account-member-credentials";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../../lib/cookie-constants";
import { COOKIE_PREFIX_KEY } from "../../../../lib/resolve-cart-env";
import {
  getCreditBalance,
  getCreditTransactions,
  getTotalStoreCreditBalance,
  type CreditBalanceResponse,
  type CreditTransaction,
  type CreditTransactionsResponse,
  type StoreCreditClient,
} from "../../../../services/store-credit";

/**
 * Fetches store credit balance, transactions, and loyalty_id for the current account member (rewards section).
 */
export async function getRewardsData(params?: {
  transactionsLimit?: number;
  transactionsOffset?: number;
}): Promise<{
  balance: { totalMinor: number; currency: string; formatted: string };
  loyaltyId: string | null;
  transactions: CreditTransaction[];
  transactionsMeta: CreditTransactionsResponse["meta"] | null;
  response: CreditBalanceResponse | null;
} | null> {
  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookies(),
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );
  if (!accountMemberCookie) return null;

  const selectedAccount = getSelectedAccount(accountMemberCookie);
  const cookieStore = cookies();
  const currencyInCookie = cookieStore.get(`${COOKIE_PREFIX_KEY}_ep_currency`);
  const currency =
    currencyInCookie?.value ||
    process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_CODE ||
    "USD";

  try {
    const client = getServerSideImplicitClient() as StoreCreditClient;
    const response = await getCreditBalance(client, {
      "x-moltin-currency": currency,
      "EP-Account-Management-Authentication-Token": selectedAccount.token,
    });
    const { totalMinor, currency: balanceCurrency } =
      getTotalStoreCreditBalance(response);
    const formatted =
      balanceCurrency && totalMinor >= 0
        ? new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: balanceCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(totalMinor / 100)
        : "";
    const loyaltyId = response?.data?.[0]?.loyalty_id ?? null;

    let transactions: CreditTransaction[] = [];
    let transactionsMeta: CreditTransactionsResponse["meta"] | null = null;
    try {
      const transactionsResponse = await getCreditTransactions(
        client,
        {
          "x-moltin-currency": currency,
          "EP-Account-Management-Authentication-Token": selectedAccount.token,
        },
        {
          limit: params?.transactionsLimit ?? 20,
          offset: params?.transactionsOffset ?? 0,
        },
      );
      transactions = transactionsResponse.data ?? [];
      transactionsMeta = transactionsResponse.meta ?? null;
    } catch (txError) {
      console.error("getCreditTransactions error:", txError);
    }

    return {
      balance: { totalMinor, currency: balanceCurrency, formatted },
      loyaltyId,
      transactions,
      transactionsMeta,
      response,
    };
  } catch (error) {
    console.error("getRewardsData error:", error);
    return null;
  }
}
