import { Metadata } from "next";
import { AccountCheckout } from "../AccountCheckout";
import { retrieveAccountMemberCredentials } from "../../../../lib/retrieve-account-member-credentials";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../../lib/cookie-constants";
import { GuestCheckout } from "../GuestCheckout";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getEpccImplicitClient } from "../../../../lib/epcc-implicit-client";
import { CheckoutProvider } from "../checkout-provider";
import { CheckoutViews } from "../CheckoutViews";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function Page({ params }: { params: { cartId: string } }) {
  const cookieStore = cookies();

  const client = getEpccImplicitClient();

  const cart = await client.Cart(params.cartId).With("items").Get();

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
