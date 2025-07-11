import { SearchHit } from "./SearchHit";
import Link from "next/link";
import Price from "../product/Price";
import StrikePrice from "../product/StrikePrice";
import { EyeSlashIcon } from "@heroicons/react/24/solid";
import { ProductResponse } from "@elasticpath/js-sdk";
import Ratings from "../reviews/yotpo/Ratings";
import {
  MinusIcon,
  PlusIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import { StatusButton } from "../button/StatusButton";

export default function HitComponentAlgoliaList({
  hit,
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
  onGetVariants,
}: {
  hit: SearchHit;
  product: ProductResponse;
  quantity: number;
  onQuantityChange: (productId: string, quantity: number) => void;
  onAddToCart: (productId: string) => void;
  onGetVariants?: (productId: string, variationMatrix: any) => Promise<void>;
}): JSX.Element {
  const { ep_name, objectID, ep_main_image_url, ep_description, ep_slug } = hit;

  const {
    meta: { display_price, original_display_price, variation_matrix },
    attributes: { components },
  } = product;

  const currencyPrice =
    display_price?.without_tax?.formatted || display_price?.with_tax?.formatted;

  return (
    <div
      className="grid grid-cols-12 gap-4 items-center p-4 border rounded shadow-sm relative"
      data-testid={objectID}
    >
      {quantity > 0 && (
        <CheckCircleIcon className="w-6 h-6 text-green-500 absolute top-0 left-0 z-10" />
      )}
      <div className="col-span-1">
        {ep_main_image_url ? (
          <div className="relative">
            <img
              src={ep_main_image_url}
              alt={ep_name}
              className="w-20 h-24 object-cover transition duration-300 ease-in-out group-hover:scale-105 hover:scale-105"
            />
          </div>
        ) : (
          <div className="w-20 h-24 flex items-center justify-center bg-gray-200">
            <EyeSlashIcon width={10} height={10} />
          </div>
        )}
      </div>
      <div className="col-span-5">
        <h2 className="text-lg text-gray-800 font-semibold hover:text-brand-primary">
          <Link href={`/products/${ep_slug}`} legacyBehavior>
            {ep_name}
          </Link>
        </h2>
        <span
          className="mt-2 line-clamp-6 text-xs font-medium leading-5 text-gray-500"
          dangerouslySetInnerHTML={{ __html: ep_description }}
        ></span>
      </div>
      <div className="col-span-2 text-green-500 font-bold">
        {display_price && (
          <div className="flex items-center mt-2">
            {product?.meta?.component_products && (
              <div className="mr-1 text-md">FROM </div>
            )}
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
                size="text-md"
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
              size="text-xl"
            />
          </div>
        )}
        <div className="mt-2">
          <Ratings product={product} displayFromProduct={true} />
        </div>
      </div>
      <div className="col-span-2">
        {!variation_matrix && !components && (
          <div className="flex w-32 items-start rounded-lg border border-black/10">
            <button
              type="submit"
              onClick={() => onQuantityChange(objectID, quantity - 1)}
              className="ease flex w-9 h-9 mt-1 justify-center items-center transition-all duration-200"
            >
              <MinusIcon className="h-4 w-4 dark:text-neutral-500" />
            </button>
            <svg
              width="2"
              height="42"
              viewBox="0 0 2 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 0V36"
                stroke="black"
                strokeOpacity="0.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <input
              type="number"
              placeholder="Quantity"
              className="border-none focus-visible:ring-0 focus-visible:border-black w-12 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              value={quantity}
              onChange={(e) =>
                onQuantityChange(objectID, parseInt(e.target.value) || 0)
              }
            />
            <svg
              width="2"
              height="42"
              viewBox="0 0 2 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 0V36"
                stroke="black"
                strokeOpacity="0.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <button
              type="submit"
              onClick={() => onQuantityChange(objectID, quantity + 1)}
              className="ease flex w-9 h-9 mt-1 justify-center items-center transition-all duration-200"
            >
              <PlusIcon className="h-4 w-4 dark:text-neutral-500" />
            </button>
          </div>
        )}
      </div>
      <div className="col-span-2">
        {!variation_matrix && !components && (
          <StatusButton
            className="py-2 w-32 text-sm px-2"
            onClick={() => onAddToCart(objectID)}
            variant={quantity > 0 ? "primary" : "secondary"}
            disabled={quantity === 0}
          >
            Add to Cart
          </StatusButton>
        )}

        {variation_matrix && onGetVariants && (
          <StatusButton
            className="py-2 text-xs w-32"
            onClick={() => onGetVariants(objectID, variation_matrix)}
          >
            Choose Variants
          </StatusButton>
        )}

        {components && (
          <Link href={`/products/${ep_slug}`} legacyBehavior>
            <StatusButton className="py-2 text-xs w-32">
              View Bundle
            </StatusButton>
          </Link>
        )}
      </div>
    </div>
  );
}
