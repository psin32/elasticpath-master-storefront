"use client";

import { useEffect, useState } from "react";
import { Configure, useHits, useSearchBox } from "react-instantsearch";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import NoResults from "./NoResults";
import { SearchHit } from "./SearchHit";
import { searchClient } from "../../lib/search-client";
import { algoliaEnvData } from "../../lib/resolve-algolia-env";
import { useDebouncedEffect } from "../../lib/use-debounced";
import NoImage from "../NoImage";
import { Dialog, Transition } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { reviewsEnv } from "../../lib/resolve-reviews-field-env";
import StarRatings from "react-star-ratings";
import { SendEventForHits } from "instantsearch.js/es/lib/utils";
import { ProductResponse, ShopperCatalogResource } from "@elasticpath/js-sdk";
import { getEpccImplicitClient } from "../../lib/epcc-implicit-client";
import { getProductByIds } from "../../services/products";
import StrikePrice from "../product/StrikePrice";
import Price from "../product/Price";
import { Fragment } from "react";

const SearchBox = ({
  onChange,
  onSearchEnd,
}: {
  onChange: (value: string) => void;
  onSearchEnd: (query: string) => void;
}) => {
  const { query, refine, clear } = useSearchBox();
  const [search, setSearch] = useState<string>(query);

  useDebouncedEffect(
    () => {
      if (search !== query) {
        refine(search);
      }
    },
    400,
    [search],
  );

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        className="block w-full pl-12 pr-12 py-4 border-0 border-b-2 border-gray-200 focus:outline-none focus:ring-0 focus:border-blue-500 text-lg placeholder-gray-400 bg-transparent"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          onChange(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onSearchEnd(search);
          }
        }}
        placeholder="Search products..."
        autoFocus
      />
      {query && (
        <button
          className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center hover:text-gray-600 transition-colors"
          onClick={() => {
            clear();
            onChange("");
            setSearch("");
          }}
        >
          <XMarkIcon className="h-5 w-5 text-gray-400" />
        </button>
      )}
    </div>
  );
};

const HitComponent = ({
  hit,
  sendEvent,
  product,
}: {
  hit: SearchHit;
  sendEvent: SendEventForHits;
  product: ProductResponse;
}) => {
  const { ep_price, ep_main_image_url, ep_name, ep_sku, objectID, ep_slug } =
    hit;

  const {
    meta: { display_price, original_display_price },
  } = product;

  return (
    <div
      className="group cursor-pointer hover:bg-gray-50 transition-colors duration-200 rounded-lg p-3 -mx-3 px-8"
      onClick={() => sendEvent("click", hit, "Autocomplete: Product Clicked")}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {ep_main_image_url ? (
            <img
              className="w-16 h-16 object-cover rounded-lg shadow-sm"
              src={ep_main_image_url}
              alt={ep_name}
            />
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <NoImage />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                <a href={`/products/${ep_slug}`} className="block">
                  {ep_name}
                </a>
              </h3>
              <p className="text-xs text-gray-500 mt-1 font-mono">{ep_sku}</p>
              {reviewsEnv.enable && (
                <div className="flex items-center mt-2 space-x-2">
                  <StarRatings
                    rating={Number(hit[reviewsEnv.avgRatingField || ""] || 0)}
                    starDimension="14px"
                    starSpacing="1px"
                    starRatedColor="orange"
                  />
                  <span className="text-xs text-gray-500">
                    ({Number(hit[reviewsEnv.reviewCountField || ""] || 0)})
                  </span>
                </div>
              )}
            </div>
            <div className="flex-shrink-0 text-right">
              {display_price && (
                <div className="flex flex-col items-end">
                  {product?.meta?.component_products && (
                    <span className="text-xs text-gray-500 mb-1">FROM</span>
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
                      size="text-sm"
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
                    size="text-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Hits = () => {
  const { hits, sendEvent } = useHits<SearchHit>();
  const [products, setProducts] = useState<
    ShopperCatalogResource<ProductResponse[]> | undefined
  >(undefined);
  const client = getEpccImplicitClient();

  useEffect(() => {
    const init = async () => {
      setProducts(
        await getProductByIds(
          hits.map((hit) => hit.objectID).join(","),
          client,
        ),
      );
    };
    init();
  }, [hits]);

  if (hits.length) {
    return (
      <div className="space-y-1">
        <div className="text-sm text-gray-500 mb-3">
          {hits.length} result{hits.length !== 1 ? "s" : ""} found
        </div>
        <div className="space-y-1">
          {products &&
            hits.map((hit) => {
              const product: ProductResponse | undefined = products.data.find(
                (prd) => prd.id === hit.objectID,
              );
              if (product) {
                return (
                  <HitComponent
                    key={hit.objectID}
                    hit={hit}
                    product={product}
                    sendEvent={sendEvent}
                  />
                );
              }
              return null;
            })}
        </div>
      </div>
    );
  }
  return <NoResults />;
};

export const SearchModalAlgolia = (): JSX.Element => {
  const [searchValue, setSearchValue] = useState("");
  let [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <InstantSearchNext
      searchClient={searchClient}
      indexName={algoliaEnvData.indexName}
      insights={true}
      future={{
        preserveSharedStateOnUnmount: true,
      }}
    >
      <Configure filters="is_child:0" />
      <button
        className="bg-transparent hover:bg-gray-100 text-gray-800 font-normal py-2 px-4 rounded-lg inline-flex items-center justify-center transition-colors duration-200"
        onClick={() => setIsOpen(true)}
        aria-label="Search"
      >
        <MagnifyingGlassIcon className="w-5 h-5" />
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-50 overflow-y-auto"
          onClose={() => setIsOpen(false)}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Search Products
                  </Dialog.Title>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-2 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="mb-6">
                  <SearchBox
                    onChange={(value: string) => {
                      setSearchValue(value);
                    }}
                    onSearchEnd={(query) => {
                      setIsOpen(false);
                      setSearchValue("");
                      router.push(`/search?q=${query}`);
                    }}
                  />
                </div>

                {searchValue && (
                  <div className="max-h-96 overflow-y-auto">
                    <Hits />
                  </div>
                )}

                {!searchValue && (
                  <div className="text-center py-12">
                    <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Start typing to search
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Search for products, categories, or brands
                    </p>
                  </div>
                )}
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </InstantSearchNext>
  );
};

export default SearchModalAlgolia;
