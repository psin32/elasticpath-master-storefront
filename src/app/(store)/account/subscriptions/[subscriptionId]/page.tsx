import { cookies } from "next/headers";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../../../lib/cookie-constants";
import { redirect } from "next/navigation";
import { gateway, SubscriptionsStateAction } from "@moltin/sdk";
import { retrieveAccountMemberCredentials } from "../../../../../lib/retrieve-account-member-credentials";
import { epccEnv } from "../../../../../lib/resolve-epcc-env";
import { SubscriptionDetails } from "./SubscriptionDetails";

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

  const { client_id, host, client_secret } = epccEnv;
  const client = gateway({
    client_id,
    client_secret,
    host,
  });

  const include: any = ["plans", "products"];
  let subscription: any = await client.Subscriptions.With(include).Get(
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
    <SubscriptionDetails subscription={subscription} invoices={invoices} />
  );
}
