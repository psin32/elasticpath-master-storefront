import { cookies } from "next/headers";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../../../lib/cookie-constants";
import { redirect } from "next/navigation";
import { retrieveAccountMemberCredentials } from "../../../../../lib/retrieve-account-member-credentials";
import { SubscriptionDetails } from "./SubscriptionDetails";
import { getServerSideCredentialsClientWihoutAccountToken } from "../../../../../lib/epcc-server-side-credentials-client";

export const dynamic = "force-dynamic";

export default async function SubscriptionItems({
  params,
}: {
  params: { subscriptionId: string };
}) {
  const cookieStore = cookies();

  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookieStore,
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  if (!accountMemberCookie) {
    return redirect("/login");
  }

  const client = getServerSideCredentialsClientWihoutAccountToken();

  const include: any = ["plans", "products"];
  const subscription: any = await client.Subscriptions.With(include).Get(
    params.subscriptionId,
  );
  const invoices = await client.request
    .send(
      `/subscriptions/subscriptions/${params.subscriptionId}/invoices`,
      "GET",
      null,
      undefined,
      client,
      undefined,
      "v2",
    )
    .catch((err) => {
      console.error("Error while getting account carts", err);
    });

  return (
    subscription?.data?.attributes?.payment_authority?.customer_id &&
    invoices && (
      <SubscriptionDetails subscription={subscription} invoices={invoices} />
    )
  );
}
