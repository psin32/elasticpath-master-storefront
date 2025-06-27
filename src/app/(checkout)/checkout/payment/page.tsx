import { Metadata } from "next";
import { AccountPayment } from "../AccountPayment";
import {
  getSelectedAccount,
  retrieveAccountMemberCredentials,
} from "../../../../lib/retrieve-account-member-credentials";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../../lib/cookie-constants";
import { GuestPayment } from "../GuestPayment";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { COOKIE_PREFIX_KEY } from "../../../../lib/resolve-cart-env";
import { CheckoutViews } from "../CheckoutViews";
import { getServerSideCredentialsClient } from "../../../../lib/epcc-server-side-credentials-client";
import AdminAccountBanner from "../../../../components/header/AdminAccountBanner";

export const metadata: Metadata = {
  title: "Payment - Checkout",
};

export default async function PaymentPage() {
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
    redirect("/login?returnUrl=/checkout/payment");
  }

  let stripeCustomerId = undefined;
  if (accountMemberCookie) {
    const selectedAccount = getSelectedAccount(accountMemberCookie);
    const response: any = await client.Accounts.Get(selectedAccount.account_id);
    stripeCustomerId = response?.data?.stripe_customer_id;
  }

  return (
    <CheckoutViews>
      <AdminAccountBanner accountMemberCookie={accountMemberCookie} />
      {!accountMemberCookie ? (
        <GuestPayment />
      ) : (
        <AccountPayment stripeCustomerId={stripeCustomerId} />
      )}
    </CheckoutViews>
  );
}
