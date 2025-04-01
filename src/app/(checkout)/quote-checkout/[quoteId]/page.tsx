import { Metadata } from "next";
import { retrieveAccountMemberCredentials } from "../../../../lib/retrieve-account-member-credentials";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../../lib/cookie-constants";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getEpccImplicitClient } from "../../../../lib/epcc-implicit-client";
import { CheckoutProvider } from "../../checkout/checkout-provider";
import { CheckoutViews } from "../../checkout/CheckoutViews";
import { GuestCheckout } from "../../checkout/GuestCheckout";
import { AccountCheckout } from "../../checkout/AccountCheckout";
import { getServerSideCredentialsClientWihoutAccountToken } from "../../../../lib/epcc-server-side-credentials-client";

export const metadata: Metadata = {
  title: "Quote Checkout",
};

export default async function Page({
  params,
}: {
  params: { quoteId: string };
}) {
  const cookieStore = cookies();

  const client = getServerSideCredentialsClientWihoutAccountToken();
  const quote = await client.request.send(
    `/extensions/quotes?filter=eq(quote_ref,${params.quoteId})`,
    "GET",
    undefined,
    undefined,
    client,
    false,
    "v2",
  );
  const cart = await client.Cart(quote.data[0].cart_id).With("items").Get();

  if (!cart) {
    notFound();
  }

  if ((cart.included?.items?.length ?? 0) < 1) {
    redirect("/cart");
  }

  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookieStore,
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  if (
    !accountMemberCookie &&
    cart.included?.items.find((item) => item.subscription_offering_id)
  ) {
    redirect("/login?returnUrl=/checkout");
  }

  return (
    <CheckoutProvider cart={cart}>
      <CheckoutViews>
        {!accountMemberCookie ? (
          <GuestCheckout cart={cart} />
        ) : (
          <AccountCheckout cart={cart} />
        )}
      </CheckoutViews>
    </CheckoutProvider>
  );
}
