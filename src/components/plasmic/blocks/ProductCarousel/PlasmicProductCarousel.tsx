"use client";

import { FC, useEffect, useState } from "react";
import Slider from "react-slick";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { getEpccImplicitClient } from "../../../../lib/epcc-implicit-client";
import {
  getMainImageForProductResponse,
  getOtherImagesForProductResponse,
} from "../../../../lib/file-lookup";
import ProductCard from "../../../builder-io/blocks/ProductGrid/ProductCard";
import type {
  ProductResponse,
  ShopperCatalogResourcePage,
} from "@elasticpath/js-sdk";
import type { ShopperProduct } from "../../../../react-shopper-hooks";

export type PlasmicProductCarouselProps = {
  selectionMode?: "products" | "node";
  productIds?: string;
  nodeId?: string;
  title?: string;
  slidesToShow?: number;
  slidesToScroll?: number;
  autoplay?: boolean;
  infinite?: boolean;
  showDots?: boolean;
  speed?: number;
  className?: string;
};

const PlasmicProductCarousel: FC<PlasmicProductCarouselProps> = ({
  selectionMode = "products",
  productIds = "",
  nodeId = "",
  title,
  slidesToShow = 4,
  slidesToScroll = 1,
  autoplay = false,
  infinite = false,
  showDots = false,
  speed = 300,
  className,
}) => {
  const [products, setProducts] = useState<ShopperProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const client = getEpccImplicitClient();

        if (selectionMode === "node" && nodeId?.trim()) {
          const nodeResponse = await client.ShopperCatalog.Nodes.GetNodeProducts(
            { nodeId: nodeId.trim() },
          );
          const ids = nodeResponse?.data?.map((p: any) => p.id).filter(Boolean).join(",");
          if (ids) {
            const response = await client.ShopperCatalog.Products.With([
              "main_image",
              "files",
              "component_products",
            ])
              .Filter({ in: { id: ids } })
              .All();
            setProducts(processResult(response));
          }
        } else if (selectionMode === "products" && productIds?.trim()) {
          const ids = productIds
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
            .join(",");
          if (ids) {
            const response = await client.ShopperCatalog.Products.With([
              "main_image",
              "files",
              "component_products",
            ])
              .Filter({ in: { id: ids } })
              .All();
            setProducts(processResult(response));
          }
        }
      } catch (err) {
        console.error("PlasmicProductCarousel: error fetching products", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectionMode, productIds, nodeId]);

  const NextArrow = (props: any) => (
    <ChevronRightIcon
      onClick={props.onClick}
      className="w-8 h-8 text-gray-600 absolute top-1/2 transform -translate-y-1/2 -right-6 z-20 cursor-pointer hover:text-gray-800"
    />
  );

  const PrevArrow = (props: any) => (
    <ChevronLeftIcon
      onClick={props.onClick}
      className="w-8 h-8 text-gray-600 absolute top-1/2 transform -translate-y-1/2 -left-6 z-20 cursor-pointer hover:text-gray-800"
    />
  );

  const settings = {
    dots: showDots,
    infinite,
    speed,
    slidesToShow,
    slidesToScroll,
    autoplay,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: Math.min(3, slidesToShow), dots: showDots } },
      { breakpoint: 600, settings: { slidesToShow: 1, dots: showDots } },
    ],
  };

  if (loading) {
    return (
      <div className="xl:max-w-7xl xl:p-0 mx-auto max-w-full p-8">
        <div className="flex gap-4 animate-pulse">
          {Array.from({ length: slidesToShow }).map((_, i) => (
            <div key={i} className="flex-1 h-64 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!products.length) {
    return null;
  }

  return (
    <div className={className ?? "xl:max-w-7xl xl:p-0 mx-auto max-w-full p-8"}>
      {title && (
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">{title}</h2>
      )}
      <Slider {...settings}>
        {products.map((product, i) => (
          <ProductCard key={`${product.response.id}-${i}`} product={product} />
        ))}
      </Slider>
    </div>
  );
};

function processResult(
  page: ShopperCatalogResourcePage<ProductResponse>,
): ShopperProduct[] {
  return page.data.map((product) => {
    const mainImage = page.included?.main_images
      ? (getMainImageForProductResponse(product, page.included.main_images) ?? null)
      : null;
    const otherImages = page.included?.files
      ? (getOtherImagesForProductResponse(product, page.included.files) ?? [])
      : [];
    return { kind: "simple-product", response: product, main_image: mainImage, otherImages };
  });
}

export default PlasmicProductCarousel;
