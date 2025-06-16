import EpLogo from "../../../components/icons/ep-logo";
import { cookies } from "next/headers";
import { isAccountMemberAuthenticated } from "../../../lib/is-account-member-authenticated";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { useTranslation } from "../../i18n";
import { cmsConfig } from "../../../lib/resolve-cms-env";
import { Content as BuilderContent } from "@builder.io/sdk-react";
import { builder } from "@builder.io/sdk";
import { getLogo } from "../../../services/storyblok";
import Content from "../../../components/storyblok/Content";
import { builderComponent } from "../../../components/builder-io/BuilderComponents";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

export default async function Login({
  searchParams,
}: {
  searchParams: { returnUrl?: string };
}) {
  const { returnUrl } = searchParams;
  const { enableBuilderIO, enabledStoryblok } = cmsConfig;
  const cookieStore = cookies();
  const { t } = await useTranslation(
    cookieStore.get("locale")?.value || "en",
    "auth",
    {},
  );

  if (isAccountMemberAuthenticated(cookieStore)) {
    redirect("/account/summary");
  }

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
      return await getLogo("en");
    }
  };
  const content = await contentData();

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <Link href="/">
            <div className="flex justify-center">
              {enabledStoryblok && <Content content={content}></Content>}
              {enableBuilderIO && (
                <BuilderContent
                  model="logo"
                  content={content}
                  apiKey={process.env.NEXT_PUBLIC_BUILDER_IO_KEY || ""}
                  customComponents={builderComponent}
                />
              )}
            </div>
          </Link>
          <h2 className="mt-10 text-center text-2xl font-medium leading-9 tracking-tight text-gray-900">
            {t("login.header")}
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <LoginForm returnUrl={returnUrl} />

          <p className="mt-10 text-center text-sm text-gray-500">
            {t("login.not-a-member")}{" "}
            <a
              href="/register"
              className="leading-6 text-brand-primary hover:text-brand-highlight"
            >
              {t("login.link.register-now")}
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
