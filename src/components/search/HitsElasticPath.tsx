import clsx from "clsx";
import Price from "../product/Price";
import StrikePrice from "../product/StrikePrice";
import HitComponentElasticPath from "./HitElasticPath";
import NoResults from "./NoResults";
import { useProducts } from "./ProductsProvider";
import {
  CheckCircleIcon,
  MinusIcon,
  PlusIcon,
  Squares2X2Icon,
  Bars3Icon,
} from "@heroicons/react/20/solid";

import { useState } from "react";
import { StatusButton } from "../button/StatusButton";
import Link from "next/link";
import { useCart } from "../../react-shopper-hooks";
import { toast } from "react-toastify";
import { CartItemObject } from "@moltin/sdk";
import { getEpccImplicitClient } from "../../lib/epcc-implicit-client";
import MultibuyOfferModal from "../featured-products/MultibuyOfferModal";

export default function HitsElasticPath(): JSX.Element {
  const { page } = useProducts();
  const { useScopedAddProductToCart, useScopedAddBulkProductToCart } =
    useCart();
  const { mutate } = useScopedAddProductToCart();
  const { mutate: mutateBulkOrder, isPending } =
    useScopedAddBulkProductToCart();
  const [items, setItems] = useState<any>([]);
  const [view, setView] = useState(
    process.env.NEXT_PUBLIC_DEFAULT_PLP_VIEW || "grid",
  );
  const [childItems, setChildItems] = useState<any>([]);

  if (!page) {
    return <NoResults displayIcon={false} />;
  }

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
    mutate(
      { productId: item.productId, quantity: item.quantity },
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
    const cartItems: CartItemObject[] = items
      .filter((item: any) => item.productId && item.quantity > 0)
      .map((item: any) => {
        return {
          type: "cart_item",
          id: item.productId,
          quantity: item.quantity,
        };
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

  if (page.data.length) {
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
              {page.data.map((hit: any) => {
                const {
                  main_image,
                  response: {
                    meta: {
                      display_price,
                      original_display_price,
                      variation_matrix,
                      sale_id,
                    },
                    attributes: {
                      name,
                      description,
                      slug,
                      sku,
                      components,
                      tiers,
                    },
                    id,
                  },
                } = hit;

                console.log("tiers", tiers);

                const ep_main_image_url = main_image?.link.href;

                const currencyPrice =
                  display_price?.without_tax?.formatted ||
                  display_price?.with_tax?.formatted;

                const quantity =
                  items.find((item: any) => item.productId === id)?.quantity ||
                  0;
                const child = childItems.find(
                  (item: any) => item.productId === id,
                )?.items?.data;
                const main_images = childItems.find(
                  (item: any) => item.productId === id,
                )?.items?.included?.main_images;

                return (
                  <>
                    <div
                      key={id}
                      className="grid grid-cols-12 gap-4 items-center p-4 border rounded shadow-sm relative"
                    >
                      {quantity > 0 && (
                        <CheckCircleIcon className="w-6 h-6 text-green-500 absolute top-0 left-0 z-10" />
                      )}
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
                          <Link href={`/products/${slug}`} legacyBehavior>
                            {name}
                          </Link>
                        </h2>
                        <div className="text-gray-600 text-sm">{sku}</div>
                        <span
                          className="mt-2 line-clamp-6 text-xs font-medium leading-5 text-gray-500"
                          dangerouslySetInnerHTML={{
                            __html:
                              description.length > 200
                                ? `${description.substring(0, 200)}...`
                                : description,
                          }}
                        ></span>
                      </div>
                      <div className="col-span-2 text-green-500 font-bold">
                        {currencyPrice && (
                          <div className="mt-1 flex items-center">
                            {original_display_price && (
                              <StrikePrice
                                price={
                                  original_display_price?.without_tax?.formatted
                                    ? original_display_price?.without_tax
                                        ?.formatted
                                    : original_display_price.with_tax.formatted
                                }
                                currency={
                                  original_display_price.without_tax?.currency
                                    ? original_display_price?.without_tax
                                        ?.currency
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
                        {original_display_price && (
                          <span className="mt-2 uppercase inline-flex items-center rounded-sm bg-white px-2 py-1 text-xs font-medium text-pink-700 ring-1 ring-inset ring-pink-700 mb-6 mr-2">
                            {sale_id}
                          </span>
                        )}
                        {tiers && (
                          <div className="bg-red-700 text-white rounded-md p-2 mt-2 uppercase text-center font-bold flex flex-row gap-2 text-xs justify-center items-center w-40">
                            <MultibuyOfferModal product={hit.response} />
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        {!variation_matrix && !components && (
                          <div className="flex w-32 items-start rounded-lg border border-black/10">
                            <button
                              type="submit"
                              onClick={() =>
                                handleInputChange(id, quantity - 1)
                              }
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
                                handleInputChange(id, parseInt(e.target.value))
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
                              onClick={() =>
                                handleInputChange(id, quantity + 1)
                              }
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
                            className="py-2 w-40 text-md"
                            onClick={() => handleAddToCart(id)}
                            variant={quantity > 0 ? "primary" : "secondary"}
                            disabled={quantity === 0}
                          >
                            Add to Cart
                          </StatusButton>
                        )}

                        {variation_matrix && (
                          <StatusButton
                            className="py-2 text-md w-40"
                            onClick={() => getVariants(id, variation_matrix)}
                          >
                            Choose Variants
                          </StatusButton>
                        )}

                        {components && (
                          <Link href={`/products/${slug}`} legacyBehavior>
                            <StatusButton className="py-2 text-md w-40">
                              View Bundle
                            </StatusButton>
                          </Link>
                        )}
                      </div>
                    </div>

                    {variation_matrix &&
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
                        const main_image = main_images.find(
                          (image: any) =>
                            image.id === item.relationships.main_image.data.id,
                        );
                        const ep_main_image_url = main_image?.link.href;

                        return (
                          <div
                            key={id}
                            className="grid grid-cols-12 gap-4 items-center p-4 border rounded shadow-sm relative bg-green-50"
                          >
                            {quantity > 0 && (
                              <CheckCircleIcon className="w-6 h-6 text-green-500 absolute top-0 left-0 z-10" />
                            )}
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
                                <Link href={`/products/${slug}`} legacyBehavior>
                                  {name}
                                </Link>
                              </h2>
                              <div className="text-gray-600 text-sm">{sku}</div>
                              {child_variations.map((variation: any) => {
                                return (
                                  <span
                                    className="line-clamp-6 text-xs font-medium leading-5 text-gray-500"
                                    key={variation.id}
                                  >
                                    {variation.name}: {variation.option.name}
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
                                          ? original_display_price?.without_tax
                                              ?.formatted
                                          : original_display_price.with_tax
                                              .formatted
                                      }
                                      currency={
                                        original_display_price.without_tax
                                          ?.currency
                                          ? original_display_price?.without_tax
                                              ?.currency
                                          : original_display_price.with_tax
                                              .currency
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
                                  className="bg-green-50 border-none focus-visible:ring-0 focus-visible:border-black w-12 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  value={quantity}
                                  onChange={(e) =>
                                    handleInputChange(
                                      id,
                                      parseInt(e.target.value),
                                    )
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
                                  onClick={() =>
                                    handleInputChange(id, quantity + 1)
                                  }
                                  className="ease flex w-9 h-9 mt-1 justify-center items-center transition-all duration-200"
                                >
                                  <PlusIcon className="h-4 w-4 dark:text-neutral-500" />
                                </button>
                              </div>
                            </div>
                            <div className="col-span-2">
                              <StatusButton
                                className="py-2 w-40 text-md"
                                onClick={() => handleAddToCart(id)}
                                variant={quantity > 0 ? "primary" : "secondary"}
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
              })}
            </div>
          )}
        </div>

        {view === "grid" && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {page.data.map((hit) => {
              const {
                response: { id },
              } = hit;
              return (
                <div
                  className="list-none justify-items-stretch rounded-lg animate-fadeIn"
                  key={id}
                >
                  <HitComponentElasticPath hit={hit} />
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  }
  return <NoResults displayIcon={false} />;
}
