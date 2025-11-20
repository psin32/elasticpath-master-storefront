"use client";

import { FC, useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { PromoBanner } from "./PromoBanner";
import { buildCells, validateGridSlot } from "./grid-utils";
import { Cell, GridLayoutConfig } from "./types";
import { searchClient } from "../../../../lib/search-client";
import { algoliaEnvData } from "../../../../lib/resolve-algolia-env";
import { useCatalogId } from "../../../../react-shopper-hooks";
import { getProductByIds } from "../../../../services/products";
import { getEpccImplicitClient } from "../../../../lib/epcc-implicit-client";
import { getCookie } from "cookies-next";
import { COOKIE_PREFIX_KEY } from "../../../../lib/resolve-cart-env";
import { getMultipleInventoriesByProductIds } from "../../../../services/multi-location-inventory";
import {
  ProductResponse,
  ShopperCatalogResourcePage,
} from "@elasticpath/js-sdk";
import { ShopperProduct } from "../../../../react-shopper-hooks";
import {
  getMainImageForProductResponse,
  getOtherImagesForProductResponse,
} from "../../../../lib/file-lookup";

export interface ProductGridAlgoliaProps {
  customCss?: string;
  gridLayout?: GridLayoutConfig;
  // Algolia search configuration
  searchQuery?: string; // Optional search query
  filters?: string; // Optional Algolia filters
  hitsPerPage?: number; // Number of products to fetch
  sortBy?: string; // Sort order (e.g., "price_asc", "price_desc")
}

export const ProductGridAlgolia: FC<ProductGridAlgoliaProps> = ({
  customCss,
  gridLayout = { columns: 4 },
  searchQuery = "",
  filters,
  hitsPerPage = 20,
  sortBy,
}) => {
  const [products, setProducts] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [inventoryByProduct, setInventoryByProduct] = useState<{
    [productId: string]: number;
  }>({});
  const [useMultiLocation, setUseMultiLocation] = useState<boolean>(false);
  const [selectedLocationSlug, setSelectedLocationSlug] = useState<string>("");
  const [cells, setCells] = useState<Cell[]>([]);
  const catalogId = useCatalogId();

  const { columns, slots = [], cellsPerPage } = gridLayout;

  useEffect(() => {
    // Check multi-location inventory setting
    const multiLocationValue = getCookie("use_multi_location_inventory");
    const isEnabled = multiLocationValue !== "false";
    setUseMultiLocation(isEnabled);

    // Get selected location
    const locationSlug = getCookie(`${COOKIE_PREFIX_KEY}_ep_location`);
    setSelectedLocationSlug((locationSlug as string) || "");
  }, []);

  // Fetch products from Algolia
  useEffect(() => {
    const fetchProducts = async () => {
      if (!algoliaEnvData.enabled || !catalogId) {
        console.warn("Algolia is not enabled or catalog ID is not available");
        return;
      }

      setLoading(true);
      try {
        // Determine which index to use based on sortBy
        // Algolia uses different indices for different sort orders
        let indexName = algoliaEnvData.indexName;
        if (sortBy) {
          // If sortBy is provided and matches a sort index pattern, use it
          // Format: {indexName}_price_asc, {indexName}_price_desc, etc.
          if (sortBy.startsWith(algoliaEnvData.indexName)) {
            indexName = sortBy;
          }
        }

        const index = searchClient.initIndex(indexName);

        // Build Algolia query parameters
        const queryParams: any = {
          hitsPerPage,
          filters: filters || `is_child:0 AND catalog_${catalogId}:true`,
        };

        // Perform search
        const { hits } = await index.search(searchQuery || "", queryParams);

        if (hits && hits.length > 0) {
          // Fetch full product data from Elastic Path
          const client = getEpccImplicitClient();
          const productIds = hits.map((hit: any) => hit.objectID).join(",");
          const response = await getProductByIds(productIds, client);
          setProducts(processResult(response));
        } else {
          setProducts({ data: [] });
        }
      } catch (error) {
        console.error("Error fetching products from Algolia:", error);
        setProducts({ data: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery, filters, hitsPerPage, sortBy, catalogId]);

  // Build cells when products or grid layout changes
  useEffect(() => {
    if (!products?.data) {
      setCells([]);
      return;
    }

    // Validate slots
    const totalCells = cellsPerPage || products.data.length + slots.length * 4;
    const validSlots = slots.filter((slot) => {
      const validation = validateGridSlot(slot, columns, totalCells);
      if (!validation.valid) {
        console.warn(`Invalid grid slot: ${validation.error}`, slot);
      }
      return validation.valid;
    });

    const builtCells = buildCells({
      hits: products.data,
      slots: validSlots,
      columns,
      cellsPerPage,
    });

    setCells(builtCells);
  }, [products, columns, slots, cellsPerPage]);

  // Fetch inventory for all products when multi-location is enabled
  useEffect(() => {
    const fetchInventories = async () => {
      if (!useMultiLocation || !selectedLocationSlug || !products?.data) {
        return;
      }

      try {
        const client = getEpccImplicitClient();
        const productIds = products.data
          .filter((product: any) => {
            // Only fetch for simple products (not bundles/variations)
            const isSimple =
              product.kind === "simple-product" &&
              !product.response.attributes.components &&
              !product.response.meta.variation_matrix;
            return isSimple;
          })
          .map((product: any) => product.response.id);

        if (productIds.length === 0) {
          return;
        }

        const inventoriesResponse = await getMultipleInventoriesByProductIds(
          productIds,
          client,
        );
        const inventories = inventoriesResponse?.data as any;

        if (!inventories || inventories.length === 0) {
          console.log("No multi-location inventory data for products");
          return;
        }

        // Build inventory map
        const inventoryMap: { [productId: string]: number } = {};
        inventories.forEach((inventory: any) => {
          const productId = inventory.id;
          const available =
            inventory?.attributes?.locations?.[selectedLocationSlug]
              ?.available || 0;
          inventoryMap[productId] = available;
        });

        setInventoryByProduct(inventoryMap);
      } catch (error) {
        console.error("Error fetching inventories for product grid:", error);
      }
    };

    fetchInventories();
  }, [products, useMultiLocation, selectedLocationSlug]);

  if (!algoliaEnvData.enabled || !catalogId) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-500">
          Algolia search is not enabled or catalog ID is not available
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-500">Loading products...</div>
      </div>
    );
  }

  return (
    <div className={customCss || "xl:max-w-7xl xl:p-0 mx-auto max-w-full p-8"}>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {cells.map((cell, index) => {
          const cellIndex = index + 1;

          if (cell.type === "product") {
            const productId = cell.product.response.id;
            const inventory = inventoryByProduct[productId];
            return (
              <ProductCard
                key={`product-${productId}-${cellIndex}`}
                product={cell.product}
                locationInventory={inventory}
                useMultiLocation={useMultiLocation}
                selectedLocationSlug={selectedLocationSlug}
              />
            );
          }

          if (cell.type === "slot") {
            const { spanCols, spanRows } = cell.slot;
            return (
              <div
                key={`slot-${cell.slot.id}-${cellIndex}`}
                style={{
                  gridColumn: `span ${spanCols}`,
                  gridRow: `span ${spanRows}`,
                }}
                className="w-full h-full"
              >
                <PromoBanner slot={cell.slot} />
              </div>
            );
          }

          // slot-shadow cells are occupied by the main slot area; render nothing
          // empty cells can be rendered as empty divs or nothing
          return null;
        })}
      </div>
    </div>
  );
};

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
