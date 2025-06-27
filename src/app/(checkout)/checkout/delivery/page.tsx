import { Metadata } from "next";
import { AccountDelivery } from "../AccountDelivery";
import {
  getSelectedAccount,
  retrieveAccountMemberCredentials,
} from "../../../../lib/retrieve-account-member-credentials";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../../lib/cookie-constants";
import { GuestDelivery } from "../GuestDelivery";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { COOKIE_PREFIX_KEY } from "../../../../lib/resolve-cart-env";
import { CheckoutViews } from "../CheckoutViews";
import { getServerSideCredentialsClient } from "../../../../lib/epcc-server-side-credentials-client";
import AdminAccountBanner from "../../../../components/header/AdminAccountBanner";

export const metadata: Metadata = {
  title: "Delivery - Checkout",
};

export default async function DeliveryPage() {
  const cookieStore = cookies();

  const cartCookie = cookieStore.get(`${COOKIE_PREFIX_KEY}_ep_cart`);
  const client = getServerSideCredentialsClient();

  const cart = await client.Cart(cartCookie?.value).With("items").Get();

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
    redirect("/login?returnUrl=/checkout/delivery");
  }

  return (
    <CheckoutViews>
      <AdminAccountBanner accountMemberCookie={accountMemberCookie} />
      {!accountMemberCookie ? <GuestDelivery /> : <AccountDelivery />}
    </CheckoutViews>
  );
}
