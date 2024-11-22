"use client";
import { useEffect, useState } from "react";
import { KlevuRecord } from "@klevu/core";
import Hits from "../search/HitsKlevu";
import HitPlaceholder from "../search/HitPlaceholder";
import { fetchFeatureProducts, fetchSimilarProducts } from "../../lib/klevu";

export function RecommendedProducts({ productId }: { productId: string }) {
  const enabledKlevu: boolean =
    process.env.NEXT_PUBLIC_ENABLE_KLEVU === "true" || false;

  const [products, setProducts] = useState<KlevuRecord[] | undefined>();

  const doFetch = async () => {
    const similarProductsResponse = await fetchSimilarProducts(productId);
    const similarProducts = similarProductsResponse?.[0]?.records;

    if (similarProducts && similarProducts.length > 0) {
      setProducts(similarProducts);
    } else {
      const resp = await fetchFeatureProducts();
      setProducts(resp.records);
    }
  };

  useEffect(() => {
    if (enabledKlevu) doFetch();
  }, []);

  return (
    enabledKlevu &&
    products &&
    products.length > 0 && (
      <>
        <h2 className="text-base md:text-[1.1rem] lg:text-[1.3rem] font-extrabold pt-10 pb-10">
          You might also like
        </h2>
        {products && <Hits data={products.slice(0, 4)} recommendation={true} />}
        {!products && (
          <div className="grid max-w-[80rem] grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="list-none justify-items-stretch rounded-lg animate-fadeIn">
              <HitPlaceholder />
            </div>
          </div>
        )}
      </>
    )
  );
}
