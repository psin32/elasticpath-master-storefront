import { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { COOKIE_PREFIX_KEY } from "../../../lib/resolve-cart-env";
import { getServerSideCredentialsClient } from "../../../lib/epcc-server-side-credentials-client";
import { retrieveAccountMemberCredentials } from "../../../lib/retrieve-account-member-credentials";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../lib/cookie-constants";
import { ReserveProvider } from "./reserve-provider";
import { ReserveViews } from "./ReserveViews";
import AdminAccountBanner from "../../../components/header/AdminAccountBanner";
import { AccountReserve } from "./AccountReserve";
import { GuestReserve } from "./GuestReserve";

export const metadata: Metadata = {
  title: "Reserve Order",
};

export default async function ReservePage() {
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

  return (
    <ReserveProvider>
      <ReserveViews>
        <AdminAccountBanner accountMemberCookie={accountMemberCookie} />
        {!accountMemberCookie ? <GuestReserve /> : <AccountReserve />}
      </ReserveViews>
    </ReserveProvider>
  );
}
