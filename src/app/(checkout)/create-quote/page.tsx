import { Metadata } from "next";
import {
  getSelectedAccount,
  retrieveAccountMemberCredentials,
} from "../../../lib/retrieve-account-member-credentials";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../lib/cookie-constants";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { COOKIE_PREFIX_KEY } from "../../../lib/resolve-cart-env";
import { getServerSideCredentialsClient } from "../../../lib/epcc-server-side-credentials-client";
import { CheckoutProvider } from "../checkout/checkout-provider";
import { CheckoutViews } from "../checkout/CheckoutViews";
import CreateQuote from "./CreateQuote";
import { cmsConfig } from "../../../lib/resolve-cms-env";
import { builder } from "@builder.io/sdk";
import { getLogo } from "../../../services/storyblok";
import Content from "../../../components/storyblok/Content";
import { builderComponent } from "../../../components/builder-io/BuilderComponents";
import Link from "next/link";
import { Content as BuilderContent } from "@builder.io/sdk-react";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

export const metadata: Metadata = {
  title: "Checkout",
};
export default async function CheckoutPage() {
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
    redirect("/login?returnUrl=/checkout");
  }
  const selectedAccount =
    accountMemberCookie && getSelectedAccount(accountMemberCookie);
  const response: any =
    selectedAccount &&
    (await client.AccountMemberships.With("account_members").All(
      selectedAccount.account_id,
    ));
  const accountMembers = response.included.account_members;

  const { enableBuilderIO, enabledStoryblok } = cmsConfig;
  const locale = cookieStore.get("locale")?.value || "en";
  const contentData = async () => {
    if (enableBuilderIO) {
      const content = await builder
        .get("logo", {
          prerender: false,
        })
        .toPromise();
      return content;
    }

    if (enabledStoryblok) {
      return await getLogo(locale);
    }
  };
  const content = await contentData();

  return (
    accountMemberCookie && (
      <CheckoutProvider>
        <CheckoutViews>
          <div className="flex flex-col lg:flex-row justify-center">
            <div className="flex justify-center items-center lg:hidden py-5">
              <Link href="/" aria-label="Go to home page">
                {enabledStoryblok && <Content content={content}></Content>}
                {enableBuilderIO && (
                  <BuilderContent
                    model="logo"
                    content={content}
                    apiKey={process.env.NEXT_PUBLIC_BUILDER_IO_KEY || ""}
                    customComponents={builderComponent}
                  />
                )}
              </Link>
            </div>
            <div className="flex flex-col lg:flex-row items-start flex-only-grow w-full">
              <div className="flex flex-col self-stretch px-5 lg:px-20 lg:w-[37.5rem] flex-1 lg:py-20 items-center gap-10">
                <div className="justify-center items-center hidden lg:flex py-5">
                  <Link href="/" aria-label="Go to home page">
                    {enabledStoryblok && <Content content={content}></Content>}
                    {enableBuilderIO && (
                      <BuilderContent
                        model="logo"
                        content={content}
                        apiKey={process.env.NEXT_PUBLIC_BUILDER_IO_KEY || ""}
                        customComponents={builderComponent}
                      />
                    )}
                  </Link>
                </div>
                {selectedAccount && (
                  <CreateQuote
                    accountMembers={accountMembers}
                    accountMemberId={accountMemberCookie.accountMemberId}
                    accountId={selectedAccount.account_id}
                    accountName={selectedAccount.account_name}
                    accountsCount={
                      accountMemberCookie?.accounts
                        ? Object.keys(accountMemberCookie?.accounts).length
                        : 1
                    }
                    accountToken={selectedAccount.token}
                  />
                )}
              </div>
            </div>
          </div>
        </CheckoutViews>
      </CheckoutProvider>
    )
  );
}
