"use client";

import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import ProductCard from "../builder-io/blocks/ProductGrid/ProductCard";
import Slider from "react-slick";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import {
  ProductResponse,
  ShopperCatalogResourcePage,
} from "@elasticpath/js-sdk";
import { ShopperProduct } from "../../react-shopper-hooks";
import {
  getMainImageForProductResponse,
  getOtherImagesForProductResponse,
} from "../../lib/file-lookup";
import { getEpccImplicitClient } from "../../lib/epcc-implicit-client";

interface RecommendationCarouselProps {
  skus: string[];
  title?: string;
}

const RecommendationCarousel = ({
  skus,
  title,
}: RecommendationCarouselProps): ReactElement | null => {
  const [products, setProducts] = useState<any>();

  useEffect(() => {
    async function fetchProducts() {
      if (skus && skus.length > 0) {
        const client = getEpccImplicitClient();
        const response = await client.ShopperCatalog.Products.With([
          "main_image",
          "files",
          "component_products",
        ])
          .Filter({
            in: { sku: skus.join(",") },
          })
          .All();
        const products = processResult(response);
        setProducts(products);
      } else {
        setProducts([]);
      }
    }
    fetchProducts();
  }, [skus]);

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
    dots: true,
    infinite: false,
    speed: 300,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: false,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          dots: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          dots: true,
        },
      },
    ],
  };

  if (!skus || skus.length === 0) return null;

  return (
    <div className="mt-6">
      {title && <div className="text-2xl font-bold p-3">{title}</div>}
      <Slider {...settings} className="xl:max-w-7xl max-w-full">
        {products &&
          products.data.map((product: any, i: number) => (
            <ProductCard key={`${product.id}-${i}`} product={product} />
          ))}
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

export default RecommendationCarousel;
