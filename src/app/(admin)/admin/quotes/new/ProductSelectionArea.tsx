"use client";

import { useState } from "react";
import BulkOrder from "../../../../../components/bulk-order/BulkOrder";
import QuickOrder from "../../../../../components/bulk-order/QuickOrder";
import {
  ProductResponse,
  ShopperCatalogResourcePage,
} from "@elasticpath/js-sdk";
import { ShopperProduct } from "../../../../../react-shopper-hooks";
import {
  getMainImageForProductResponse,
  getOtherImagesForProductResponse,
} from "../../../../../lib/file-lookup";
import SearchResultsElasticPath from "../../../../../components/search/SearchResultsElasticPath";
import PreviousOrders from "./PreviousOrders";
import { QuoteNotes } from "../QuoteNotes";

export default function ProductSelectionArea({
  products,
  status,
  account_id,
  cartId,
  initialNotes,
  adminName,
  quoteNote,
  setQuoteNote,
}: {
  products: any;
  status?: string;
  account_id: string;
  cartId?: string;
  initialNotes?: any[];
  adminName?: string;
  quoteNote?: string;
  setQuoteNote?: (note: string) => void;
}) {
  const [activeTab, setActiveTab] = useState("browse");

  return (
    <div className="mx-auto bg-white">
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-4">
          <button
            className={`py-4 px-6 ${activeTab === "browse" ? "border-b-2 border-black text-black" : "text-gray-500"}`}
            onClick={() => setActiveTab("browse")}
          >
            Browse Products
          </button>
          <button
            className={`py-4 px-6 ${activeTab === "bulkOrder" ? "border-b-2 border-black text-black" : "text-gray-500"}`}
            onClick={() => setActiveTab("bulkOrder")}
          >
            Bulk Order
          </button>
          <button
            className={`py-4 px-6 ${activeTab === "quickOrder" ? "border-b-2 border-black text-black" : "text-gray-500"}`}
            onClick={() => setActiveTab("quickOrder")}
          >
            Quick Order
          </button>
          <button
            className={`py-4 px-6 ${activeTab === "orders" ? "border-b-2 border-black text-black" : "text-gray-500"}`}
            onClick={() => setActiveTab("orders")}
          >
            Previous Orders
          </button>
          {(status === "created" || setQuoteNote !== undefined) && (
            <button
              className={`py-4 px-6 ${activeTab === "notes" ? "border-b-2 border-black text-black" : "text-gray-500"}`}
              onClick={() => setActiveTab("notes")}
            >
              Notes
            </button>
          )}
        </nav>
      </div>
      <div>
        {activeTab === "bulkOrder" && <BulkOrder />}
        {activeTab === "quickOrder" && <QuickOrder />}
        {activeTab === "browse" && (
          <SearchResultsElasticPath
            page={processResult(products)}
            nodes={[]}
            content={null}
            adminDisplay={true}
          />
        )}
        {activeTab === "orders" && <PreviousOrders account_id={account_id} />}
        {activeTab === "notes" && status === "created" && cartId && (
          <QuoteNotes
            cartId={cartId}
            initialNotes={initialNotes ?? []}
            adminName={adminName ?? "Admin"}
          />
        )}
        {activeTab === "notes" && setQuoteNote !== undefined && (
          <div className="flex flex-col gap-2 max-w-2xl">
            <label className="text-sm font-medium text-gray-700">
              Quote Notes{" "}
              <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <p className="text-sm text-gray-500">
              Add any special instructions or notes for this quote.
            </p>
            <textarea
              value={quoteNote ?? ""}
              onChange={(e) => setQuoteNote(e.target.value)}
              placeholder="Enter any special instructions, delivery notes, or comments for this quote..."
              className="w-full rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-white leading-relaxed px-4 py-3 min-h-[120px] resize-y text-sm placeholder:text-gray-400 hover:border-gray-400 transition-all duration-200"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {(quoteNote ?? "").length}/500 characters
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function processResult(
  page: ShopperCatalogResourcePage<ProductResponse>,
): ShopperCatalogResourcePage<ShopperProduct> {
  const processedData: ShopperProduct[] = page.data.map((product) => {
    const mainImage = page.included?.main_images
      ? getMainImageForProductResponse(product, page.included.main_images) ??
        null
      : null;

    const otherImages = page.included?.files
      ? getOtherImagesForProductResponse(product, page.included?.files) ?? []
      : [];

    return {
      kind: "simple-product",
      response: product,
      main_image: mainImage,
      otherImages: otherImages,
    };
  });

  return {
    ...page,
    data: processedData,
  };
}
