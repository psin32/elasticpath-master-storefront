import Link from "next/link";
import { cookies } from "next/headers";
import { getLogo } from "../../services/storyblok";
import Content from "../storyblok/Content";
import { Content as BuilderContent } from "@builder.io/sdk-react";
import { builderComponent } from "../../components/builder-io/BuilderComponents";
import { builder } from "@builder.io/sdk";
import { cmsConfig } from "../../lib/resolve-cms-env";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

export default async function Logo() {
  const { enableBuilderIO, enabledStoryblok } = cmsConfig;
  const cookieStore = cookies();
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
    <div className="ml-4 flex lg:ml-0 text-white mr-4 min-w-40">
      <Link href="/">
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
  );
}
