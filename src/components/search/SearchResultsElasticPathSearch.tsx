"use client";

import { Fragment, useState } from "react";
import { Popover, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import {
  HierarchicalMenu,
  RefinementList,
  useInstantSearch,
  useSortBy,
  useRefinementList,
} from "react-instantsearch";
import PaginationElasticPathSearch from "./PaginationElasticPathSearch";
import { useStore } from "../../react-shopper-hooks";
import { sortByItems } from "../../lib/sort-by-items";
import MobileFilters from "./MobileFilters";
import { Content as BuilderContent } from "@builder.io/sdk-react";
import { cmsConfig } from "../../lib/resolve-cms-env";
import { builder } from "@builder.io/sdk";
import { builderComponent } from "../builder-io/BuilderComponents";
import PlasmicContent from "../plasmic/PlasmicContent";
import HitsElasticPathSearch from "./HitsElasticPathSearch";
import { INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTES } from "../../lib/hierarchical-attributes";
import ProductSpecification from "./product-specification/ProductSpecification";

builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

interface ISearchResults {
  lookup?: any;
  content: any;
  indexName?: string;
}

export default function SearchResultsElasticPathSearch({
  lookup,
  content,
  indexName = "search",
}: ISearchResults): JSX.Element {
  const { enableBuilderIO, enablePlasmic } = cmsConfig;
  const { uiState } = useInstantSearch();
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const { options, refine } = useSortBy({ items: sortByItems });

  const query = uiState[indexName]?.query || "";
  const title = query ? `Search results for "${query}"` : "Search results";

  return (
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
      {enablePlasmic && <PlasmicContent component="page" />}

      <div className="grid grid-cols-[auto_1fr] gap-8">
        <div className="hidden w-[14rem] md:block lg:w-[16rem]">
          <div className="my-6">
            <h4 className="font-semibold mb-2">Categories</h4>
            <HierarchicalMenu
              attributes={INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTES}
            />
          </div>
          <ProductSpecification />
        </div>

        <div>
          <HitsElasticPathSearch />
          <div className="py-10">
            <PaginationElasticPathSearch />
          </div>
        </div>
      </div>
    </div>
  );
}
