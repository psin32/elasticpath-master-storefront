"use client";

import { useQuery } from "@tanstack/react-query";
import { useElasticPath } from "../../elasticpath/elasticpath";
import Cookies from "js-cookie";
import { useContext } from "react";
import { AccountProviderContext } from "../account-provider";
import {
  getCreditBalance,
  getTotalStoreCreditBalance,
  type CreditBalanceResponse,
} from "../../../services/store-credit";
import type { AccountCredentials } from "../types";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../lib/cookie-constants";
import { COOKIE_PREFIX_KEY } from "../../../lib/resolve-cart-env";

export type StoreCreditBalance = {
  totalMinor: number;
  currency: string;
  formatted: string;
  items: CreditBalanceResponse["data"];
};

export function useStoreCreditBalance(options?: { enabled?: boolean }) {
  const { client } = useElasticPath();
  const ctx = useContext(AccountProviderContext);
  const cookieName = ctx?.accountCookieName ?? ACCOUNT_MEMBER_TOKEN_COOKIE_NAME;
  const accountCookie = Cookies.get(cookieName);
  const parsed = accountCookie
    ? (JSON.parse(accountCookie) as AccountCredentials | undefined)
    : undefined;
  const accountMemberId = parsed?.accountMemberId ?? "";

  const query = useQuery({
    queryKey: ["store-credit-balance", accountMemberId],
    queryFn: async () => {
      const selectedAccount = parsed?.accounts?.[parsed?.selected];
      const accountToken = selectedAccount?.token ?? "";
      const currencyHeader =
        (typeof window !== "undefined" &&
          Cookies.get(`${COOKIE_PREFIX_KEY}_ep_currency`)) ||
        "";
      const response = await getCreditBalance(client, {
        "x-moltin-currency": currencyHeader,
        "EP-Account-Management-Authentication-Token": accountToken,
      });
      const { totalMinor, currency, items } =
        getTotalStoreCreditBalance(response);
      const formatted =
        currency && totalMinor >= 0
          ? new Intl.NumberFormat("en-GB", {
              style: "currency",
              currency,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(totalMinor / 100)
          : "";
      return {
        totalMinor,
        currency,
        formatted,
        items,
        response,
      } as StoreCreditBalance & { response: CreditBalanceResponse };
    },
    enabled:
      (options?.enabled !== false && !!accountMemberId && !!client) ?? false,
  });

  return {
    ...query,
    balance: query.data
      ? {
          totalMinor: query.data.totalMinor,
          currency: query.data.currency,
          formatted: query.data.formatted,
          items: query.data.items,
        }
      : null,
  };
}
