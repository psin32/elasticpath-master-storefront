"use client";
import { searchClient } from "../../../lib/search-client";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import { algoliaEnvData } from "../../../lib/resolve-algolia-env";
import { resolveAlgoliaRouting } from "../../../lib/algolia-search-routing";
import React from "react";
import { buildBreadcrumbLookup } from "../../../lib/build-breadcrumb-lookup";
import { ShopperProduct, useStore } from "../../../react-shopper-hooks";
import {
  Configure,
  HierarchicalMenuProps,
  PaginationProps,
  RangeInputProps,
  RefinementListProps,
  SearchBoxProps,
  SortByProps,
  useHierarchicalMenu,
  usePagination,
  useRange,
  useRefinementList,
  useSearchBox,
  useSortBy,
} from "react-instantsearch";
import { sortByItems } from "../../../lib/sort-by-items";
import { hierarchicalAttributes } from "../../../lib/hierarchical-attributes";
import { usePathname } from "next/navigation";
import { ShopperCatalogResourcePage } from "@moltin/sdk";
import SearchResultsAlgolia from "../../../components/search/SearchResultsAlgolia";
import SearchResultsElasticPath from "../../../components/search/SearchResultsElasticPath";

export function Search({
  page,
}: {
  page?: ShopperCatalogResourcePage<ShopperProduct>;
}) {
  const { nav } = useStore();
  const lookup = buildBreadcrumbLookup(nav ?? []);
  const pathname = usePathname();
  const nodes = pathname.split("/search/")?.[1]?.split("/");

  return (
    algoliaEnvData.enabled ? (
      <InstantSearchNext
        indexName={algoliaEnvData.indexName}
        searchClient={searchClient}
        routing={resolveAlgoliaRouting()}
        insights={true}
        future={{
          preserveSharedStateOnUnmount: true,
        }}
      >
        {/* Virtual widgets are here as a workaround for this issue https://github.com/algolia/instantsearch/issues/5890 */}
        <VirtualSearchBox autoCapitalize="off" />
        <VirtualPagination />
        <VirtualSortBy items={sortByItems} />
        <VirtualRangeInput attribute="ep_price" />
        <VirtualRefinementList attribute="price" />
        <VirtualHierarchicalMenu attributes={hierarchicalAttributes} />
        <SearchResultsAlgolia lookup={lookup} />
        <Configure filters="is_child:0" />
      </InstantSearchNext>
    ) : (
      <SearchResultsElasticPath page={page} nodes={nodes} />
    )
  );
}

function VirtualHierarchicalMenu(props: HierarchicalMenuProps) {
  useHierarchicalMenu(props);
  return null;
}
function VirtualSearchBox(props: SearchBoxProps) {
  useSearchBox(props);
  return null;
}
function VirtualPagination(props: PaginationProps) {
  usePagination(props);
  return null;
}
function VirtualSortBy(props: SortByProps) {
  useSortBy(props);
  return null;
}

function VirtualRangeInput(props: RangeInputProps) {
  useRange(props);
  return null;
}

function VirtualRefinementList(props: RefinementListProps) {
  useRefinementList(props);
  return null;
}
