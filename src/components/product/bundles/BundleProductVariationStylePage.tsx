"use client";
import { Form, Formik } from "formik";
import {
  BundleProduct,
  BundleProductProvider,
  useBundle,
  useCart,
} from "../../../react-shopper-hooks";
import { useCallback, useMemo, useState } from "react";
import ProductCarousel from "../carousel/ProductCarousel";
import PersonalisedInfo from "../PersonalisedInfo";
import { AddToCartButton } from "../AddToCartButton";
import ProductDetails from "../ProductDetails";
import ProductHighlights from "../ProductHighlights";
import ProductExtensions from "../ProductExtensions";
import Reviews from "../../reviews/yotpo/Reviews";
import { ResourcePage, SubscriptionOffering } from "@elasticpath/js-sdk";
import { Content as BuilderContent } from "@builder.io/sdk-react";
import { cmsConfig } from "../../../lib/resolve-cms-env";
import { builder } from "@builder.io/sdk";
import { builderComponent } from "../../builder-io/BuilderComponents";
import ProductRelationship from "../related-products/ProductRelationship";
import BundleProductVariationStyle from "./BundleProductVariationStyle";
import Price from "../Price";
import StrikePrice from "../StrikePrice";
import {
  getMainImageForProductResponse,
  getOtherImagesForProductResponse,
} from "../../../lib/file-lookup";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

interface IBundleProductVariationStylePage {
  bundleProduct: BundleProduct;
  offerings: ResourcePage<SubscriptionOffering, never>;
  content: any;
  relationship: any[];
}

const BundleProductVariationStylePageDetail = ({
  bundleProduct,
  content,
  relationship,
}: IBundleProductVariationStylePage): JSX.Element => {
  return (
    <BundleProductProvider bundleProduct={bundleProduct}>
      <BundleProductVariationStylePageContainer
        content={content}
        relationship={relationship}
      />
    </BundleProductProvider>
  );
};

