"use client";

import type { ProductResponse } from "@elasticpath/js-sdk";
import { useEffect } from "react";
import Script from "next/script";
import { yotpoEnv } from "../../../lib/resolve-yotpo-env";
import StarRatings from "react-star-ratings";

declare global {
  interface Window {
    yotpo?: {
      refreshWidgets: Function;
    };
  }
}

interface IRatings {
  product: ProductResponse;
  displayFromProduct?: boolean;
}

const Ratings = ({ product, displayFromProduct }: IRatings): JSX.Element => {
  useEffect(() => {
    if (yotpoEnv.enable && typeof window?.yotpo !== "undefined") {
      window?.yotpo?.refreshWidgets();
    }
  }, [product.id]);

  if (displayFromProduct) {
    return yotpoEnv.enable ? (
      <div className="text-sm mt-2">
        <>
          <StarRatings
            rating={Number(
              product.attributes?.extensions?.["products(ratings)"]
                ?.average_rating || "",
            )}
            starDimension="18px"
            starSpacing="0px"
            starRatedColor="orange"
          />{" "}
          (
          {product.attributes?.extensions?.["products(ratings)"]
            ?.review_count || 0}
          )
        </>
      </div>
    ) : (
      <></>
    );
  }
  return yotpoEnv.enable ? (
    <div className="mt-2">
      <Script
        id="yotpo-reviews"
        src={`//staticw2.yotpo.com/${yotpoEnv.appKey}/widget.js`}
      />
      <div
        className="yotpo bottomLine"
        data-yotpo-product-id={product.id}
      ></div>
    </div>
  ) : (
    <></>
  );
};

export default Ratings;
