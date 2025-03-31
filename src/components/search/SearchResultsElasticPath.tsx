"use client";
import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import NodeMenu from "./NodeMenuAlgolia";
import { ProductsProvider } from "./ProductsProvider";
import { ShopperCatalogResourcePage } from "@elasticpath/js-sdk";
import { BreadcrumbLookup } from "../../lib/types/breadcrumb-lookup";
import { buildBreadcrumbLookup } from "../../lib/build-breadcrumb-lookup";
import MobileFilters from "./MobileFilters";
import { useStore, ShopperProduct } from "../../react-shopper-hooks";
import HitsElasticPath from "./HitsElasticPath";
import PaginationElasticPath from "./PaginationElasticPath";
import { Content as BuilderContent } from "@builder.io/sdk-react";
import { cmsConfig } from "../../lib/resolve-cms-env";
import { builder } from "@builder.io/sdk";
import { builderComponent } from "../../components/builder-io/BuilderComponents";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

interface ISearchResults {
  page?: ShopperCatalogResourcePage<ShopperProduct> | any;
  nodes?: string[];
  content: any;
  adminDisplay?: boolean;
}

export default function SearchResultsElasticPath({
  page,
  nodes,
  content,
  adminDisplay,
}: ISearchResults): JSX.Element {
  const { enableBuilderIO } = cmsConfig;
  let [showFilterMenu, setShowFilterMenu] = useState(false);
  const { nav, client } = useStore() as any;
  const lookup = buildBreadcrumbLookup(nav ?? []);
  const title = nodes ? resolveTitle(nodes, lookup) : "All Categories";

  return (
    <ProductsProvider client={client} page={page}>
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
          <div className="py-2">
            <span className="text-2xl font-bold md:text-4xl">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="block md:hidden">
              <button
                className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-base font-medium text-black transition-all duration-200 hover:bg-gray-100"
                onClick={() => setShowFilterMenu(true)}
              >
                Categories <ChevronDownIcon height={12} width={12} />
              </button>
              <MobileFilters
                lookup={lookup}
                showFilterMenu={showFilterMenu}
                setShowFilterMenu={setShowFilterMenu}
              />
            </div>
          </div>
        </div>
        <hr />
        {enableBuilderIO && (
          <BuilderContent
            model="page"
            content={content}
            apiKey={process.env.NEXT_PUBLIC_BUILDER_IO_KEY || ""}
            customComponents={builderComponent}
          />
        )}
        <div className="grid gap-8">
          {!adminDisplay && (
            <div className="hidden w-[14rem] md:block lg:w-[16rem]">
              <h3 className="font-semibold">Category</h3>
              {nav && <NodeMenu nav={nav} />}
            </div>
          )}

          <div>
            <HitsElasticPath adminDisplay={adminDisplay} />
            <div className="py-10">
              <PaginationElasticPath />
            </div>
          </div>
        </div>
      </div>
    </ProductsProvider>
  );
}

function resolveTitle(slugArray: string[], lookup?: BreadcrumbLookup): string {
  return (
    lookup?.[`/${slugArray.join("/")}`]?.name ??
    slugArray[slugArray?.length - 1]
  );
}
