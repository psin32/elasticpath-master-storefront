"use client";

import { useState, useEffect } from "react";
import { useCart } from "../../../react-shopper-hooks";
import { StatusButton } from "../../../components/button/StatusButton";
import { getCookie } from "cookies-next";
import { COOKIE_PREFIX_KEY } from "../../../lib/resolve-cart-env";
import Image from "next/image";
import Link from "next/link";
import { sampleProducts, SampleProduct } from "../../../lib/sample-products";

export default function ExternalProductsPLP() {
  const { useScopedAddCustomItemToCart } = useCart();
  const { mutate: addCustomItem, isPending } = useScopedAddCustomItemToCart();
  const [addingItems, setAddingItems] = useState<Record<string, boolean>>({});
  const [currency, setCurrency] = useState<string>("USD");

  useEffect(() => {
    // Get currency from cookie
    const currencyInCookie = getCookie(
      `${COOKIE_PREFIX_KEY}_ep_currency`,
    ) as string;
    setCurrency(currencyInCookie || "USD");
  }, []);

  const handleAddToCart = (product: SampleProduct) => {
    setAddingItems((prev) => ({ ...prev, [product.id]: true }));

    const customItemData = {
      type: "custom_item" as const,
      name: product.name,
      description: product.description,
      sku: product.sku,
      quantity: 1,
      price: {
        amount: product.amount,
        includes_tax: false,
      },
      custom_inputs: {
        image_url: product.image,
        additional_information: product.additional_information,
      },
    };

    addCustomItem(customItemData, {
      onSuccess: () => {
        setAddingItems((prev) => ({ ...prev, [product.id]: false }));
      },
      onError: () => {
        setAddingItems((prev) => ({ ...prev, [product.id]: false }));
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Products</h1>
        <p className="text-gray-600">
          Discover our curated collection of premium external products
        </p>
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        {sampleProducts.map((product) => (
          <div key={product.id} className="group">
            <div className="relative border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="aspect-square block w-full overflow-hidden rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100">
                <div className="relative w-full h-full rounded-lg text-center animate-fadeIn transition duration-300 ease-in-out group-hover:scale-105">
                  <Image
                    alt={product.name}
                    src={product.image}
                    className="rounded-lg"
                    sizes="(max-width: 200px)"
                    fill
                    style={{
                      objectFit: "cover",
                      objectPosition: "center",
                    }}
                  />
                </div>
              </div>
              <p className="mt-2 block truncate text-sm font-medium text-gray-900">
                {product.name}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                SKU: {product.sku}
              </div>
              <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
                {product.originalPrice && (
                  <span className="line-through text-gray-400">
                    {new Intl.NumberFormat("en", {
                      style: "currency",
                      currency: currency,
                    }).format((product.originalPrice || 0) / 100)}
                  </span>
                )}
                <span className="text-gray-900">
                  {new Intl.NumberFormat("en", {
                    style: "currency",
                    currency: currency,
                  }).format((product.amount || 0) / 100)}
                </span>
              </div>
              <div className="mt-3">
                <StatusButton
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToCart(product);
                  }}
                  status={addingItems[product.id] ? "loading" : "idle"}
                  className="w-full p-2 text-sm"
                  variant="primary"
                >
                  Add to Cart
                </StatusButton>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
