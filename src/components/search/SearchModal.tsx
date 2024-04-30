"use client"

import { useState } from "react";
import {
  Configure,
  useHits,
  useSearchBox,
} from "react-instantsearch";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import NoResults from "./NoResults";
import { SearchHit } from "./SearchHit";
import { searchClient } from "../../lib/search-client";
import { algoliaEnvData } from "../../lib/resolve-algolia-env";
import { useDebouncedEffect } from "../../lib/use-debounced";
import { EP_CURRENCY_CODE } from "../../lib/resolve-ep-currency-code";
import NoImage from "../NoImage";
import { Dialog } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { reviewsEnv } from "../../lib/resolve-reviews-field-env";
import StarRatings from "react-star-ratings";

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
    [search]
  );

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg
          className="h-6 w-6 text-gray-300"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M21 21l-4.35-4.35" />
          <circle cx="10.5" cy="10.5" r="7.5" />
        </svg>
      </div>
      <input
        className="block w-full pl-16 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
        placeholder="Search"
      />
      {query && (
        <button
          className="absolute inset-y-0 right-0 pr-3 flex items-center justify-center"
          onClick={() => {
            clear();
            onChange("");
            setSearch("");
          }}
        >
          <svg
            className="h-6 w-6 text-gray-400"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>

  );
};

const HitComponent = ({ hit }: { hit: SearchHit }) => {
  const { ep_price, ep_main_image_url, ep_name, ep_sku, objectID } = hit;

  const currencyPrice = ep_price?.[EP_CURRENCY_CODE];

  return (
    <div className="group">
      <div className="grid grid-cols-6 grid-rows-3 h-100 gap-2">
        <div className="col-span-2 row-span-3">
          {ep_main_image_url ? (
            <img
              className="w-16 h-16 object-cover"
              src={ep_main_image_url}
              alt={ep_name}
            />
          ) : (
            <NoImage />
          )}
        </div>
        <div className="col-span-4">
          <h2 className="text-sm font-medium">
            <a
              href={`/products/${objectID}`}
              className="text-blue-500 hover:underline"
            >
              {ep_name}
            </a>
          </h2>
        </div>
        <div className="col-span-4">
          <p className="text-gray-500 font-semibold tracking-wide text-xs uppercase">
            {ep_sku}
          </p>
          {reviewsEnv.enable && (
            <div className="text-gray-500 font-semibold tracking-wide text-xs mt-1 overflow-hidden line-clamp-6">
              <StarRatings
                rating={Number(hit[reviewsEnv.avgRatingField || ""] || 0)}
                starDimension="18px"
                starSpacing="0px"
                starRatedColor="orange"
              />
              {Number(hit[reviewsEnv.reviewCountField || ""] || 0)}
            </div>
          )}
        </div>
        <div className="col-span-2">
          {currencyPrice && (
            <p className="text-sm font-semibold">{currencyPrice.formatted_price}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const Hits = () => {
  const { hits } = useHits<SearchHit>();

  if (hits.length) {
    return (
      <ul className="list-none divide-y divide-dashed">
        {hits.map((hit) => (
          <li className="mb-4 pt-4" key={hit.objectID}>
            <HitComponent hit={hit} />
          </li>
        ))}
      </ul>

    );
  }
  return <NoResults />;
};

export const SearchModal = (): JSX.Element => {
  const [searchValue, setSearchValue] = useState("");
  let [isOpen, setIsOpen] = useState(false)
  const router = useRouter();

  return (
    <InstantSearchNext searchClient={searchClient} indexName={algoliaEnvData.indexName}>
      <Configure filters="is_child:0" />
      <button
        className="bg-transparent hover:bg-gray-100 text-gray-800 font-normal py-2 px-4 rounded inline-flex items-center justify-left"
        onClick={() => setIsOpen(true)}
        aria-label="Search"
      >
        <MagnifyingGlassIcon width={24} />
      </button>
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed z-20 inset-0 overflow-y-auto">
        <div className="flex items-start justify-center min-h-screen mt-20">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg w-full max-w-lg p-6">
            <div>
              <SearchBox
                onChange={(value: string) => {
                  setSearchValue(value);
                }}
                onSearchEnd={(query) => {
                  setIsOpen(false);
                  setSearchValue("");
                  router.push("/search/" + query);
                }}
              />
            </div>

            {searchValue && (
              <div className="px-4 pb-4 overflow-x-scroll">
                <hr className="my-4" />
                <div className="mt-4">
                  <Hits />
                </div>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </InstantSearchNext>

  );
};

export default SearchModal;
