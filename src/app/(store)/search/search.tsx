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
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { ShopperCatalogResourcePage } from "@elasticpath/js-sdk";
import SearchResultsAlgolia from "../../../components/search/SearchResultsAlgolia";
import SearchResultsElasticPath from "../../../components/search/SearchResultsElasticPath";
import SearchResultsKlevu from "../../../components/search/SearchResultsKlevu";

export function Search({
  page,
  content,
}: {
  page?: ShopperCatalogResourcePage<ShopperProduct>;
  content: any;
}) {
  const { nav } = useStore();
  const lookup = buildBreadcrumbLookup(nav ?? []);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const nodes = pathname.split("/search/")?.[1]?.split("/");
  const enabledKlevu: boolean =
    process.env.NEXT_PUBLIC_ENABLE_KLEVU === "true" || false;

  // Remove the router.refresh() effect

  return algoliaEnvData.enabled ? (
    <InstantSearchNext
      key={q}
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
      <SearchResultsAlgolia key={q} lookup={lookup} content={content} />
      <Configure filters="is_child:0" />
    </InstantSearchNext>
  ) : enabledKlevu ? (
    <SearchResultsKlevu content={content} />
  ) : (
    <SearchResultsElasticPath page={page} nodes={nodes} content={content} />
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
