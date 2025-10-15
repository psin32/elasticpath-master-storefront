"use client";
import { algoliaEnvData } from "../../lib/resolve-algolia-env";
import { BreadcrumbLookup } from "../../lib/types/breadcrumb-lookup";
import MobileFilters from "./MobileFilters";
import PriceRangeSlider from "./price-range-slider/PriceRangeSliderWrapper";
import ProductSpecification from "./product-specification/ProductSpecification";
import { Popover, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { useInstantSearch, useSortBy } from "react-instantsearch";
import { sortByItems } from "../../lib/sort-by-items";
import { getEpRoutePrice } from "../../lib/search-constants";
import NodeMenuAlgolia from "./NodeMenuAlgolia";
import { useCatalogId, useStore } from "../../react-shopper-hooks";
import HitsAlgolia from "./HitsAlgolia";
import PaginationAlgolia from "./PaginationAlgolia";
import { Content as BuilderContent } from "@builder.io/sdk-react";
import { cmsConfig } from "../../lib/resolve-cms-env";
import { builder } from "@builder.io/sdk";
import { builderComponent } from "../../components/builder-io/BuilderComponents";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

interface ISearchResults {
  lookup?: BreadcrumbLookup;
  content: any;
}

function resolveTitle(slugArray: string[], lookup?: BreadcrumbLookup): string {
  return (
    lookup?.[`/${slugArray.join("/")}`]?.name ??
    slugArray[slugArray?.length - 1]
  );
}

export default function SearchResultsAlgolia({
  lookup,
  content,
}: ISearchResults): JSX.Element {
  const { enableBuilderIO } = cmsConfig;
  const { uiState } = useInstantSearch();
  let [showFilterMenu, setShowFilterMenu] = useState(false);
  const { nav } = useStore();
  const catalogId = useCatalogId();

  const { options, refine } = useSortBy({ items: sortByItems });

  const { hierarchicalMenu, query } = uiState[algoliaEnvData.indexName];
  const slugArray = catalogId
    ? hierarchicalMenu?.[`${catalogId}.ep_slug_categories.lvl0`]
    : undefined;

  const title = slugArray ? resolveTitle(slugArray, lookup) : "All Categories";
  const EP_ROUTE_PRICE = catalogId ? getEpRoutePrice(catalogId) : undefined;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
        <div className="py-2">
          <span className="text-2xl font-bold md:text-4xl">{title}</span>
          {query && (
            <span className="ml-4">Search results for &quot;{query}&quot;</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="block md:hidden">
            <button
              className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-base font-medium text-black transition-all duration-200 hover:bg-gray-100"
              onClick={() => setShowFilterMenu(true)}
            >
              Filter <ChevronDownIcon height={12} width={12} />
            </button>
            <MobileFilters
              lookup={lookup}
              showFilterMenu={showFilterMenu}
              setShowFilterMenu={setShowFilterMenu}
            />
          </div>
          <div className="py-2">
            <Popover className="relative">
              {({}) => (
                <>
                  <Popover.Button className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-base font-medium text-black transition-all duration-200 hover:bg-gray-100">
                    Sort <ChevronDownIcon height={12} width={12} />
                  </Popover.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel className="absolute right-0 z-10 mt-2 w-48 transform text-sm sm:px-0 xl:left-0 xl:right-auto">
                      <div className="z-60 flex flex-col items-start overflow-hidden rounded-md border bg-white py-2">
                        {options.map((option) => (
                          <Popover.Button
                            className="flex w-full items-start px-3 py-2 hover:bg-gray-100"
                            key={option.value}
                            onClick={() => refine(option.value)}
                          >
                            {option.label}
                          </Popover.Button>
                        ))}
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
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

      <div className="grid grid-cols-[auto_1fr] gap-8">
        <div className="hidden w-[14rem] md:block lg:w-[16rem]">
          <h3 className="font-semibold">Category</h3>
          {nav && <NodeMenuAlgolia nav={nav} />}
          {EP_ROUTE_PRICE && <PriceRangeSlider attribute={EP_ROUTE_PRICE} />}
          <ProductSpecification />
        </div>

        <div>
          <HitsAlgolia />
          <div className="py-10">
            <PaginationAlgolia />
          </div>
        </div>
      </div>
    </div>
  );
}
