import { SearchHit } from "./SearchHit";
import Link from "next/link";
import Price from "../product/Price";
import StrikePrice from "../product/StrikePrice";
import Image from "next/image";
import { EyeSlashIcon } from "@heroicons/react/24/solid";
import { ProductResponse } from "@moltin/sdk";
import Ratings from "../reviews/yotpo/Ratings";
import { SendEventForHits } from "instantsearch.js/es/lib/utils";

export default function HitComponentAlgolia({
  hit,
  sendEvent,
  product,
}: {
  hit: SearchHit;
  sendEvent?: SendEventForHits;
  product: ProductResponse;
}): JSX.Element {
  const { ep_name, objectID, ep_main_image_url, ep_description, ep_slug } = hit;

  const {
    meta: { display_price, original_display_price },
  } = product;

  return (
    <>
      <Link href={`/products/${ep_slug}`} legacyBehavior key={objectID}>
        <div
          className="group flex h-full cursor-pointer flex-col items-stretch"
          data-testid={objectID}
          onClick={() =>
            sendEvent && sendEvent("click", hit, "PLP: Product Clicked")
          }
        >
          <div className="relative overflow-hidden rounded-t-lg border-l border-r border-t pb-[100%]">
            {ep_main_image_url ? (
              <Image
                className="relative h-full w-full transition duration-300 ease-in-out group-hover:scale-105"
                src={ep_main_image_url}
                alt={ep_name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{
                  objectFit: "contain",
                  objectPosition: "center",
                }}
              />
            ) : (
              <div className="absolute flex h-full w-full items-center justify-center bg-gray-200">
                <EyeSlashIcon width={10} height={10} />
              </div>
            )}
            {product.attributes.components && (
              <div className="absolute bg-red-600 text-white top-1 rounded-md pr-1 pl-1 right-2 text-sm">
                <h4>Bundle</h4>
              </div>
            )}
            {product.meta.variation_matrix && (
              <div className="absolute bg-red-600 text-white top-1 rounded-md pr-1 pl-1 right-2 text-sm">
                <h4>Variation</h4>
              </div>
            )}
            {"tiers" in product.attributes && (
              <div className="absolute bg-red-600 text-white top-1 rounded-md pr-1 pl-1 left-2 text-sm">
                <h4>Bulk Buy Offer</h4>
              </div>
            )}
          </div>
          <div className="flex h-full flex-col gap-2 rounded-b-lg border-b border-l border-r p-4">
            <div className="h-full">
              <Link href={`/products/${ep_slug}`} passHref legacyBehavior>
                <h3 className="text-sm font-bold">{ep_name}</h3>
              </Link>
              <span
                className="mt-2 line-clamp-6 text-xs font-medium leading-5 text-gray-500"
                dangerouslySetInnerHTML={{ __html: ep_description }}
              ></span>
            </div>
            <div>
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
                      size="text-xl"
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
            </div>
            <Ratings product={product} displayFromProduct={true} />
          </div>
        </div>
      </Link>
    </>
  );
}
