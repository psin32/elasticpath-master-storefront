import Link from "next/link";
import Price from "../product/Price";
import StrikePrice from "../product/StrikePrice";
import Image from "next/image";
import { EyeSlashIcon } from "@heroicons/react/24/solid";
import { KlevuRecord } from "@klevu/core";
import { ProductResponse } from "@elasticpath/js-sdk";

export default function HitComponentKlevu({
  hit,
  clickEvent,
  product,
}: {
  hit: KlevuRecord;
  clickEvent?: (params: { productId: string }) => void;
  product: ProductResponse;
}): JSX.Element {
  const {
    image: ep_main_image_url,
    price,
    id,
    name,
    shortDesc: description,
  } = hit;

  const {
    attributes: { slug },
    meta: { display_price, original_display_price },
  } = product;

  return (
    <>
      <Link href={`/products/${slug}`} legacyBehavior>
        <div
          className="group flex h-full cursor-pointer flex-col items-stretch"
          data-testid={id}
          onClick={() => (clickEvent ? clickEvent({ productId: id }) : null)}
        >
          <div className="relative bg-[#f6f7f9] overflow-hidden rounded-t-lg border-l border-r border-t pb-[100%]">
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
          </div>
          <div className="flex h-full flex-col gap-2 rounded-b-lg border-b border-l border-r p-4">
            <div className="h-full">
              <Link href={`/products/${slug}`} passHref legacyBehavior>
                <h3 className="text-sm font-bold">{name}</h3>
              </Link>
              <span
                className="mt-2 line-clamp-6 text-xs font-medium leading-5 text-gray-500"
                dangerouslySetInnerHTML={{ __html: description }}
              ></span>
            </div>
            <div>
              {price && (
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
                      size="text-xl"
                    />
                  )}
                  {display_price && (
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
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </>
  );
}
