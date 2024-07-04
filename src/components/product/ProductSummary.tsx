import { useContext } from "react";
import Price from "./Price";
import StrikePrice from "./StrikePrice";
import clsx from "clsx";
import { ProductContext } from "../../lib/product-context";
import { ProductMultibuyOffer } from "./ProductMultibuyOffer";
import Ratings from "../reviews/yotpo/Ratings";

interface IProductSummary {
  product: any;
  offerings?: any;
}

const ProductSummary = ({
  product,
  offerings,
}: IProductSummary): JSX.Element => {
  const {
    attributes,
    meta: { display_price, original_display_price },
  } = product;
  const context = useContext(ProductContext);

  return (
    <div
      className={clsx(context?.isChangingSku && "opacity-20 cursor-default")}
    >
      <span className="text-xl font-semibold leading-[1.1] sm:text-3xl lg:text-4xl">
        {attributes.name}
      </span>
      <Ratings product={product} displayFromProduct={true} />
      <div className="text-lg mt-2">{attributes.sku}</div>
      {offerings.data.length == 0 && (
        <>
          {display_price && (
            <div className="flex items-center mt-2">
              {original_display_price && (
                <StrikePrice
                  price={
                    original_display_price?.without_tax?.formatted
                      ? original_display_price?.without_tax?.formatted
                      : original_display_price.with_tax.formatted
                  }
                  currency={
                    original_display_price.without_tax?.currency
                      ? original_display_price?.without_tax?.currency
                      : original_display_price.with_tax.currency
                  }
                />
              )}
              <Price
                price={
                  display_price?.without_tax?.formatted
                    ? display_price?.without_tax?.formatted
                    : display_price.with_tax.formatted
                }
                currency={
                  display_price?.without_tax?.currency
                    ? display_price?.without_tax?.currency
                    : display_price.with_tax.currency
                }
                original_display_price={original_display_price}
                size="text-2xl"
              />
            </div>
          )}
          {"tiers" in attributes && (
            <>
              <div className="uppercase font-bold mt-4 mb-4 text-lg text-red-700">
                Bulk Buy Offer
              </div>
              <ProductMultibuyOffer product={product} />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ProductSummary;
