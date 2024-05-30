import { getCookie, setCookie } from "cookies-next";
import { isEmptyObj } from "./is-empty-object";
import { COOKIE_PREFIX_KEY } from "./resolve-cart-env";

export function resolveEpccCustomRuleHeaders():
  | {
      "EP-Context-Tag"?: string;
      "EP-Channel"?: string;
      "EP-Account-Management-Authentication-Token"?: string;
    }
  | undefined {
  const catalogTag = getCookie(`${COOKIE_PREFIX_KEY}_ep_catalog_tag`);

  const { epContextTag, epChannel } = {
    epContextTag: process.env.NEXT_PUBLIC_CONTEXT_TAG,
    epChannel: process.env.NEXT_PUBLIC_CHANNEL,
  };
  const headers = {
    ...(typeof catalogTag === "string" && catalogTag === "__ep__default"
      ? { "EP-Context-Tag": catalogTag }
      : {}),
    ...(epChannel ? { "EP-Channel": epChannel } : {}),
  };

  return isEmptyObj(headers) ? undefined : headers;
}
