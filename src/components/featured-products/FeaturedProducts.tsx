"use server";
import clsx from "clsx";
import Link from "next/link";
import { ArrowRightIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { getServerSideImplicitClient } from "../../lib/epcc-server-side-implicit-client";
import { fetchFeaturedProducts } from "./fetchFeaturedProducts";
import StrikePrice from "../product/StrikePrice";
import Price from "../product/Price";
import MultibuyOfferModal from "./MultibuyOfferModal";
import Ratings from "../reviews/yotpo/Ratings";

interface IFeaturedProductsProps {
  title: string;
  linkProps?: {
    link: string;
    text: string;
  };
}

export default async function FeaturedProducts({
  title,
  linkProps,
}: IFeaturedProductsProps) {
  const client = getServerSideImplicitClient();
  const products = await fetchFeaturedProducts(client);

  return (
    <div
      className={clsx(
        products.length ? "block" : "hidden",
        "max-w-7xl my-0 mx-auto",
      )}
    >
      <div className="flex justify-between flex-wrap gap-2 mb-4">
        <h2 className="text-base md:text-[1.1rem] lg:text-[1.3rem] font-extrabold">
          {title}
        </h2>
        {linkProps && (
          <Link
            className="text-sm md:text-md lg:text-lg font-bold hover:cursor-pointer"
            href={linkProps.link}
          >
            <span className="flex items-center gap-2 font-bold hover:text-brand-primary hover:cursor-pointer">
              {linkProps.text} <ArrowRightIcon className="h-4 w-4" />
            </span>
          </Link>
        )}
      </div>
      <ul
        role="list"
        className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8"
      >
        {products.map((product: any) => (
          <li className="relative group" key={product.id}>
            <Link href={`/products/${product.attributes.slug}`}>
              <div className="aspect-square block w-full overflow-hidden rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100">
                <div className="relative w-full h-full rounded-lg text-center animate-fadeIn  transition duration-300 ease-in-out group-hover:scale-105">
                  {product.main_image?.link.href ? (
                    <Image
                      alt={product.main_image?.file_name!}
                      src={product.main_image?.link.href}
                      className="rounded-lg"
                      sizes="(max-width: 200px)"
                      fill
                      style={{
                        objectFit: "contain",
                        objectPosition: "center",
                      }}
                    />
                  ) : (
                    <div className="w-[64px] h-[64px] flex items-center justify-center text-white bg-gray-200 rounded-md shadow-sm object-cover">
                      <EyeSlashIcon className="w-3 h-3" />
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
                </div>
              </div>
              <p className="pointer-events-none mt-2 block truncate text-sm font-medium text-gray-900">
                {product.attributes.name}
              </p>
              <div className="pointer-events-none text-sm font-medium text-gray-500 flex items-center gap-2">
                {product?.meta?.component_products && <div>FROM </div>}
                {product.meta.display_price && (
                  <div className="flex items-center">
                    {product.meta.original_display_price && (
                      <StrikePrice
                        price={
                          product.meta.original_display_price?.without_tax
                            ?.formatted
                            ? product.meta.original_display_price?.without_tax
                                ?.formatted
                            : product.meta.original_display_price.with_tax
                                .formatted
                        }
                        currency={
                          product.meta.original_display_price.without_tax
                            ?.currency
                            ? product.meta.original_display_price?.without_tax
                                ?.currency
                            : product.meta.original_display_price.with_tax
                                .currency
                        }
                        size="text-md"
                      />
                    )}
                    <Price
                      price={
                        product.meta.display_price?.without_tax?.formatted
                          ? product.meta.display_price?.without_tax?.formatted
                          : product.meta.display_price.with_tax.formatted
                      }
                      currency={
                        product.meta.display_price?.without_tax?.currency
                          ? product.meta.display_price?.without_tax?.currency
                          : product.meta.display_price.with_tax.currency
                      }
                      original_display_price={
                        product.meta.original_display_price
                      }
                      size="text-md"
                    />
                  </div>
                )}
              </div>
            </Link>
            <Ratings product={product} displayFromProduct={true} />
            {"tiers" in product.attributes && (
              <div className="bg-red-700 text-white rounded-md p-2 mt-2 uppercase text-center font-bold flex flex-row gap-2 text-sm">
                <h4 className="basis-1/2">Bulk Save</h4>
                <MultibuyOfferModal product={product} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
