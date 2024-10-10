import MobileNavBar from "./navigation/MobileNavBar";
import NavBar from "./navigation/NavBar";
import { Suspense } from "react";
import { AccountMenu } from "./account/AccountMenu";
import { AccountSwitcher } from "./account/AccountSwitcher";
import { Cart } from "../cart/CartSheet";
import Logo from "./Logo";
import { getBanner, getCatalogMenu } from "../../services/storyblok";
import Content from "../storyblok/Content";
import CurrencySelector from "./CurrencySelector";
import CatalogSelector from "./CatalogSelector";
import { SearchModalAlgolia } from "../search/SearchModalAlgolia";
import { algoliaEnvData } from "../../lib/resolve-algolia-env";
import { SelectedAccount } from "./account/SelectedAccount";
import BulkOrderButton from "./BulkOrderButton";
import { cookies } from "next/headers";
import { retrieveAccountMemberCredentials } from "../../lib/retrieve-account-member-credentials";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../lib/cookie-constants";
import AdminAccountBanner from "./AdminAccountBanner";
import SearchModalKlevu from "../search/SearchModalKlevu";
import { Content as BuilderContent } from "@builder.io/sdk-react";
import { builderComponent } from "../../components/builder-io/BuilderComponents";
import { builder } from "@builder.io/sdk";
import { cmsConfig } from "../../lib/resolve-cms-env";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

const Header = async () => {
  const { enableBuilderIO, enabledStoryblok } = cmsConfig;
  const catalogMenu = await getCatalogMenu();

  const cookieStore = cookies();
  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookieStore,
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  const accountMemberTokens = accountMemberCookie?.accounts;
  const selectedAccountId = accountMemberCookie?.selected;
  const enabledKlevu: boolean =
    process.env.NEXT_PUBLIC_ENABLE_KLEVU === "true" || false;

  const contentData = async () => {
    if (enableBuilderIO) {
      const content = await builder
        .get("announcement", {
          prerender: false,
        })
        .toPromise();
      return content;
    }

    if (enabledStoryblok) {
      return await getBanner();
    }
  };
  const content = await contentData();

  return (
    <>
      <div className="sticky z-10 border-b border-gray-200 bg-white">
        <AdminAccountBanner accountMemberCookie={accountMemberCookie} />
        <Content content={catalogMenu}></Content>
        {enabledStoryblok && <Content content={content}></Content>}
        {enableBuilderIO && content.data.enabled && (
          <BuilderContent
            model="announcement"
            content={content}
            apiKey={process.env.NEXT_PUBLIC_BUILDER_IO_KEY || ""}
            customComponents={builderComponent}
          />
        )}
        <Suspense>
          <MobileNavBar />
        </Suspense>
        <div className="hidden w-full items-center justify-between md:flex p-4">
          <Logo />
          <div className="w-full max-w-base-max-width">
            <Suspense>
              <div>
                <NavBar />
              </div>
            </Suspense>
          </div>
          <div className="flex items-center self-center gap-x-2">
            <CatalogSelector />
            <CurrencySelector />
            {process.env.NEXT_PUBLIC_DISABLE_BULK_ORDER_LINK != "true" && (
              <BulkOrderButton />
            )}
            {algoliaEnvData.enabled && <SearchModalAlgolia />}
            {enabledKlevu && <SearchModalKlevu />}
            {accountMemberTokens &&
              Object.keys(accountMemberTokens).length > 1 &&
              Object.keys(accountMemberTokens).map((tokenKey) => {
                const value = accountMemberTokens[tokenKey];
                return (
                  selectedAccountId === value.account_id && (
                    <SelectedAccount
                      accountSwitcher={<AccountSwitcher />}
                      accountName={value.account_name}
                      key={value.account_id}
                    />
                  )
                );
              })}
            <AccountMenu />
            <Cart />
          </div>
        </div>
      </div>
      {accountMemberTokens &&
        Object.keys(accountMemberTokens).length > 1 &&
        Object.keys(accountMemberTokens).map((tokenKey) => {
          const value = accountMemberTokens[tokenKey];
          return (
            selectedAccountId === value.account_id && (
              <div
                className="bg-red-600 text-white text-center py-2"
                key={value.account_id}
              >
                You are currently logged in as Sales Representative for{" "}
                <span className="underline font-bold">
                  {value.account_name}
                </span>{" "}
                account. To switch account, click on the account name in the
                header.
              </div>
            )
          );
        })}
    </>
  );
};

export default Header;
