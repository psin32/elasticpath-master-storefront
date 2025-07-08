"use client";
import { YourBag } from "./YourBag";
import { CartSidebar } from "./CartSidebar";
import { Button } from "../../../components/button/Button";
import Link from "next/link";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { useCart } from "../../../react-shopper-hooks";
import { toast } from "react-toastify";
import { getCookie } from "cookies-next";
import { useState, useEffect } from "react";
import { getPublicSharedLists } from "../../../services/custom-api";
import { getEpccImplicitClient } from "../../../lib/epcc-implicit-client";
import CollectionItemsOnCart from "../../../components/cart/CollectionItemsOnCart";

export function CartView() {
  const { state } = useCart() as any;
  const [useShippingGroups, setUseShippingGroups] = useState<boolean>(false);

  // State for public shared lists
  const [collections, setCollections] = useState<any[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);

  // State for selected collection and its items
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [collectionItems, setCollectionItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const { useScopedAddBulkProductToCart } = useCart() as any;
  const { mutate: addBulkToCart, isPending: isAddingAll } =
    useScopedAddBulkProductToCart();

  useEffect(() => {
    setLoadingCollections(true);
    getPublicSharedLists().then((res) => {
      if (res.success) setCollections(res.data);
      setLoadingCollections(false);
    });
  }, []);

  // Check the use_shipping_groups setting on component mount
  useEffect(() => {
    const shippingGroupsValue = getCookie("use_shipping_groups");
    setUseShippingGroups(shippingGroupsValue === "true");
  }, []);

  // Determine the checkout URL based on shipping groups setting
  const checkoutUrl = useShippingGroups ? "/checkout/delivery" : "/checkout";

  const handleCollectionSelect = async (cartId: string) => {
    setSelectedCollection(collections.find((c) => c.cart_id === cartId));
    setLoadingItems(true);
    setCollectionItems([]);
    try {
      const client = getEpccImplicitClient();
      const cartResponse = await client.Cart(cartId).With(["items"]).Get();
      setCollectionItems(cartResponse.included?.items || []);
    } catch (err) {
      setCollectionItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row flex-1 self-stretch">
        {/* Main Content */}
        <div className="flex justify-center self-stretch items-start gap-2 flex-only-grow">
          <div className="flex flex-col gap-10 p-5 lg:p-24 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-4xl font-medium">{state.name}</h1>
              {/* Collections Dropdown */}
              <div>
                <label
                  htmlFor="collections-dropdown"
                  className="block text-xs text-gray-500 mb-1"
                >
                  Browse Collections
                </label>
                <select
                  id="collections-dropdown"
                  className="border rounded px-3 py-2 text-sm min-w-[200px]"
                  value={selectedCollection?.cart_id || ""}
                  onChange={(e) => {
                    if (e.target.value) handleCollectionSelect(e.target.value);
                  }}
                  disabled={loadingCollections || collections.length === 0}
                >
                  <option value="" disabled>
                    {loadingCollections ? "Loading..." : "Select a collection"}
                  </option>
                  {collections.map((col) => (
                    <option key={col.id} value={col.cart_id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Selected Collection Items */}
            <CollectionItemsOnCart
              selectedCollection={selectedCollection}
              collectionItems={collectionItems}
              loadingItems={loadingItems}
              isAddingAll={isAddingAll}
              onClear={() => {
                setSelectedCollection(null);
                setCollectionItems([]);
              }}
              onAddAll={() => {
                if (!collectionItems.length) return;
                const bulkItems = collectionItems.map((item: any) => ({
                  type: "cart_item",
                  id: item.product_id,
                  quantity: item.quantity,
                  custom_inputs: item.custom_inputs || {},
                }));
                addBulkToCart(bulkItems, {
                  onSuccess: () => {
                    toast.success("All items added to your cart!", {
                      position: "top-center",
                    });
                  },
                  onError: (err: any) => {
                    toast.error(err?.message || "Failed to add items to cart", {
                      position: "top-center",
                    });
                  },
                });
              }}
            />
            {/* Cart Items or Empty Cart Message */}
            {state?.items?.length > 0 ? (
              <YourBag />
            ) : (
              <div className="text-center min-h-[30rem]">
                <h3 className="mt-4 text-2xl font-semibold text-gray-900">
                  Empty Cart
                </h3>
                <p className="mt-1 text-gray-500">Your cart is empty</p>
                <div className="mt-6">
                  <Button variant="primary" asChild>
                    <Link href="/">Start shopping</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Sidebar */}
        <div className="flex flex-col items-start gap-5 self-stretch px-5 py-5 lg:px-16 lg:py-40 bg-[#F9F9F9] flex-none">
          {state?.items?.length > 0 ? (
            <>
              <CartSidebar />
              <Button type="button" asChild className="self-stretch">
                <Link href={checkoutUrl}>
                  <LockClosedIcon className="w-5 h-5 mr-2" />
                  Checkout
                </Link>
              </Button>
            </>
          ) : (
            <div className="inline-flex flex-col items-start gap-5 lg:w-[24.375rem] w-full"></div>
          )}
        </div>
      </div>
    </>
  );
}
