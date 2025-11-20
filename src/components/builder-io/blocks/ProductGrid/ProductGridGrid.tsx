"use client";

import { FC, useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { PromoBanner } from "./PromoBanner";
import { buildCells, validateGridSlot } from "./grid-utils";
import { Cell, GridLayoutConfig } from "./types";
import {
  ProductResponse,
  ShopperCatalogResourcePage,
} from "@elasticpath/js-sdk";
import { ShopperProduct } from "../../../../react-shopper-hooks";
import {
  getMainImageForProductResponse,
  getOtherImagesForProductResponse,
} from "../../../../lib/file-lookup";
import { getProductByIds } from "../../../../services/products";
import { getEpccImplicitClient } from "../../../../lib/epcc-implicit-client";
import { getCookie } from "cookies-next";
import { COOKIE_PREFIX_KEY } from "../../../../lib/resolve-cart-env";
import { getMultipleInventoriesByProductIds } from "../../../../services/multi-location-inventory";

export interface ProductGridGridProps {
  productsList?: any;
  customCss?: string;
  gridLayout?: GridLayoutConfig;
}

export const ProductGridGrid: FC<ProductGridGridProps> = ({
  productsList,
  customCss,
  gridLayout = { columns: 4 },
}) => {
  const [products, setProducts] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [productSource, setProductSource] = useState<string>("elasticpath");
  const [inventoryByProduct, setInventoryByProduct] = useState<{
    [productId: string]: number;
  }>({});
  const [useMultiLocation, setUseMultiLocation] = useState<boolean>(false);
  const [selectedLocationSlug, setSelectedLocationSlug] = useState<string>("");
  const [cells, setCells] = useState<Cell[]>([]);

  const { columns, slots = [], cellsPerPage } = gridLayout;

  useEffect(() => {
    // Check product_source cookie
    const source = (getCookie("product_source") as string) || "elasticpath";
    setProductSource(source);

    // Check multi-location inventory setting
    const multiLocationValue = getCookie("use_multi_location_inventory");
    const isEnabled = multiLocationValue !== "false";
    setUseMultiLocation(isEnabled);

    // Get selected location
    const locationSlug = getCookie(`${COOKIE_PREFIX_KEY}_ep_location`);
    setSelectedLocationSlug((locationSlug as string) || "");
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const client = getEpccImplicitClient();
      const productIds = productsList?.map((entry: any) => {
        return entry.product?.options?.product;
      });
      const response = await getProductByIds(productIds?.join(","), client);
      setProducts(processResult(response));
      setLoading(false);
    };
    if (productsList) {
      init();
    }
  }, [productsList]);

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

  // Return null if product_source is external
  if (productSource === "external") {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-500">Loading products...</div>
      </div>
    );
  }

  return (
    <div
      className={customCss || "xl:max-w-7xl xl:p-0 mx-auto max-w-full p-8"}
    >
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
            // Debug: log slot data
            if (cell.slot.content?.image) {
              console.log("Rendering slot:", {
                slotId: cell.slot.id,
                content: cell.slot.content,
                image: cell.slot.content.image,
              });
            }
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

