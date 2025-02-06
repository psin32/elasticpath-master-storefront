import { useHits } from "react-instantsearch";
import { SearchHit } from "./SearchHit";
import NoResults from "./NoResults";
import { getProductByIds } from "../../services/products";
import { getEpccImplicitClient } from "../../lib/epcc-implicit-client";
import { useEffect, useState } from "react";
import { ProductResponse, ShopperCatalogResource } from "@elasticpath/js-sdk";
import HitComponentAlgolia from "./HitAlgolia";

export default function HitsAlgolia(): JSX.Element {
  const { hits, sendEvent } = useHits<SearchHit>();
  const [products, setProducts] = useState<
    ShopperCatalogResource<ProductResponse[]> | undefined
  >(undefined);
  const client = getEpccImplicitClient();

  useEffect(() => {
    const init = async () => {
      setProducts(
        await getProductByIds(
          hits.map((hit) => hit.objectID).join(","),
          client,
        ),
      );
    };
    init();
  }, [hits]);

  if (hits.length) {
    return (
      <div className="grid max-w-[80rem] grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products &&
          hits.map((hit) => {
            const product: ProductResponse | undefined = products.data.find(
              (prd) => prd.id === hit.objectID,
            );
            if (product) {
              return (
                <div
                  className="list-none justify-items-stretch rounded-lg animate-fadeIn"
                  key={hit.objectID}
                >
                  <HitComponentAlgolia
                    hit={hit}
                    product={product}
                    sendEvent={sendEvent}
                  />
                </div>
              );
            }
            return <></>;
          })}
      </div>
    );
  }
  return <NoResults displayIcon={false} />;
}
