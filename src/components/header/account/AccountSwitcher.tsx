"use server";

import { CheckCircleIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { cookies } from "next/headers";
import { retrieveAccountMemberCredentials } from "../../../lib/retrieve-account-member-credentials";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../lib/cookie-constants";
import { AccountSwitcherClient } from "./AccountSwitcherClient";

export async function AccountSwitcher() {
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
    <AccountSwitcherClient
      accounts={accountMemberTokens}
      selectedAccountId={selectedAccountId}
    />
  );
}
