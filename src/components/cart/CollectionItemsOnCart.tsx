import ProductCard from "../builder-io/blocks/ProductGrid/ProductCard";
import React from "react";

interface CollectionItemsOnCartProps {
  selectedCollection: any;
  collectionItems: any[];
  loadingItems: boolean;
  isAddingAll: boolean;
  onClear: () => void;
  onAddAll: () => void;
}

const CollectionItemsOnCart: React.FC<CollectionItemsOnCartProps> = ({
  selectedCollection,
  collectionItems,
  loadingItems,
  isAddingAll,
  onClear,
  onAddAll,
}) => {
  if (!selectedCollection) return null;
  return (
    <div className="mb-8 bg-gray-50 border border-gray-200 rounded p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-brand-primary">
          {selectedCollection.name}
        </h2>
        <div className="flex gap-2">
          <button
            className="text-xs text-gray-500 hover:underline"
            onClick={onClear}
          >
            Clear
          </button>
          <button
            className="text-xs text-brand-primary border border-brand-primary rounded px-3 py-1 hover:bg-brand-primary hover:text-white transition"
            disabled={isAddingAll || collectionItems.length === 0}
            onClick={onAddAll}
          >
            {isAddingAll ? "Adding..." : "Add All to Cart"}
          </button>
        </div>
      </div>
      {loadingItems ? (
        <div className="text-gray-500">Loading items...</div>
      ) : collectionItems.length === 0 ? (
        <div className="text-gray-500">No items in this collection.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {collectionItems.map((item: any) => {
            const product = {
              kind: item.type === "cart_item" ? "simple-product" : "bundle",
              response: {
                id: item.product_id,
                attributes: {
                  name: item.name,
                  sku: item.sku,
                  slug: item.sku,
                },
                meta: {
                  display_price: item.meta?.display_price,
                },
              },
              main_image: item?.image?.href
                ? { link: { href: item?.image?.href } }
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
      )}
    </div>
  );
};

export default CollectionItemsOnCart;
