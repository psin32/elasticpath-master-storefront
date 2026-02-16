"use client";

import { useEffect, useState, useRef } from "react";
import NoImage from "../NoImage";
import { Dialog, Transition } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import StrikePrice from "../product/StrikePrice";
import Price from "../product/Price";
import { Fragment } from "react";
import { ProductResponse } from "@elasticpath/js-sdk";
import { getProductByIds } from "../../services/products";
import { getEpccImplicitClient } from "../../lib/epcc-implicit-client";
import { getCookie } from "cookies-next";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../lib/cookie-constants";
import {
  getSelectedAccount,
  parseAccountMemberCredentialsCookieStr,
} from "../../lib/retrieve-account-member-credentials";
import { COOKIE_PREFIX_KEY } from "../../lib/resolve-cart-env";
import { EP_CURRENCY_CODE } from "../../lib/resolve-ep-currency-code";
import { epccEnv } from "../../lib/resolve-epcc-env";
import { getMainImageForProductResponse } from "../../lib/file-lookup";

/** Price part from EPCC (without_tax or with_tax) */
interface DisplayPricePart {
  amount: number;
  currency: string;
  float_price: number;
  formatted: string;
}

/** display_price / original_display_price from meta */
interface DisplayPriceMeta {
  without_tax?: DisplayPricePart;
  with_tax?: DisplayPricePart;
}

interface SearchResult {
  id: string;
  name: string;
  slug?: string;
  sku?: string;
  image_url?: string;
  display_price?: DisplayPriceMeta;
  original_display_price?: DisplayPriceMeta;
}

function getFormattedPrice(priceMeta?: DisplayPriceMeta): {
  formatted: string;
  currency: string;
} {
  if (!priceMeta) return { formatted: "", currency: "" };
  const part = priceMeta.without_tax ?? priceMeta.with_tax;
  return {
    formatted: part?.formatted ?? "",
    currency: part?.currency ?? "",
  };
}

interface MultiSearchResponse {
  results: Array<{
    hits: Array<{
      document: {
        id: string;
        attributes: {
          name: string;
          slug?: string;
          sku?: string;
        };
        meta?: {
          display_price?: DisplayPriceMeta;
          original_display_price?: DisplayPriceMeta;
        };
        relationships?: {
          main_image?: {
            data?: {
              id: string;
              type: string;
            };
          };
          files?: {
            data?: Array<{
              id: string;
              type: string;
            }>;
          };
        };
      };
      highlight?: any;
      highlights?: any[];
      [key: string]: any;
    }>;
  }>;
}

