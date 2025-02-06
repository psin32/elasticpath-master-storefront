import type { ProductResponse } from "@elasticpath/js-sdk";
import { useEffect } from "react";
import Script from "next/script";
import { yotpoEnv } from "../../../lib/resolve-yotpo-env";

declare global {
  interface Window {
    yotpo?: {
      refreshWidgets: Function;
    };
  }
}

interface IReviews {
  product: ProductResponse;
}

const Reviews = ({ product }: IReviews): JSX.Element => {
  useEffect(() => {
    if (yotpoEnv.enable && typeof window.yotpo !== "undefined") {
      window.yotpo.refreshWidgets();
    }
  }, [product.id]);

  const {
    id,
    attributes,
    meta: { display_price },
  } = product;

  return yotpoEnv.enable ? (
    <div>
      <Script
        id="yotpo-reviews"
        src={`//staticw2.yotpo.com/${yotpoEnv.appKey}/widget.js`}
      />
      <div
        className="yotpo yotpo-main-widget"
        style={{ marginTop: "20px" }}
        data-product-id={id}
        data-price={
          display_price?.without_tax?.amount
            ? display_price?.without_tax?.amount / 100
            : display_price?.with_tax?.amount
              ? display_price?.with_tax?.amount / 100
              : 0
        }
        data-currency={
          display_price?.without_tax?.currency ||
          display_price?.with_tax?.currency
        }
        data-name={attributes.name}
      ></div>
    </div>
  ) : (
    <></>
  );
};

export default Reviews;
