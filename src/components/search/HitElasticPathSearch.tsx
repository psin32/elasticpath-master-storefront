"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import Price from "../product/Price";
import StrikePrice from "../product/StrikePrice";
import { EyeSlashIcon } from "@heroicons/react/24/solid";
import Ratings from "../reviews/yotpo/Ratings";
import { SendEventForHits } from "instantsearch.js/es/lib/utils";

/**
 * Full-featured EPCC Instant Search hit component modeled after HitComponentAlgolia.
 * Accepts an InstantSearch hit (which may contain `document` or flattened fields)
 * and renders a product card with image, title, description, price and ratings.
 */
export default function HitElasticPathSearch({
  hit,
  sendEvent,
}: {
  hit: any;
  sendEvent?: SendEventForHits;
}): JSX.Element {
  const doc = hit.document || hit._ep_document || hit;
  const attrs = doc.attributes || hit.attributes || {};
  const meta = doc.meta || hit.meta || {};

  const id = doc.id || hit.id || hit.objectID || "";
  const name = attrs.name || hit.name || hit.ep_name || "";
  const slug = attrs.slug || hit.slug || hit.ep_slug || "";
  const description =
    attrs.description || hit.description || hit.ep_description || "";
  const mainImage =
    hit.main_image?.link?.href ||
    doc.relationships?.main_image?.data?.link?.href ||
    doc.relationships?.main_image?.data?.id ||
    doc.main_image?.link?.href ||
    hit.ep_main_image_url ||
    hit.image_url ||
    "";

  const display_price = meta.display_price;
  const original_display_price = meta.original_display_price;

  return (
    <Link href={`/products/${slug}`} legacyBehavior key={id}>
      <div
        className="group flex h-full cursor-pointer flex-col items-stretch"
        data-testid={id}
        onClick={() =>
          sendEvent && sendEvent("click", hit, "PLP: Product Clicked")
        }
      >
        <div className="relative overflow-hidden rounded-t-lg border-l border-r border-t pb-[100%] bg-white">
          {mainImage ? (
            <Image
              className="relative h-full w-full transition duration-300 ease-in-out group-hover:scale-105"
              src={mainImage}
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
            {description && (
              <span
                className="mt-2 line-clamp-4 text-xs font-medium leading-5 text-gray-500"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}
          </div>

          <div>
            {display_price && (
              <div className="flex items-center mt-2">
                {original_display_price && (
                  <StrikePrice
                    price={
                      original_display_price?.without_tax?.formatted ??
                      original_display_price?.with_tax?.formatted ??
                      ""
                    }
                    currency={
                      original_display_price?.without_tax?.currency ??
                      original_display_price?.with_tax?.currency ??
                      ""
                    }
                    size="text-md"
                  />
                )}
                <Price
                  price={
                    display_price?.without_tax?.formatted ??
                    display_price?.with_tax?.formatted ??
                    ""
                  }
                  currency={
                    display_price?.without_tax?.currency ??
                    display_price?.with_tax?.currency ??
                    ""
                  }
                  original_display_price={original_display_price}
                  size="text-xl"
                />
              </div>
            )}
          </div>

          <Ratings product={doc} displayFromProduct={true} />
        </div>
      </div>
    </Link>
  );
}
