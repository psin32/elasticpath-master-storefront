import NoResults from "./NoResults";
import HitComponentKlevu from "./HitKlevu";
import { KlevuRecord } from "@klevu/core";
import { useEffect, useState } from "react";
import { ProductResponse, ShopperCatalogResource } from "@elasticpath/js-sdk";
import { getEpccImplicitClient } from "../../lib/epcc-implicit-client";
import { getProductByIds } from "../../services/products";

type HitsProps = {
  data: KlevuRecord[];
  clickEvent?: (params: { productId: string }) => void;
  recommendation?: boolean;
};

export default function HitsKlevu({
  data,
  clickEvent,
  recommendation,
}: HitsProps): JSX.Element {
  const [products, setProducts] = useState<
    ShopperCatalogResource<ProductResponse[]> | undefined
  >(undefined);
  const client = getEpccImplicitClient();

  useEffect(() => {
    const init = async () => {
      setProducts(
        await getProductByIds(data.map((hit) => hit.id).join(","), client),
      );
    };
    init();
  }, [data]);

  if (data.length) {
    return (
      <div
        className={`grid max-w-[80rem] grid-cols-1 gap-8 sm:grid-cols-2 ${recommendation ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
      >
        {products &&
          data.map((hit) => {
            const product: ProductResponse | undefined = products.data.find(
              (prd) => prd.id === hit.id,
            );
            if (product) {
              return (
                <div
                  className="list-none justify-items-stretch rounded-lg animate-fadeIn"
                  key={hit.id}
                >
                  <HitComponentKlevu
                    hit={hit}
                    clickEvent={clickEvent}
                    product={product}
                  />
                </div>
              );
            }
            return <></>;
          })}
      </div>
    );
  }
  return <NoResults />;
}
