"use client";

import { FC, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Slider from "react-slick";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useCart } from "../../react-shopper-hooks";
import { StatusButton } from "../button/StatusButton";
import { getCookie } from "cookies-next";
import { COOKIE_PREFIX_KEY } from "../../lib/resolve-cart-env";
import { sampleProducts, SampleProduct } from "../../lib/sample-products";

interface SampleProductCarouselProps {
  linkProps?: {
    link: string;
    text: string;
  };
}

const SampleProductCarousel: FC<SampleProductCarouselProps> = ({
  linkProps,
}) => {
  const { useScopedAddCustomItemToCart } = useCart();
  const { mutate: addCustomItem, isPending } = useScopedAddCustomItemToCart();
  const [addingItems, setAddingItems] = useState<Record<string, boolean>>({});
  const [currency, setCurrency] = useState<string>("USD");

  useEffect(() => {
    // Get currency from cookie
    const currencyInCookie = getCookie(
      `${COOKIE_PREFIX_KEY}_ep_currency`,
    ) as string;
    setCurrency(currencyInCookie || "USD");
  }, []);

  const handleAddToCart = (product: SampleProduct) => {
    setAddingItems((prev) => ({ ...prev, [product.id]: true }));

    const customItemData = {
      type: "custom_item" as const,
      name: product.name,
      description: product.description,
      sku: product.sku,
      quantity: 1,
      price: {
        amount: product.amount,
        includes_tax: false,
      },
      custom_inputs: {
        image_url: product.image,
        additional_information: product.additional_information,
      },
    };

    addCustomItem(customItemData, {
      onSuccess: () => {
        setAddingItems((prev) => ({ ...prev, [product.id]: false }));
      },
      onError: () => {
        setAddingItems((prev) => ({ ...prev, [product.id]: false }));
      },
    });
  };

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

  return (
    <div className="max-w-7xl my-0 mx-auto">
      <div className="flex justify-between flex-wrap gap-2 mb-4">
        {linkProps && (
          <Link
            className="text-sm md:text-md lg:text-lg font-bold hover:cursor-pointer"
            href={linkProps.link}
          >
            <span className="flex items-center gap-2 font-bold hover:text-brand-primary hover:cursor-pointer">
              {linkProps.text} <ArrowRightIcon className="h-4 w-4" />
            </span>
          </Link>
        )}
      </div>
      <Slider {...settings} className="xl:max-w-7xl max-w-full">
        {sampleProducts.map((product) => (
          <div key={product.id} className="px-2">
            <div className="relative group border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <Link href={`/products/${product.slug}`}>
                <div className="aspect-square block w-full overflow-hidden rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100">
                  <div className="relative w-full h-full rounded-lg text-center animate-fadeIn transition duration-300 ease-in-out group-hover:scale-105">
                    <Image
                      alt={product.name}
                      src={product.image}
                      className="rounded-lg"
                      sizes="(max-width: 200px)"
                      fill
                      style={{
                        objectFit: "cover",
                        objectPosition: "center",
                      }}
                    />
                  </div>
                </div>
                <p className="pointer-events-none mt-2 block truncate text-sm font-medium text-gray-900">
                  {product.name}
                </p>
                <div className="pointer-events-none text-xs text-gray-500 mt-1">
                  SKU: {product.sku}
                </div>
                <div className="pointer-events-none text-sm font-medium text-gray-500 flex items-center gap-2">
                  {product.originalPrice && (
                    <span className="line-through text-gray-400">
                      {new Intl.NumberFormat("en", {
                        style: "currency",
                        currency: currency,
                      }).format((product.originalPrice || 0) / 100)}
                    </span>
                  )}
                  <span className="text-gray-900">
                    {new Intl.NumberFormat("en", {
                      style: "currency",
                      currency: currency,
                    }).format((product.amount || 0) / 100)}
                  </span>
                </div>
              </Link>
              <div className="mt-3">
                <StatusButton
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToCart(product);
                  }}
                  status={addingItems[product.id] ? "loading" : "idle"}
                  className="w-full p-2 text-sm"
                  variant="primary"
                >
                  Add to Cart
                </StatusButton>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default SampleProductCarousel;
