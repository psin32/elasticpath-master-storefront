"use server";
import { NavBarPopover } from "./NavBarPopover";
import { getServerSideImplicitClient } from "../../../lib/epcc-server-side-implicit-client";
import { buildSiteNavigation } from "../../../lib/build-site-navigation";
import { builder } from "@builder.io/sdk";
import { cmsConfig } from "../../../lib/resolve-cms-env";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

export default async function NavBar() {
  const { enabledStoryblok, enableBuilderIO } = cmsConfig;
  const contentData = async () => {
    if (enabledStoryblok) {
      const client = getServerSideImplicitClient();
      return await buildSiteNavigation(client);
    }
    if (enableBuilderIO) {
      const nav = await builder
        .get("navigation", {
          userAttributes: {},
          prerender: false,
        })
        .toPromise();
      return nav?.data?.data;
    }
  };
  const nav = await contentData();

  return (
    <div>
      <div className="flex w-full">
        <NavBarPopover nav={nav} />
      </div>
    </div>
  );
}
