import { cookies } from "next/headers";
import {
  getSelectedAccount,
  retrieveAccountMemberCredentials,
} from "../../../lib/retrieve-account-member-credentials";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../lib/cookie-constants";
import { redirect } from "next/navigation";
import { ManageCarts } from "../../../components/cart/ManageCarts";

export default async function Page() {
  const cookieStore = cookies();

  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookieStore,
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  if (!accountMemberCookie) {
    return redirect("/login");
  }

  const selectedAccount = getSelectedAccount(accountMemberCookie);
  return <ManageCarts token={selectedAccount.token} />;
}
