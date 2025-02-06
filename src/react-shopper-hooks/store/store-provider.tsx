import { StoreProviderProps } from "./types/store-context-types";
import { emitter } from "../event/event-context";
import { CartProvider } from "../cart";
import React, { createContext } from "react";
import type { ElasticPath as EPCCClient } from "@elasticpath/js-sdk";
import { NavigationNode } from "../../shopper-common/src";
import { useElasticPath } from "../elasticpath";

interface StoreState {
  client: EPCCClient;
  nav?: NavigationNode[];
}

export const StoreProviderContext = createContext<StoreState | null>(null);

export const StoreProvider = ({
  children,
  initialState,
  cartId,
}: StoreProviderProps) => {
  const { client } = useElasticPath();

  return (
    <StoreProviderContext.Provider value={{ client, nav: initialState?.nav }}>
      <CartProvider
        cartId={cartId}
        initialState={{
          cart: initialState?.cart,
        }}
        emit={emitter}
      >
        {children}
      </CartProvider>
    </StoreProviderContext.Provider>
  );
};
