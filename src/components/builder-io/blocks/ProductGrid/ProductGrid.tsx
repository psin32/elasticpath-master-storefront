"use client";

import { FC, useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { ProductResponse, ShopperCatalogResourcePage } from "@moltin/sdk";
import { ShopperProduct } from "../../../../react-shopper-hooks";
import {
  getMainImageForProductResponse,
  getOtherImagesForProductResponse,
} from "../../../../lib/file-lookup";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { getProductByIds } from "../../../../services/products";
import { getEpccImplicitClient } from "../../../../lib/epcc-implicit-client";

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
            return (
              <ProductCard key={`${hit.response.id}-${i}`} product={hit} />
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
