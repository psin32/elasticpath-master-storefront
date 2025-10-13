"use client";

import { FC, useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import {
  ProductResponse,
  ShopperCatalogResourcePage,
} from "@elasticpath/js-sdk";
import { ShopperProduct } from "../../../../react-shopper-hooks";
import {
  getMainImageForProductResponse,
  getOtherImagesForProductResponse,
} from "../../../../lib/file-lookup";
import Slider from "react-slick";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { getProductByIds } from "../../../../services/products";
import { getEpccImplicitClient } from "../../../../lib/epcc-implicit-client";
import { getCookie } from "cookies-next";
import { COOKIE_PREFIX_KEY } from "../../../../lib/resolve-cart-env";
import { getMultipleInventoriesByProductIds } from "../../../../services/multi-location-inventory";

export interface CarouselProps {
  slidesToShow: number;
  slidesToScroll: number;
  enableAutoplay: boolean;
  enabledInfinite: boolean;
  speed: number;
  displayDots: boolean;
}

export interface ProductGridProps {
  productsList?: any;
  customCss?: string;
  carouselProps: CarouselProps;
}

export const ProductGrid: FC<ProductGridProps> = ({
  productsList,
  customCss,
  carouselProps,
}) => {
  const [products, setProducts] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [productSource, setProductSource] = useState<string>("elasticpath");
  const [inventoryByProduct, setInventoryByProduct] = useState<{
    [productId: string]: number;
  }>({});
  const [useMultiLocation, setUseMultiLocation] = useState<boolean>(false);
  const [selectedLocationSlug, setSelectedLocationSlug] = useState<string>("");

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
    init();
  }, [productsList]);

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

  const NextArrow = (props: any) => {
    const { onClick } = props;
    return (
      <ChevronRightIcon
        onClick={onClick}
        className="w-8 h-8 text-gray-600 absolute top-1/2 transform -translate-y-1/2 -right-6 z-20 cursor-pointer hover:text-gray-800"
      />
    );
  };

  const PrevArrow = (props: any) => {
    const { onClick } = props;
    return (
      <ChevronLeftIcon
        onClick={onClick}
        className="w-8 h-8 text-gray-600 absolute top-1/2 transform -translate-y-1/2 -left-6 z-20 cursor-pointer hover:text-gray-800"
      />
    );
  };

  const settings = {
    dots: carouselProps?.displayDots || false,
    infinite: carouselProps?.enabledInfinite || false,
    speed: carouselProps?.speed || 300,
    slidesToShow: carouselProps?.slidesToShow || 4,
    slidesToScroll: carouselProps?.slidesToScroll || 1,
    autoplay: carouselProps?.enableAutoplay || false,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          dots: carouselProps?.displayDots || false,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          dots: carouselProps?.displayDots || false,
        },
      },
    ],
  };

  return (
    <div>
      <Slider
        {...settings}
        className={
          customCss ? customCss : "xl:max-w-7xl xl:p-0 mx-auto max-w-full p-8"
        }
      >
        {products &&
          products.data.map((hit: any, i: number) => {
            const productId = hit.response.id;
            const inventory = inventoryByProduct[productId];
            return (
              <ProductCard
                key={`${productId}-${i}`}
                product={hit}
                locationInventory={inventory}
                useMultiLocation={useMultiLocation}
                selectedLocationSlug={selectedLocationSlug}
              />
            );
          })}
      </Slider>
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
