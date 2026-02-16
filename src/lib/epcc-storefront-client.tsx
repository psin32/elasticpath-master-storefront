"use client";

import React from "react";
import { configureClient } from "@epcc-sdk/sdks-shopper";
import { epccEnv } from "./resolve-epcc-env";
import { getCookie } from "cookies-next";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "./cookie-constants";
import { EP_CURRENCY_CODE } from "./resolve-ep-currency-code";

// Configure the SDK client immediately when the module is loaded
const clientId = process.env.NEXT_PUBLIC_EPCC_CLIENT_ID || epccEnv.client_id;
const baseUrl =
  "https://" + process.env.NEXT_PUBLIC_EPCC_ENDPOINT_URL || epccEnv.host;

if (!clientId) {
  throw new Error("Missing storefront client id (NEXT_PUBLIC_EPCC_CLIENT_ID)");
}

if (!baseUrl) {
  throw new Error(
    "Missing storefront endpoint URL (NEXT_PUBLIC_EPCC_ENDPOINT_URL)",
  );
}

// Read selected account token from the account credentials cookie and set header if present
let accountToken: string | undefined = undefined;
try {
  const raw = getCookie(ACCOUNT_MEMBER_TOKEN_COOKIE_NAME) as string | undefined;
  if (raw) {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const selectedKey = parsed?.selected;
    const selected = parsed?.accounts?.[selectedKey];
    // selected may be an object with `token` property (AccountTokenBase)
    accountToken = selected?.token ?? selected;
  }
} catch (err) {
  console.warn("Failed to parse account member token cookie:", err);
}

let headers: Record<string, string> | undefined = accountToken
  ? { "EP-Account-Management-Authentication-Token": String(accountToken) }
  : undefined;

// Attach currency header
if (EP_CURRENCY_CODE) {
  if (headers) {
    headers["x-moltin-currency"] = EP_CURRENCY_CODE;
  } else {
    headers = { "x-moltin-currency": EP_CURRENCY_CODE };
  }
}

configureClient(
  {
    baseUrl,
    headers,
  },
  {
    clientId,
    storage: "localStorage",
  },
);

export function StorefrontProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
