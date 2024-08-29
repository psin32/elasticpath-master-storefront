import FeaturedProducts from "../../components/featured-products/FeaturedProducts";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { getHomePageContent } from "../../services/storyblok";
import Content from "../../components/storyblok/Content";
import { cmsConfig } from "../../lib/resolve-cms-env";
import { builder } from "@builder.io/sdk";
import { Content as BuilderContent } from "@builder.io/sdk-react";
import { builderComponent } from "../../components/builder-io/BuilderComponents";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

export default async function Home() {
  const { enabledStoryblok, enableBuilderIO } = cmsConfig;

  const cookieStore = cookies();
  const locale = cookieStore.get("locale")?.value || "en";
  const contentData = async () => {
    if (enabledStoryblok) {
      return await getHomePageContent(locale);
    }
    if (enableBuilderIO) {
      return await builder
        .get("page", {
          userAttributes: { urlPath: "/homepage" },
          prerender: false,
        })
        .toPromise();
    }
  };
  const content = await contentData();

  return (
    <div>
      {enabledStoryblok && content && <Content content={content}></Content>}
      {enableBuilderIO && content && (
        <BuilderContent
          model="page"
          content={content}
          apiKey={process.env.NEXT_PUBLIC_BUILDER_IO_KEY || ""}
          customComponents={builderComponent}
        />
      )}
      {enabledStoryblok && (
        <div className="grid gap-12 p-[2rem] md:p-[4em]">
          <div className="gap-3 p-8 md:p-16">
            <div>
              <Suspense>
                <FeaturedProducts
                  title="Trending Products"
                  linkProps={{
                    link: `/search`,
                    text: "See all products",
                  }}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
