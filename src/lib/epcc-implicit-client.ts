import { gateway, StorageFactory } from "@elasticpath/js-sdk";
import { epccEnv } from "./resolve-epcc-env";
import { resolveEpccCustomRuleHeaders } from "./custom-rule-headers";
import { deleteCookie, getCookie, setCookie } from "cookies-next";
import { COOKIE_PREFIX_KEY } from "./resolve-cart-env";
import { EP_CURRENCY_CODE } from "./resolve-ep-currency-code";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "./cookie-constants";
import {
  getSelectedAccount,
  parseAccountMemberCredentialsCookieStr,
} from "./retrieve-account-member-credentials";

let headers = resolveEpccCustomRuleHeaders();

const { client_id, host } = epccEnv;

export function getEpccImplicitClient() {
  const catalogTag = getCookie(`${COOKIE_PREFIX_KEY}_ep_catalog_tag`);
  const cookieValue =
    getCookie(ACCOUNT_MEMBER_TOKEN_COOKIE_NAME)?.toString() || "";
  if (cookieValue) {
    const accountMemberCookie =
      parseAccountMemberCredentialsCookieStr(cookieValue);
    if (accountMemberCookie) {
      const selectedAccount = getSelectedAccount(accountMemberCookie);
      const accountToken = selectedAccount.token;
      if (headers) {
        headers["EP-Account-Management-Authentication-Token"] = accountToken;
      } else {
        headers = {
          "EP-Account-Management-Authentication-Token": accountToken,
        };
      }
    }
  }

  if (catalogTag) {
    if (headers) {
      headers["EP-Context-Tag"] = catalogTag;
    } else {
      headers = {
        "EP-Context-Tag": catalogTag,
      };
    }
  }

  const client = gateway({
    name: COOKIE_PREFIX_KEY,
    client_id,
    host,
    currency: EP_CURRENCY_CODE,
    ...(headers ? { headers } : {}),
    storage: createNextCookieStorageFactory(),
  });
  return client;
}

function createNextCookieStorageFactory(): StorageFactory {
  return {
    set: (key: string, value: string): void => {
      setCookie(key, value, {
        sameSite: "strict",
      });
    },
    get: (key: string): any => {
      return getCookie(key);
    },
    delete: (key: string) => {
      deleteCookie(key);
    },
  };
}
