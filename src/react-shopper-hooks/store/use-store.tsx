import { useContext } from "react";
import { StoreProviderContext } from "../store/store-provider";
import { ElasticPath } from "@elasticpath/js-sdk";
import { NavigationNode } from "../../shopper-common/src";

export function useStore(): {
  client: ElasticPath;
  nav?: NavigationNode[];
  catalogId?: string;
} {
  const ctx = useContext(StoreProviderContext);

  if (!ctx) {
    throw new Error(
      "Store context was unexpectedly null, make sure you are using the useStore hook inside a StoreProvider!",
    );
  }

  return {
    client: ctx.client,
    nav: ctx.nav,
    catalogId: ctx.catalogId,
  };
}
