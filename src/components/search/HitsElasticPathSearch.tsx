 "use client";

import React, { useEffect, useState } from "react";
import { useHits } from "react-instantsearch";
import NoResults from "./NoResults";
import HitElasticPathSearch from "./HitElasticPathSearch";
import { getEpccImplicitClient } from "../../lib/epcc-implicit-client";
import { getProductByIds } from "../../services/products";


/**
 * Simple Instant Search hits renderer for EPCC.
 * - Uses the react-instantsearch `useHits` hook.
 * - Renders only the hit cards (no add-to-cart, inventory, or extras).
 */
export default function HitsElasticPathSearch(): JSX.Element {
  const { hits } = useHits();
  const [mappedHits, setMappedHits] = useState<any[] | null>(null);

  useEffect(() => {
    let mounted = true;
    async function enrichHits() {
      try {
        if (!hits || hits.length === 0) {
          if (mounted) setMappedHits([]);
          return;
        }

        // Extract product ids from hits (support document.id or objectID)
        const ids = hits
          .map((h: any) => h.document?.id || h.objectID || h.id)
          .filter(Boolean);
        const uniqueIds = Array.from(new Set(ids));
        if (uniqueIds.length === 0) {
          if (mounted) setMappedHits(hits);
          return;
        }

        const client = getEpccImplicitClient();
        const productData = await getProductByIds(uniqueIds.join(","), client);

        // Build map of product id -> product (attempt to extract main image)
        const prodMap: Record<string, any> = {};
        const included = (productData as any).included || {};
        for (const p of productData.data || []) {
          let mainHref =
            (p.relationships?.main_image?.data as any)?.link?.href ||
            ((p as any).main_image as any)?.link?.href ||
            null;
          // try included main_images
          if (!mainHref && included?.main_images && Array.isArray(included.main_images)) {
            const mi = included.main_images.find((m: any) => m.id === p.relationships?.main_image?.data?.id);
            if (mi) mainHref = mi.link?.href || null;
          }
          prodMap[p.id] = { product: p, main_image_href: mainHref };
        }

        // Map hits to include main_image
        const newHits = hits.map((h: any) => {
          const id = h.document?.id || h.objectID || h.id;
          const prod = prodMap[id];
          if (prod) {
            return {
              ...h,
              main_image: { link: { href: prod.main_image_href || "" } },
              // also attach full product for convenience
              _product: prod.product,
            };
          }
          return h;
        });

        if (mounted) setMappedHits(newHits);
      } catch (err) {
        console.error("Failed to enrich hits with product data:", err);
        if (mounted) setMappedHits(hits);
      }
    }

    enrichHits();
    return () => {
      mounted = false;
    };
  }, [hits]);

  const displayHits = mappedHits ?? hits;

  if (!displayHits || displayHits.length === 0) {
    return <NoResults displayIcon={false} />;
  }

  return (
    <div className="grid max-w-[80rem] grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {displayHits.map((hit: any) => (
        <div
          className="list-none justify-items-stretch rounded-lg animate-fadeIn"
          key={hit.objectID || hit.id || hit._id}
        >
          <HitElasticPathSearch hit={hit} />
        </div>
      ))}
    </div>
  );
}
