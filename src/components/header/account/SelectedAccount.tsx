"use server";

import { CheckCircleIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { cookies } from "next/headers";
import { retrieveAccountMemberCredentials } from "../../../lib/retrieve-account-member-credentials";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../lib/cookie-constants";
import { SwitchButton } from "./switch-button";

export async function SelectedAccount() {
  const cookieStore = cookies();
  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookieStore,
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  if (!accountMemberCookie) {
    return null;
  }

  const accountMemberTokens = accountMemberCookie.accounts;
  const selectedAccountId = accountMemberCookie.selected;

  return (
    Object.keys(accountMemberTokens).length > 1 &&
    Object.keys(accountMemberTokens).map((tokenKey) => {
      const value = accountMemberTokens[tokenKey];
      const Icon =
        selectedAccountId === value.account_id
          ? CheckCircleIcon
          : UserCircleIcon;
      return (
        selectedAccountId === value.account_id && (
          <SwitchButton
            className={`${
              selectedAccountId === value.account_id
                ? "bg-brand-highlight/10"
                : "text-gray-900"
            } group w-full items-center rounded-md px-2 py-2 text-sm hover:bg-brand-primary hover:text-white transition-color ease-in-out duration-100 mt-1`}
          >
            {value.account_name}
          </SwitchButton>
        )
      );
    })
  );
}
