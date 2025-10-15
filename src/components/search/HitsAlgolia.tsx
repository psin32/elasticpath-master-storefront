import { useHits } from "react-instantsearch";
import { SearchHit } from "./SearchHit";
import NoResults from "./NoResults";
import { getProductByIds } from "../../services/products";
import { getEpccImplicitClient } from "../../lib/epcc-implicit-client";
import { useEffect, useState } from "react";
import {
  ProductResponse,
  ShopperCatalogResource,
  CartItemObject,
} from "@elasticpath/js-sdk";
import HitComponentAlgolia from "./HitAlgolia";
import HitComponentAlgoliaList from "./HitAlgoliaList";
import { Bars3Icon, Squares2X2Icon } from "@heroicons/react/20/solid";
import { StatusButton } from "../button/StatusButton";
import { useCart } from "../../react-shopper-hooks";
import { toast } from "react-toastify";
import clsx from "clsx";
import Link from "next/link";
import Price from "../product/Price";
import StrikePrice from "../product/StrikePrice";
import {
  getAllLocations,
  getMultipleInventoriesByProductIds,
} from "../../services/multi-location-inventory";
import { getCookie } from "cookies-next";
import { COOKIE_PREFIX_KEY } from "../../lib/resolve-cart-env";

export default function HitsAlgolia(): JSX.Element {
  const { hits, sendEvent } = useHits<SearchHit>();
  const [products, setProducts] = useState<
    ShopperCatalogResource<ProductResponse[]> | undefined
  >(undefined);
  const [view, setView] = useState(
    process.env.NEXT_PUBLIC_DEFAULT_PLP_VIEW || "grid",
  );
  const [items, setItems] = useState<any>([]);
  const [childItems, setChildItems] = useState<any>([]);
  const [inventories, setInventories] = useState<
    Record<string, Record<string, number>>
  >({});
  const [locations, setLocations] = useState<any[]>([]);
  const [useMultiLocation, setUseMultiLocation] = useState<boolean>(false);
  const [selectedLocationSlug, setSelectedLocationSlug] = useState<
    string | undefined
  >();
  const { useScopedAddProductToCart, useScopedAddBulkProductToCart } =
    useCart();
  const { mutate } = useScopedAddProductToCart();
  const { mutate: mutateBulkOrder, isPending } =
    useScopedAddBulkProductToCart();
  const client = getEpccImplicitClient();

  useEffect(() => {
    const init = async () => {
      setProducts(
        await getProductByIds(
          hits.map((hit) => hit.objectID).join(","),
          client,
        ),
      );

      // Check if multi-location inventory is enabled
      const multiLocationValue = getCookie("use_multi_location_inventory");
      const isMultiLocationEnabled = multiLocationValue !== "false";
      setUseMultiLocation(isMultiLocationEnabled);

      // Get selected location from cookie
      const locationSlug = getCookie(
        `${COOKIE_PREFIX_KEY}_ep_location`,
      ) as string;
      setSelectedLocationSlug(locationSlug);

      // Fetch inventories if multi-location is enabled
      if (isMultiLocationEnabled) {
        const [locationsResponse, inventoriesResponse] = await Promise.all([
          getAllLocations(client),
          getMultipleInventoriesByProductIds(
            hits.map((hit) => hit.objectID),
            client,
          ),
        ]);

        // Store locations
        if (locationsResponse?.data && Array.isArray(locationsResponse.data)) {
          setLocations(locationsResponse.data);
        }

        // Build inventory map for ALL locations for each product
        const inventoryMap: Record<string, Record<string, number>> = {};
        const inventoriesData = inventoriesResponse?.data as any;

        if (inventoriesData && Array.isArray(inventoriesData)) {
          inventoriesData.forEach((inventory: any) => {
            const productId = inventory.id;
            const locations = inventory?.attributes?.locations || {};

            // Store inventory for all locations for this product
            inventoryMap[productId] = {};
            Object.entries(locations).forEach(
              ([locSlug, locData]: [string, any]) => {
                inventoryMap[productId][locSlug] = locData?.available || 0;
              },
            );
          });
        }
        setInventories(inventoryMap);
      }
    };
    init();
  }, [hits]);

  const toggleView = () => {
    setView(view === "list" ? "grid" : "list");
  };

  const handleInputChange = (productId: string, value: any) => {
    if (value < 0) return;
    const newItems: any = items.slice();
    const item = newItems.find((item: any) => item.productId === productId);
    if (item) {
      item.quantity = value;
    } else {
      const data = {
        productId,
        quantity: value,
      };
      newItems.push(data);
    }
    setItems(newItems);
  };

  const handleAddToCart = (productId: string) => {
    const item = items.find((item: any) => item.productId === productId);
    const data: any = {
      custom_inputs: {
        additional_information: [],
      },
    };

    // Add location information if multi-location inventory is enabled
    if (useMultiLocation && selectedLocationSlug) {
      // Find location name from locations array
      const selectedLocation = locations.find(
        (loc) => loc.attributes?.slug === selectedLocationSlug,
      );
      const locationName =
        selectedLocation?.attributes?.name || selectedLocationSlug;

      if (!data.custom_inputs.location) {
        data.custom_inputs.location = {};
      }
      data.custom_inputs.location.location_name = locationName;
      data.location = selectedLocationSlug;
    }

    mutate(
      { productId: item.productId, quantity: item.quantity, data },
      {
        onError: (response: any) => {
          if (response?.errors) {
            toast.error(response?.errors?.[0].detail, {
              position: "top-center",
              autoClose: 2000,
              hideProgressBar: false,
            });
          }
        },
      },
    );
  };

  const handleAllAddToCart = () => {
    // Find location name from locations array
    const selectedLocation = locations.find(
      (loc) => loc.attributes?.slug === selectedLocationSlug,
    );
    const locationName =
      selectedLocation?.attributes?.name || selectedLocationSlug;

    const cartItems: CartItemObject[] = items
      .filter((item: any) => {
        // Filter out items with no quantity
        if (!item.productId || item.quantity <= 0) return false;

        // If multi-location is enabled, filter out items with no inventory at selected location
        if (useMultiLocation && selectedLocationSlug) {
          const productInventory = inventories[item.productId] || {};
          const locationInventory = productInventory[selectedLocationSlug];
          return locationInventory !== undefined && locationInventory > 0;
        }

        return true;
      })
      .map((item: any) => {
        const data: any = {
          type: "cart_item",
          id: item.productId,
          quantity: item.quantity,
          custom_inputs: {
            additional_information: [],
          },
        };

        // Add location information if multi-location inventory is enabled
        if (useMultiLocation && selectedLocationSlug) {
          const productInventory = inventories[item.productId] || {};
          const locationInventory = productInventory[selectedLocationSlug];

          if (!data.custom_inputs.location) {
            data.custom_inputs.location = {};
          }
          data.custom_inputs.location.location_name = locationName;
          data.custom_inputs.location.available_quantity = locationInventory;
          data.location = selectedLocationSlug;
        }

        return data;
      });
    mutateBulkOrder(cartItems, {
      onSuccess: (response: any) => {
        if (response?.data?.length > 0) {
          toast("Items added successfully in your cart", {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
          });
        }
      },
    });
  };

  const extractValues = (obj: any) => {
    let values: any = [];

    const recurse = (currentObj: any) => {
      if (typeof currentObj === "object" && currentObj !== null) {
        if (Array.isArray(currentObj)) {
          currentObj.forEach((item) => recurse(item));
        } else {
          Object.values(currentObj).forEach((value) => recurse(value));
        }
      } else {
        values.push(currentObj);
      }
    };

    recurse(obj);
    return values;
  };

  const getVariants = async (productId: string, variationMatrix: any) => {
    const client = getEpccImplicitClient();
    const productIds = extractValues(variationMatrix);
    const newItems: any = childItems.slice();
    const items = await client.ShopperCatalog.Products.With(["main_image"])
      .Filter({
        in: {
          id: productIds.join(","),
        },
      })
      .All();
    newItems.push({
      productId,
      items,
    });
    setChildItems(newItems);
  };

  if (hits.length) {
    return (
      <>
        <div className="container mx-auto mb-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold"></h1>
            <div className="flex items-center space-x-4">
              {view === "list" && (
                <StatusButton
                  className="text-md"
                  onClick={handleAllAddToCart}
                  status={isPending ? "loading" : "idle"}
                  disabled={
                    items.filter(
                      (item: any) => item.productId && item.quantity > 0,
                    )?.[0]
                      ? false
                      : true
                  }
                >
                  Add All Items to Cart
                </StatusButton>
              )}
              <div>
                <button
                  onClick={toggleView}
                  className={clsx(
                    "p-2 rounded-l-md border-t border-l border-b border-gray-800",
                    view === "list" ? "bg-gray-800 text-white" : "",
                  )}
                >
                  <Bars3Icon
                    className={clsx(
                      "w-6 h-6",
                      view === "list" ? "text-white" : "text-gray-500",
                    )}
                  />
                </button>
                <button
                  onClick={toggleView}
                  className={clsx(
                    "p-2 rounded-r-md border-t border-r border-b border-gray-800",
                    view === "grid" ? "bg-gray-800 text-white" : "",
                  )}
                >
                  <Squares2X2Icon
                    className={clsx(
                      "w-6 h-6",
                      view === "grid" ? "text-white" : "text-gray-500",
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
          {view === "list" && (
            <div className="space-y-4 text-md">
              {products &&
                hits.map((hit) => {
                  const product: ProductResponse | undefined =
                    products.data.find((prd) => prd.id === hit.objectID);
                  if (product) {
                    const quantity =
                      items.find((item: any) => item.productId === hit.objectID)
                        ?.quantity || 0;
                    const child = childItems.find(
                      (item: any) => item.productId === hit.objectID,
                    )?.items?.data;
                    const main_images = childItems.find(
                      (item: any) => item.productId === hit.objectID,
                    )?.items?.included?.main_images;

                    // Check inventory for selected location
                    const productInventory = inventories[hit.objectID] || {};
                    const locationInventory = selectedLocationSlug
                      ? productInventory[selectedLocationSlug]
                      : undefined;

                    const hasInventory =
                      !useMultiLocation ||
                      !selectedLocationSlug ||
                      (locationInventory !== undefined &&
                        locationInventory > 0);

                    return (
                      <>
                        <HitComponentAlgoliaList
                          key={hit.objectID}
                          hit={hit}
                          product={product}
                          quantity={quantity}
                          onQuantityChange={handleInputChange}
                          onAddToCart={handleAddToCart}
                          onGetVariants={getVariants}
                          hasInventory={hasInventory}
                          availableQuantity={
                            useMultiLocation && selectedLocationSlug
                              ? locationInventory
                              : undefined
                          }
                        />
                        {product.meta.variation_matrix &&
                          child?.map((item: any) => {
                            const {
                              meta: {
                                display_price,
                                original_display_price,
                                child_variations,
                                sale_id,
                              },
                              attributes: { name, slug, sku },
                              id,
                            } = item;

                            const currencyPrice =
                              display_price?.without_tax?.formatted ||
                              display_price?.with_tax?.formatted;

                            const quantity =
                              items.find((item: any) => item.productId === id)
                                ?.quantity || 0;
                            const main_image = main_images?.find(
                              (image: any) =>
                                image.id ===
                                item.relationships.main_image.data.id,
                            );
                            const ep_main_image_url = main_image?.link.href;

                            return (
                              <div
                                key={id}
                                className="grid grid-cols-12 gap-4 items-center p-4 border rounded shadow-sm relative bg-green-50"
                              >
                                <div className="col-span-1">
                                  {ep_main_image_url && (
                                    <img
                                      src={ep_main_image_url}
                                      alt={name}
                                      className="w-20 h-24 object-cover transition duration-300 ease-in-out group-hover:scale-105 hover:scale-105"
                                    />
                                  )}
                                </div>
                                <div className="col-span-5">
                                  <h2 className="text-lg text-gray-800 font-semibold hover:text-brand-primary">
                                    <Link
                                      href={`/products/${slug}`}
                                      legacyBehavior
                                    >
                                      {name}
                                    </Link>
                                  </h2>
                                  <div className="text-gray-600 text-sm">
                                    {sku}
                                  </div>
                                  {child_variations?.map((variation: any) => {
                                    return (
                                      <span
                                        className="line-clamp-6 text-xs font-medium leading-5 text-gray-500"
                                        key={variation.id}
                                      >
                                        {variation.name}:{" "}
                                        {variation.option.name}
                                      </span>
                                    );
                                  })}
                                </div>
                                <div className="col-span-2 text-green-500 font-bold">
                                  {currencyPrice && (
                                    <div className="mt-1 flex items-center">
                                      {original_display_price && (
                                        <StrikePrice
                                          price={
                                            original_display_price?.without_tax
                                              ?.formatted
                                              ? original_display_price
                                                  ?.without_tax?.formatted
                                              : original_display_price.with_tax
                                                  .formatted
                                          }
                                          currency={
                                            original_display_price.without_tax
                                              ?.currency
                                              ? original_display_price
                                                  ?.without_tax?.currency
                                              : original_display_price.with_tax
                                                  .currency
                                          }
                                          size="text-md"
                                        />
                                      )}
                                      <Price
                                        price={
                                          display_price?.without_tax?.formatted
                                            ? display_price?.without_tax
                                                ?.formatted
                                            : display_price.with_tax.formatted
                                        }
                                        currency={
                                          display_price?.without_tax?.currency
                                            ? display_price?.without_tax
                                                ?.currency
                                            : display_price.with_tax.currency
                                        }
                                        original_display_price={
                                          original_display_price
                                        }
                                        size="text-xl"
                                      />
                                    </div>
                                  )}
                                  {original_display_price && (
                                    <span className="mt-2 uppercase inline-flex items-center rounded-sm bg-white px-2 py-1 text-xs font-medium text-pink-700 ring-1 ring-inset ring-pink-700 mb-6 mr-2">
                                      {sale_id}
                                    </span>
                                  )}
                                </div>
                                <div className="col-span-2">
                                  <div className="flex w-32 items-start rounded-lg border border-black/10">
                                    <button
                                      type="submit"
                                      onClick={() =>
                                        handleInputChange(id, quantity - 1)
                                      }
                                      className="ease flex w-9 h-9 mt-1 justify-center items-center transition-all duration-200"
                                    >
                                      <span className="text-lg">-</span>
                                    </button>
                                    <input
                                      type="number"
                                      placeholder="Quantity"
                                      className="border-none focus-visible:ring-0 focus-visible:border-black w-12 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      value={quantity}
                                      onChange={(e) =>
                                        handleInputChange(
                                          id,
                                          parseInt(e.target.value) || 0,
                                        )
                                      }
                                    />
                                    <button
                                      type="submit"
                                      onClick={() =>
                                        handleInputChange(id, quantity + 1)
                                      }
                                      className="ease flex w-9 h-9 mt-1 justify-center items-center transition-all duration-200"
                                    >
                                      <span className="text-lg">+</span>
                                    </button>
                                  </div>
                                </div>
                                <div className="col-span-2">
                                  <StatusButton
                                    className="py-2 w-32 text-sm"
                                    onClick={() => handleAddToCart(id)}
                                    variant={
                                      quantity > 0 ? "primary" : "secondary"
                                    }
                                    disabled={quantity === 0}
                                  >
                                    Add to Cart
                                  </StatusButton>
                                </div>
                              </div>
                            );
                          })}
                      </>
                    );
                  }
                  return <></>;
                })}
            </div>
          )}
        </div>

        {view === "grid" && (
          <div className="grid max-w-[80rem] grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {products &&
              hits.map((hit) => {
                const product: ProductResponse | undefined = products.data.find(
                  (prd) => prd.id === hit.objectID,
                );
                if (product) {
                  return (
                    <div
                      className="list-none justify-items-stretch rounded-lg animate-fadeIn"
                      key={hit.objectID}
                    >
                      <HitComponentAlgolia
                        hit={hit}
                        product={product}
                        sendEvent={sendEvent}
                      />
                    </div>
                  );
                }
                return <></>;
              })}
          </div>
        )}
      </>
    );
  }
  return <NoResults displayIcon={false} />;
}
