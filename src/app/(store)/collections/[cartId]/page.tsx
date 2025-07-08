"use client";
import { useParams } from "next/navigation";
import { Button } from "../../../../components/button/Button";
import Link from "next/link";
import ProductCard from "../../../../components/builder-io/blocks/ProductGrid/ProductCard";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { getEpccImplicitClient } from "../../../../lib/epcc-implicit-client";
import { getCartDetails } from "./actions";
import { useCart } from "../../../../react-shopper-hooks";
import { toast } from "react-toastify";

export default function SharedListDetailPage() {
  const params = useParams();
  const cartId = params?.cartId as string;
  const [cart, setCart] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { useScopedAddBulkProductToCart } = useCart() as any;
  const { mutate: addBulkToCart, isPending: isAddingAll } =
    useScopedAddBulkProductToCart();

  useEffect(() => {
    async function fetchCart() {
      try {
        setIsLoading(true);
        setError(null);
        const client = getEpccImplicitClient();
        const cartResponse = await client.Cart(cartId).With("items").Get();
        setCart(cartResponse);
      } catch (err: any) {
        console.error("Error fetching cart:", err);
        setError(err.message || "Failed to load shared list");
      } finally {
        setIsLoading(false);
      }
    }

    if (cartId) {
      fetchCart();
    }
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="text-center">
          <div className="text-gray-500">Loading shared list...</div>
        </div>
      </div>
    );
  }

  if (error || !cart) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="text-center text-red-600">
          {error || "Failed to load shared list."}
        </div>
      </div>
    );
  }

  const items = cart.included?.items || [];
  const listName = cart.data?.name || "Shared List";
  const itemCount = items.length;

  // Add All to Cart handler
  const handleAddAllToCart = () => {
    if (!items.length) return;
    const bulkItems = items.map((item: any) => ({
      type: "cart_item",
      id: item.product_id,
      quantity: item.quantity,
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
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{listName}</h1>
          <p className="text-gray-600">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>
        {itemCount > 0 && (
          <Button
            onClick={handleAddAllToCart}
            disabled={isAddingAll}
            className="px-6 py-2 w-full sm:w-auto"
          >
            {isAddingAll ? "Adding..." : "Add All to Cart"}
          </Button>
        )}
      </div>

      {/* Content */}
      {itemCount === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-6">This shared list is empty.</div>
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      ) : (
        <div>
          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            {items.map((item: any) => {
              // Transform cart item to product format for ProductCard
              const product = {
                kind: item.type === "cart_item" ? "simple-product" : "bundle",
                response: {
                  id: item.product_id,
                  quantity: item.quantity,
                  attributes: {
                    name: item.name,
                    sku: item.sku,
                    slug: item.slug, // Use SKU as slug for now
                  },
                  meta: {
                    display_price: {
                      with_tax: {
                        formatted:
                          item.meta?.display_price?.with_tax?.unit?.formatted ||
                          "$0.00",
                        currency:
                          item.meta?.display_price?.with_tax?.unit?.currency ||
                          "USD",
                      },
                      without_tax: {
                        formatted:
                          item.meta?.display_price?.without_tax?.unit
                            ?.formatted || "$0.00",
                        currency:
                          item.meta?.display_price?.without_tax?.unit
                            ?.currency || "USD",
                      },
                    },
                  },
                },
                main_image: item?.image?.href
                  ? {
                      link: {
                        href: item?.image?.href,
                      },
                    }
                  : null,
              };

              return (
                <div key={item.id} className="relative">
                  <ProductCard product={product} />
                  <div className="absolute top-2 right-2 bg-brand-primary text-white px-2 py-1 rounded-full text-xs font-medium">
                    Qty: {item.quantity}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
