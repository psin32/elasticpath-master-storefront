import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useState,
} from "react";
import type { ElasticPath as EpccClient } from "@elasticpath/js-sdk";
import { SimpleProduct } from "../../../shopper-common/src";
import { useStore } from "../../store";

interface SimpleProductState {
  product: SimpleProduct;
  setProduct: Dispatch<SetStateAction<SimpleProduct>>;
  client: EpccClient;
}

export const SimpleProductContext = createContext<SimpleProductState | null>(
  null,
);

export function SimpleProductProvider({
  children,
  simpleProduct,
  client: overrideClient,
}: {
  simpleProduct: SimpleProduct;
  children: ReactNode;
  client?: EpccClient;
}) {
  const { client } = useStore();
  const [product, setProduct] = useState<SimpleProduct>(simpleProduct);

  return (
    <SimpleProductContext.Provider
      value={{
        product,
        setProduct,
        client: overrideClient ?? client,
      }}
    >
      {children}
    </SimpleProductContext.Provider>
  );
}
