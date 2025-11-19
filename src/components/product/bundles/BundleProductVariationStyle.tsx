"use client";
import { useBundle } from "../../../react-shopper-hooks";
import { useState, useEffect } from "react";
import clsx from "clsx";
import { ProductComponentOption, ProductResponse } from "@elasticpath/js-sdk";
import Image from "next/image";
import NoImage from "../../NoImage";
import Price from "../Price";
import StrikePrice from "../StrikePrice";
import { getChildProductsByParentId } from "../../../services/products";
import { getEpccImplicitClient } from "../../../lib/epcc-implicit-client";
import { getMainImageForProductResponse } from "../../../lib/file-lookup";

interface BundleProductVariationStyleProps {
  product: any;
  onProductSelect: (productId: string) => void;
}

interface ProductTile {
  id: string;
  product: ProductResponse;
  mainImage: any;
  display_price: any;
  original_display_price: any;
}

export default function BundleProductVariationStyle({
  onProductSelect,
}: BundleProductVariationStyleProps): JSX.Element {
  const {
    components,
    componentProducts,
    componentProductImages,
    setComponentProductImages,
    setComponentProducts,
  } = useBundle();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [allProducts, setAllProducts] = useState<ProductTile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch all products including child products for parent options
  useEffect(() => {
    const fetchAllProducts = async () => {
      setLoading(true);
      const client = getEpccImplicitClient();
      const products: ProductTile[] = [];
      const newImages: any[] = [];
      const newProducts: ProductResponse[] = [];

      // Iterate through all components and their options
      for (const [componentKey, component] of Object.entries(components)) {
        const typedComponent = component as any;

        for (const option of typedComponent.options) {
          const shouldSubstituteWithChild =
            (option as any)?.product_should_be_substituted_with_child === true;

          if (shouldSubstituteWithChild) {
            // Fetch child products for parent product
            try {
              const childProductsResponse = await getChildProductsByParentId(
                option.id,
                client,
              );

              // Add child product images to context if not already present
              if (childProductsResponse.included?.main_images) {
                for (const img of childProductsResponse.included.main_images) {
                  if (
                    !componentProductImages.find(
                      (existingImg) => existingImg.id === img.id,
                    )
                  ) {
                    newImages.push(img);
                  }
                }
              }
              if (childProductsResponse.included?.files) {
                for (const file of childProductsResponse.included.files) {
                  if (
                    !componentProductImages.find(
                      (existingImg) => existingImg.id === file.id,
                    )
                  ) {
                    newImages.push(file);
                  }
                }
              }

              // Add child products to context if not already present
              for (const childProduct of childProductsResponse.data) {
                if (
                  !componentProducts.find(
                    (existingProduct) => existingProduct.id === childProduct.id,
                  )
                ) {
                  newProducts.push(childProduct);
                }
              }

              // Add each child product as a tile
              for (const childProduct of childProductsResponse.data) {
                // Get main image from included main_images or fallback to componentProductImages
                const mainImages =
                  childProductsResponse.included?.main_images || [];
                let mainImage = getMainImageForProductResponse(
                  childProduct,
                  mainImages,
                );

                // Fallback to componentProductImages if not found in included
                if (!mainImage) {
                  const mainImageId =
                    childProduct.relationships?.main_image?.data?.id;
                  if (mainImageId) {
                    mainImage = componentProductImages.find(
                      (img) => img.id === mainImageId,
                    );
                  }
                }

                products.push({
                  id: childProduct.id,
                  product: childProduct,
                  mainImage: mainImage || null,
                  display_price: childProduct.meta?.display_price,
                  original_display_price:
                    childProduct.meta?.original_display_price,
                });
              }
            } catch (error) {
              console.error(
                `Error fetching child products for parent ${option.id}:`,
                error,
              );
            }
          } else {
            // Add regular option product as a tile
            const optionProduct = componentProducts.find(
              (p: ProductResponse) => p.id === option.id,
            );

            if (optionProduct) {
              // Get main image from componentProductImages
              const mainImageId =
                optionProduct.relationships?.main_image?.data?.id;
              const mainImage = mainImageId
                ? componentProductImages.find(
                    (img) => img.id === mainImageId,
                  ) ?? null
                : null;

              products.push({
                id: optionProduct.id,
                product: optionProduct,
                mainImage,
                display_price: optionProduct.meta?.display_price,
                original_display_price:
                  optionProduct.meta?.original_display_price,
              });
            }
          }
        }
      }

      // Add new images to componentProductImages if any were found
      if (newImages.length > 0) {
        setComponentProductImages((prev) => [...prev, ...newImages]);
      }

      // Add new products to componentProducts if any were found
      if (newProducts.length > 0) {
        setComponentProducts((prev) => [...prev, ...newProducts]);
      }

      setAllProducts(products);
      setLoading(false);
    };

    fetchAllProducts();
  }, [
    components,
    componentProducts,
    componentProductImages,
    setComponentProductImages,
    setComponentProducts,
  ]);

  // Auto-select the first product when products are loaded and none is selected
  useEffect(() => {
    if (allProducts.length > 0 && !selectedProductId && !loading) {
      const firstProductId = allProducts[0].id;
      setSelectedProductId(firstProductId);
      onProductSelect(firstProductId);
    }
  }, [allProducts, selectedProductId, loading, onProductSelect]);

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    onProductSelect(productId);
  };

  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {allProducts.map((productTile) => {
        const isSelected = selectedProductId === productTile.id;

        return (
          <button
            type="button"
            key={productTile.id}
            onClick={() => handleProductSelect(productTile.id)}
            className={clsx(
              "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
              isSelected
                ? "border-brand-primary bg-brand-primary/5"
                : "border-gray-300 hover:border-gray-400",
            )}
          >
            {productTile.mainImage?.link?.href ? (
              <div className="relative w-20 h-20">
                <Image
                  src={productTile.mainImage.link.href}
                  alt={productTile.product.attributes?.name || ""}
                  fill
                  className="rounded object-contain"
                  sizes="(max-width: 80px)"
                />
              </div>
            ) : (
              <div className="w-20 h-20 flex items-center justify-center">
                <NoImage />
              </div>
            )}
            <span className="text-sm font-medium text-center">
              {(() => {
                // Check if product has variation information
                const variationMatrix =
                  productTile.product.meta?.variation_matrix;
                const variations = productTile.product.meta?.variations;

                if (
                  variationMatrix &&
                  variations &&
                  Array.isArray(variations)
                ) {
                  // Extract variation option names/descriptions from variation_matrix
                  const variationNames: string[] = [];
                  Object.entries(variationMatrix).forEach(
                    ([variationId, optionId]: [string, any]) => {
                      const variation = variations.find(
                        (v: any) => v.id === variationId,
                      );
                      if (variation) {
                        const option = variation.options?.find(
                          (opt: any) => opt.id === optionId,
                        );
                        if (option) {
                          // Prefer description, fallback to name
                          const optionText = option.description || option.name;
                          if (optionText) {
                            variationNames.push(optionText);
                          }
                        }
                      }
                    },
                  );
                  // Return variation name(s) if found, otherwise fall back to product name
                  if (variationNames.length > 0) {
                    return variationNames.join(" / ");
                  }
                }
                // Fall back to product name
                return productTile.product.attributes?.name || productTile.id;
              })()}
            </span>
            {productTile.display_price && (
              <div className="flex flex-col items-center gap-1">
                {productTile.original_display_price && (
                  <StrikePrice
                    price={
                      productTile.original_display_price?.without_tax
                        ?.formatted ||
                      productTile.original_display_price?.with_tax?.formatted
                    }
                    currency={
                      productTile.original_display_price?.without_tax
                        ?.currency ||
                      productTile.original_display_price?.with_tax?.currency
                    }
                    size="text-xs"
                  />
                )}
                <Price
                  price={
                    productTile.display_price?.without_tax?.formatted ||
                    productTile.display_price?.with_tax?.formatted
                  }
                  currency={
                    productTile.display_price?.without_tax?.currency ||
                    productTile.display_price?.with_tax?.currency
                  }
                  original_display_price={productTile.original_display_price}
                  size="text-sm"
                />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