const SearchBox = ({
  onChange,
  onSearchEnd,
  shouldFocus = false,
}: {
  onChange: (value: string) => void;
  onSearchEnd: (query: string) => void;
  shouldFocus?: boolean;
}) => {
  const [search, setSearch] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [shouldFocus]);

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        ref={inputRef}
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
      />
      {search && (
        <button
          className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center hover:text-gray-600 transition-colors"
          onClick={() => {
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
  result,
  product,
}: {
  result: SearchResult;
  product?: ProductResponse;
}) => {
  const router = useRouter();

  const originalPrice = getFormattedPrice(
    result.original_display_price ??
      (product?.meta?.original_display_price as DisplayPriceMeta | undefined),
  );
  const currentPrice = getFormattedPrice(
    result.display_price ??
      (product?.meta?.display_price as DisplayPriceMeta | undefined),
  );

  const handleClick = () => {
    if (result.slug) {
      router.push(`/products/${result.slug}`);
    }
  };

  return (
    <div
      className="group cursor-pointer hover:bg-gray-50 transition-colors duration-200 rounded-lg p-3 -mx-3 px-8"
      onClick={handleClick}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {result.image_url ? (
            <img
              className="w-16 h-16 object-cover rounded-lg shadow-sm"
              src={result.image_url}
              alt={result.name}
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
                <a
                  href={result.slug ? `/products/${result.slug}` : "#"}
                  className="block"
                >
                  {result.name}
                </a>
              </h3>
              {result.sku && (
                <p className="text-xs text-gray-500 mt-1 font-mono">
                  {result.sku}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="flex flex-col items-end">
                {originalPrice.formatted && (
                  <StrikePrice
                    price={originalPrice.formatted}
                    currency={originalPrice.currency}
                    size="text-sm"
                  />
                )}
                <Price
                  price={currentPrice.formatted}
                  currency={currentPrice.currency}
                  original_display_price={
                    result.original_display_price ??
                    product?.meta?.original_display_price
                  }
                  size="text-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Hits = ({
  results,
  products,
}: {
  results: SearchResult[];
  products: Map<string, ProductResponse>;
}) => {
  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">No results found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.map((result) => (
        <HitComponent
          key={result.id}
          result={result}
          product={products.get(result.id)}
        />
      ))}
    </div>
  );
};

export const SearchModalEPCC = (): JSX.Element => {
  const [searchValue, setSearchValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [shouldFocus, setShouldFocus] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [products, setProducts] = useState<Map<string, ProductResponse>>(
    new Map(),
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Debounced search using useEffect with manual debouncing
  useEffect(() => {
    if (!searchValue.trim()) {
      setResults([]);
      setProducts(new Map());
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        const client = getEpccImplicitClient();

        // Get currency from cookie
        const currency =
          (getCookie(`${COOKIE_PREFIX_KEY}_ep_currency`) as string) ||
          EP_CURRENCY_CODE;

        // Get access token from client storage
        const tokenStore = client.storage;
        const credentials = tokenStore.get(
          `${COOKIE_PREFIX_KEY}_ep_credentials`,
        );
        let accessToken: string | null = null;
        if (credentials) {
          try {
            const parsedCredentials = JSON.parse(credentials);
            accessToken = parsedCredentials?.access_token || null;
          } catch (error) {
            console.error("Error parsing credentials:", error);
          }
        }

        if (!accessToken) {
          throw new Error("Authentication required");
        }

        // Get account token from account member cookie (when logged in)
        let accountToken: string | null = null;
        const accountMemberCookieValue =
          getCookie(ACCOUNT_MEMBER_TOKEN_COOKIE_NAME)?.toString() || "";
        if (accountMemberCookieValue) {
          try {
            const accountMemberCookie = parseAccountMemberCredentialsCookieStr(
              accountMemberCookieValue,
            );
            if (accountMemberCookie) {
              const selectedAccount = getSelectedAccount(accountMemberCookie);
              accountToken = selectedAccount.token ?? null;
            }
          } catch (error) {
            console.error("Error parsing account credentials:", error);
          }
        }

        // Get EPCC endpoint
        const epccEndpoint =
          epccEnv.host || process.env.NEXT_PUBLIC_EPCC_ENDPOINT_URL;

        if (!epccEndpoint) {
          throw new Error("EPCC endpoint not configured");
        }

        const requestHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "x-moltin-currency": currency,
        };
        if (accountToken) {
          requestHeaders["EP-Account-Management-Authentication-Token"] =
            accountToken;
        }

        // Call EPCC multi-search endpoint directly with fetch to avoid data wrapper
        const response = await fetch(
          `https://${epccEndpoint}/catalog/multi-search`,
          {
            method: "POST",
            headers: requestHeaders,
            body: JSON.stringify({
              searches: [
                {
                  type: "search",
                  highlight_full_fields: "name",
                  q: searchValue,
                  include_fields: "name",
                },
              ],
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const responseData: MultiSearchResponse = await response.json();

        // Extract hits from the first result
        // EPCC multi-search returns: { results: [{ hits: [{ document: {...} }] }] }
        const hits = responseData.results?.[0]?.hits || [];

        // Map to SearchResult format - extract from document
        const searchResults: SearchResult[] = hits.map((hit) => {
          const doc = hit.document;
          return {
            id: doc.id,
            name: doc.attributes.name,
            slug: doc.attributes.slug,
            sku: doc.attributes.sku,
            display_price: doc.meta?.display_price,
            original_display_price: doc.meta?.original_display_price,
            // Image URL will be fetched when we get product details
            image_url: undefined,
          };
        });

        setResults(searchResults);

        // Fetch product details for images and additional pricing info
        if (searchResults.length > 0) {
          const productIds = searchResults.map((r) => r.id).join(",");
          const productData = await getProductByIds(productIds, client);
          const productMap = new Map<string, ProductResponse>();

          // Get main images from included files
          const mainImages = productData.included?.main_images || [];

          // Update search results with image URLs
          const updatedResults = searchResults.map((result) => {
            const product = productData.data.find((p) => p.id === result.id);
            if (product) {
              // Get main image for this product
              const mainImage = getMainImageForProductResponse(
                product,
                mainImages,
              );

              return {
                ...result,
                image_url: mainImage?.link?.href || result.image_url,
              };
            }
            return result;
          });

          productData.data.forEach((product) => {
            productMap.set(product.id, product);
          });

          setResults(updatedResults);
          setProducts(productMap);
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the search
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 400);

    // Cleanup function to cancel the timeout if searchValue changes
    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchValue]);

  return (
    <>
      <button
        className="bg-transparent hover:bg-gray-100 text-gray-800 font-normal py-2 px-4 rounded-lg inline-flex items-center justify-center transition-colors duration-200"
        onClick={() => {
          setIsOpen(true);
          setShouldFocus(true);
        }}
        aria-label="Search"
      >
        <MagnifyingGlassIcon className="w-5 h-5" />
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-50 overflow-y-auto"
          onClose={() => {
            setIsOpen(false);
            setShouldFocus(false);
          }}
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
                    onClick={() => {
                      setIsOpen(false);
                      setShouldFocus(false);
                    }}
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
                      setShouldFocus(false);
                      router.push(`/search?q=${encodeURIComponent(query)}`);
                    }}
                    shouldFocus={shouldFocus}
                  />
                </div>

                {loading && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">Searching...</p>
                  </div>
                )}

                {!loading && searchValue && (
                  <div className="max-h-96 overflow-y-auto">
                    <Hits results={results} products={products} />
                  </div>
                )}

                {!loading && !searchValue && (
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
    </>
  );
};
