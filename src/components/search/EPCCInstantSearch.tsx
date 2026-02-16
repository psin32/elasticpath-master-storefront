"use client";

import React from "react";
import "instantsearch.css/themes/satellite.css";
import {
  Configure,
  HierarchicalMenu,
  RefinementList,
} from "react-instantsearch";
import { InstantSearch } from "react-instantsearch-core";
import CatalogSearchInstantSearchAdapter from "@elasticpath/catalog-search-instantsearch-adapter";
import { INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTES } from "../../lib/hierarchical-attributes";
import { client as epccClient } from "@epcc-sdk/sdks-shopper";
import SearchResultsElasticPathSearch from "./SearchResultsElasticPathSearch";

export default function EPCCInstantSearch({
  indexName = "search",
}: {
  indexName?: string;
}): JSX.Element {
  const catalogSearchInstantSearchAdapter =
    new CatalogSearchInstantSearchAdapter({
      client: epccClient,
    } as any);
  const searchClient = catalogSearchInstantSearchAdapter.searchClient;
  const attributes = INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTES;

  return (
    <InstantSearch indexName={indexName} searchClient={searchClient} routing>
      <Configure
        attributesToSnippet={["attributes.name:7", "attributes.description:15"]}
        snippetEllipsisText="…"
      />
      <SearchResultsElasticPathSearch content={null} />
    </InstantSearch>
  );
}