function BundleProductVariationStylePageContainer({
  content,
  relationship,
}: {
  content: any;
  relationship: any[];
}): JSX.Element {
  const { enableBuilderIO } = cmsConfig;
  const {
    configuredProduct,
    components,
    componentProducts,
    componentProductImages,
  } = useBundle();
  const { useScopedAddProductToCart } = useCart();

  const { mutate: mutateProduct, isPending: isPendingProduct } =
    useScopedAddProductToCart();
  const { response, main_image, otherImages } = configuredProduct as any;
  const { extensions } = response.attributes;

  const {
    id,
    meta: { display_price },
  } = response;

  // State for selected product ID
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // Get selected product
  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    // First check in componentProducts (includes child products)
    const productInContext = componentProducts.find(
      (p: any) => p.id === selectedProductId,
    );
    if (productInContext) return productInContext;
    // Fallback to configuredProduct.componentProductResponses
    return configuredProduct.componentProductResponses.find(
      (p: any) => p.id === selectedProductId,
    );
  }, [
    selectedProductId,
    componentProducts,
    configuredProduct.componentProductResponses,
  ]);

  // Get selected product's images
  const selectedProductImages = useMemo(() => {
    if (!selectedProduct) {
      return { mainImage: main_image, otherImages: otherImages || [] };
    }

    // Get main image ID from selected product
    const mainImageId = selectedProduct.relationships?.main_image?.data?.id;

    // Get file IDs from selected product
    const fileIds =
      selectedProduct.relationships?.files?.data?.map((f: any) => f.id) || [];

    // Filter componentProductImages to only include images/files for this specific product
    const selectedMainImage = mainImageId
      ? componentProductImages.find((img: any) => img.id === mainImageId) ||
        undefined
      : undefined;

    // Get other images (files) - only those that belong to this product
    // Deduplicate by image ID to avoid showing the same image multiple times
    const imageMap = new Map<string, any>();
    componentProductImages.forEach((img: any) => {
      // Include if it's in the fileIds array (but not the main image)
      if (fileIds.includes(img.id) && img.id !== mainImageId) {
        // Only add if we haven't seen this image ID before
        if (!imageMap.has(img.id)) {
          imageMap.set(img.id, img);
        }
      }
    });

    const selectedOtherImages = Array.from(imageMap.values());

    return {
      mainImage: selectedMainImage,
      otherImages: selectedOtherImages,
    };
  }, [selectedProduct?.id, main_image, otherImages, componentProductImages]);

  const submit = useCallback(async () => {
    if (!selectedProductId) {
      return;
    }

    const data: any = {
      custom_inputs: {
        additional_information: [],
      },
    };

    mutateProduct({
      productId: selectedProductId,
      quantity: 1,
      data,
    });
  }, [selectedProductId, mutateProduct]);

  return (
    <Formik initialValues={{}} onSubmit={async () => submit()}>
      <div>
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 mt-10">
          <div className="basis-full lg:basis-1/2">
            {selectedProduct ? (
              selectedProductImages.mainImage &&
              selectedProductImages.mainImage.link ? (
                <ProductCarousel
                  key={selectedProductId}
                  images={selectedProductImages.otherImages}
                  mainImage={selectedProductImages.mainImage}
                />
              ) : (
                <div>No images available</div>
              )
            ) : (
              main_image &&
              main_image.link && (
                <ProductCarousel images={otherImages} mainImage={main_image} />
              )
            )}
          </div>
          <div className="basis-full lg:basis-1/2">
            <Form>
              <div className="flex flex-col gap-6 md:gap-10">
                {/* Show selected product details */}
                {selectedProduct ? (
                  <div>
                    <span className="text-xl font-semibold leading-[1.1] sm:text-3xl lg:text-4xl">
                      {(() => {
                        // First check for child_variations in meta
                        const childVariations = (selectedProduct.meta as any)
                          ?.child_variations;
                        if (
                          childVariations &&
                          Array.isArray(childVariations) &&
                          childVariations.length > 0
                        ) {
                          // Extract option names from child_variations
                          const variationNames: string[] = [];
                          childVariations.forEach((childVariation: any) => {
                            if (childVariation?.option?.name) {
                              variationNames.push(childVariation.option.name);
                            }
                          });
                          // Return variation names joined smartly
                          if (variationNames.length > 0) {
                            return variationNames.join(" / ");
                          }
                        }
                        // Fall back to product name
                        return (
                          selectedProduct.attributes?.name ||
                          response.attributes.name
                        );
                      })()}
                    </span>
                    <div className="text-lg mt-2">
                      {selectedProduct.attributes?.sku ||
                        response.attributes.sku}
                    </div>
                    {selectedProduct.meta?.display_price && (
                      <div className="flex items-center mt-2">
                        {selectedProduct.meta?.original_display_price && (
                          <StrikePrice
                            price={
                              selectedProduct.meta.original_display_price
                                ?.without_tax?.formatted ||
                              selectedProduct.meta.original_display_price
                                ?.with_tax?.formatted
                            }
                            currency={
                              selectedProduct.meta.original_display_price
                                ?.without_tax?.currency ||
                              selectedProduct.meta.original_display_price
                                ?.with_tax?.currency
                            }
                          />
                        )}
                        <Price
                          price={
                            selectedProduct.meta.display_price?.without_tax
                              ?.formatted ||
                            selectedProduct.meta.display_price?.with_tax
                              ?.formatted
                          }
                          currency={
                            selectedProduct.meta.display_price?.without_tax
                              ?.currency ||
                            selectedProduct.meta.display_price?.with_tax
                              ?.currency
                          }
                          original_display_price={
                            selectedProduct.meta?.original_display_price
                          }
                          size="text-2xl"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <span className="text-xl font-semibold leading-[1.1] sm:text-3xl lg:text-4xl">
                      {response.attributes.name}
                    </span>
                    <div className="text-lg mt-2">
                      {response.attributes.sku}
                    </div>
                  </div>
                )}

                <BundleProductVariationStyle
                  product={response}
                  onProductSelect={setSelectedProductId}
                />
                <PersonalisedInfo
                  custom_inputs={response.attributes?.custom_inputs}
                  formikForm={true}
                />

                <AddToCartButton
                  type="submit"
                  status={isPendingProduct ? "loading" : "idle"}
                  disabled={isPendingProduct || !selectedProductId}
                  showPrice={!!selectedProduct?.meta?.display_price}
                />

                {selectedProduct ? (
                  <>
                    <ProductDetails product={selectedProduct} />
                    {selectedProduct.attributes?.extensions && (
                      <ProductHighlights
                        extensions={selectedProduct.attributes.extensions}
                      />
                    )}
                    {selectedProduct.attributes?.extensions && (
                      <ProductExtensions
                        extensions={selectedProduct.attributes.extensions}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <ProductDetails product={response} />
                    {extensions && (
                      <ProductHighlights extensions={extensions} />
                    )}
                  </>
                )}
              </div>
            </Form>
          </div>
        </div>
        {relationship &&
          relationship.map((rel: any) => {
            return (
              <ProductRelationship
                productId={id}
                baseProductId={null}
                slug={rel.slug}
                relationship={relationship}
                key={rel.slug}
              />
            );
          })}
        {enableBuilderIO && content && (
          <BuilderContent
            model="page"
            content={content}
            apiKey={process.env.NEXT_PUBLIC_BUILDER_IO_KEY || ""}
            customComponents={builderComponent}
          />
        )}
        <Reviews product={response} />
      </div>
    </Formik>
  );
}

export default BundleProductVariationStylePageDetail;
