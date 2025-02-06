"use client";

import Link from "next/link";
import Image from "next/image";
import { EyeSlashIcon } from "@heroicons/react/24/outline";
import StrikePrice from "../../../product/StrikePrice";
import Price from "../../../product/Price";
import Ratings from "../../../reviews/yotpo/Ratings";

export interface ProductCardProps {
  product: any;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    main_image,
    response: {
      meta: { display_price, original_display_price, variation_matrix },
      attributes: { name, description, components, slug },
      id,
    },
  } = product;

  const ep_main_image_url = main_image?.link.href;

  const currencyPrice =
    display_price?.without_tax?.formatted || display_price?.with_tax?.formatted;

  return (
    <div className="max-w-full sm:max-w-lg p-3 flex flex-col">
      <Link href={`/products/${slug}`} legacyBehavior>
        <div
          className="group flex h-full cursor-pointer flex-col items-stretch"
          data-testid={id}
        >
          <div className="relative  overflow-hidden rounded-t-lg border-l border-r border-t pb-[100%]">
            {ep_main_image_url ? (
              <Image
                className="relative h-full w-full transition duration-300 ease-in-out group-hover:scale-105"
                src={ep_main_image_url}
                alt={name}
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
            {components && (
              <div className="absolute bg-red-600 text-white top-1 rounded-md pr-1 pl-1 right-2 text-sm">
                <h4>Bundle</h4>
              </div>
            )}
            {variation_matrix && (
              <div className="absolute bg-red-600 text-white top-1 rounded-md pr-1 pl-1 right-2 text-sm">
                <h4>Variation</h4>
              </div>
            )}
          </div>
          <div className="flex h-full flex-col gap-2 rounded-b-lg border-b border-l border-r p-4">
            <div className="h-full">
              <Link href={`/products/${slug}`} passHref legacyBehavior>
                <p className="pointer-events-none mt-2 block truncate text-lg font-medium text-gray-900">
                  {name}
                </p>
              </Link>
            </div>
            {/* <Ratings product={product.response} displayFromProduct={true} /> */}
            <div>
              {currencyPrice && (
                <div className="mt-1 flex items-center">
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
                      size="text-lg"
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
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
