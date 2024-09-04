import React from "react";
import { cookies } from "next/headers";
import { getServerSideCredentialsClient } from "../../../../lib/epcc-server-side-credentials-client";
import {
  getSelectedAccount,
  retrieveAccountMemberCredentials,
} from "../../../../lib/retrieve-account-member-credentials";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../../lib/cookie-constants";
import CardSection from "../../../../components/card/CardSection";

export default async function CardPage() {
  const cookieStore = cookies();

  const client = getServerSideCredentialsClient();

  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookieStore,
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  let stripeCustomerId = undefined;
  if (accountMemberCookie) {
    const selectedAccount = getSelectedAccount(accountMemberCookie);
    const response: any = await client.Accounts.Get(selectedAccount.account_id);
    stripeCustomerId = response?.data?.stripe_customer_id;
  }

  return <CardSection customerId={stripeCustomerId} />;
}
