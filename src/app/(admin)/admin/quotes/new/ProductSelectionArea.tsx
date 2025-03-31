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

export default function ProductSelectionArea({
  products,
  status,
  account_id,
}: {
  products: any;
  status?: string;
  account_id: string;
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
          {status === "created" && (
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
