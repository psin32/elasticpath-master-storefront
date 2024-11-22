"use client";
import HitsKlevu from "./HitsKlevu";
import Pagination from "./PaginationKlevu";
import { Fragment, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import {
  ProductsProvider,
  usePageContext,
  useSettings,
} from "./ProductsProviderKlevu";
import MobileFilters from "./MobileFilters";
import NoResults from "./NoResults";
import PriceRangeSlider from "./price-range-slider/PriceRangeSliderWrapperKlevu";
import { Popover, Transition } from "@headlessui/react";
import { sortByItems } from "../../lib/sort-by-items";
import NodeMenuKlevu from "./NodeMenuKlevu";
import { Content as BuilderContent } from "@builder.io/sdk-react";
import { cmsConfig } from "../../lib/resolve-cms-env";
import { builder } from "@builder.io/sdk";
import { builderComponent } from "../../components/builder-io/BuilderComponents";
import { KlevuFilterResultSlider } from "@klevu/core";
import { useRouter } from "next/navigation";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

type sortBySetting = {
  sortBy: string;
  setSortBy: (value: string | undefined) => void;
};

export default function SearchResultsKlevu({
  content,
}: {
  content: any;
}): JSX.Element {
  const { enableBuilderIO } = cmsConfig;
  let [showFilterMenu, setShowFilterMenu] = useState(false);
  // const pageContext = usePageContext();
  // const filters = pageContext?.filters || [];
  // const title = nodes ? resolveTitle(nodes, lookup) : "All Categories";
  const title = "Catalog";

  return (
    <ProductsProvider>
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
                Filter <ChevronDownIcon height={12} width={12} />
              </button>
              <MobileFilters
                showFilterMenu={showFilterMenu}
                setShowFilterMenu={setShowFilterMenu}
              />
            </div>
            <SortBy />
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
        <HitsUI />
      </div>
    </ProductsProvider>
  );
}

const HitsUI = (): JSX.Element => {
  const pageContext = usePageContext();
  const router = useRouter();
  const filters = pageContext?.filters || [];
  let priceFilter = (
    filters ? filters.find((filter) => filter.key === "klevu_price") : []
  ) as KlevuFilterResultSlider;

  return (
    <div className="grid grid-cols-[auto_1fr] gap-8">
      <div className="hidden w-[14rem] md:block lg:w-[16rem]">
        <h3 className="font-semibold">Category</h3>
        <NodeMenuKlevu />
        <PriceRangeSlider min={priceFilter?.min} max={priceFilter?.max} />
      </div>

      <div>
        {pageContext?.records && (
          <>
            <HitsKlevu
              data={pageContext.records}
              clickEvent={pageContext.searchClickEvent?.bind(pageContext)}
            />
            <div className="py-10">
              <Pagination page={pageContext} />
            </div>
          </>
        )}
        {!pageContext?.records && <NoResults />}
      </div>
    </div>
  );
};

const SortBy = (): JSX.Element => {
  const { setSortBy } = useSettings("sortBy") as sortBySetting;
  return (
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
                  {sortByItems.map((option) => (
                    <Popover.Button
                      className="flex w-full items-start px-3 py-2 hover:bg-gray-100"
                      key={option.label}
                      onClick={() => setSortBy(option.value)}
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
  );
};
