"use server";
import { NavBarPopover } from "./NavBarPopover";
import { getServerSideImplicitClient } from "../../../lib/epcc-server-side-implicit-client";
import { buildSiteNavigation } from "../../../lib/build-site-navigation";
import { builder } from "@builder.io/sdk";
import { cookies } from "next/headers";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

export default async function NavBar() {
  const cookieStore = cookies();
  const productSource =
    cookieStore.get("product_source")?.value || "elasticpath";
  if (productSource === "external") {
    return (
      <div className="flex w-full">
        <nav className="flex gap-6 p-4">
          <a
            href="/all-products"
            className="text-sm font-medium text-black hover:underline focus:text-brand-primary focus:outline-none active:text-brand-primary"
          >
            All Products
          </a>
        </nav>
      </div>
    );
  }
  const client = getServerSideImplicitClient();
  const nav = await buildSiteNavigation(client);
  return (
    <div>
      <div className="flex w-full">
        <NavBarPopover nav={nav} />
      </div>
    </div>
  );
}
