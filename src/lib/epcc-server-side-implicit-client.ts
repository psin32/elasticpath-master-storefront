import "server-only";
import { gateway, StorageFactory } from "@elasticpath/js-sdk";
import { epccEnv } from "./resolve-epcc-env";
import { resolveEpccCustomRuleHeaders } from "./custom-rule-headers";
import { COOKIE_PREFIX_KEY } from "./resolve-cart-env";
import {
  ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  CREDENTIALS_COOKIE_NAME,
} from "./cookie-constants";
import { cookies } from "next/headers";
import {
  getSelectedAccount,
  retrieveAccountMemberCredentials,
} from "./retrieve-account-member-credentials";

let customHeaders = resolveEpccCustomRuleHeaders();

const { client_id, host } = epccEnv;

export function getServerSideImplicitClient() {
  const cookieStore = cookies();
  const currencyInCookie = cookieStore.get(`${COOKIE_PREFIX_KEY}_ep_currency`);
  const tagInCookie = cookieStore.get(`${COOKIE_PREFIX_KEY}_ep_catalog_tag`);
  const credentialsCookie = cookies().get(CREDENTIALS_COOKIE_NAME);
  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookies(),
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );
  let accountToken = "";
  if (accountMemberCookie) {
    const selectedAccount = getSelectedAccount(accountMemberCookie);
    accountToken = selectedAccount.token;
  }

  if (customHeaders) {
    customHeaders["EP-Account-Management-Authentication-Token"] = accountToken;
    customHeaders["EP-Context-Tag"] = tagInCookie?.value || "";
  } else {
    customHeaders = {
      "EP-Account-Management-Authentication-Token": accountToken,
      "EP-Context-Tag": tagInCookie?.value || "",
    };
  }

  return gateway({
    name: COOKIE_PREFIX_KEY,
    client_id,
    host,
    currency: currencyInCookie?.value
      ? currencyInCookie?.value
      : process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_CODE,
    ...(customHeaders ? { headers: customHeaders } : {}),
    reauth: false,
    storage: createServerSideNextCookieStorageFactory(credentialsCookie?.value),
  });
}

function createServerSideNextCookieStorageFactory(
  initialCookieValue?: string,
): StorageFactory {
  let state = new Map<string, string>();

  if (initialCookieValue) {
    state.set(`${COOKIE_PREFIX_KEY}_ep_credentials`, initialCookieValue);
  }

  return {
    set: (key: string, value: string): void => {
      state.set(key, value);
    },
    get: (key: string): any => {
      return state.get(key);
    },
    delete: (key: string) => {
      state.delete(key);
    },
  };
}
