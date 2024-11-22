"use client";
import {
  useCart,
  useVariationProduct,
  VariationProduct,
  VariationProductProvider,
} from "../../../react-shopper-hooks";
import ProductVariations from "./ProductVariations";
import ProductCarousel from "../carousel/ProductCarousel";
import ProductSummary from "../ProductSummary";
import ProductDetails from "../ProductDetails";
import { StatusButton } from "../../button/StatusButton";
import PersonalisedInfo from "../PersonalisedInfo";
import ProductHighlights from "../ProductHighlights";
import Reviews from "../../reviews/yotpo/Reviews";
import { ResourcePage, SubscriptionOffering } from "@moltin/sdk";
import SubscriptionOfferPlans from "../SubscriptionOfferPlans";
import { toast } from "react-toastify";
import ProductExtensions from "../ProductExtensions";
import { useState } from "react";
import QuantitySelector from "../QuantitySelector";
import StoreLocator from "../StoreLocator";
import { Content as BuilderContent } from "@builder.io/sdk-react";
import { cmsConfig } from "../../../lib/resolve-cms-env";
import { builder } from "@builder.io/sdk";
import { builderComponent } from "../../../components/builder-io/BuilderComponents";
import { RecommendedProducts } from "../../recommendations/RecommendationProducts";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

export const VariationProductDetail = ({
  variationProduct,
  offerings,
  content,
}: {
  variationProduct: VariationProduct;
  offerings: ResourcePage<SubscriptionOffering, never>;
  content: any;
}): JSX.Element => {
  return (
    <VariationProductProvider variationProduct={variationProduct}>
      <VariationProductContainer offerings={offerings} content={content} />
    </VariationProductProvider>
  );
};

export function VariationProductContainer({
  offerings,
  content,
}: {
  offerings: ResourcePage<SubscriptionOffering, never>;
  content: any;
}): JSX.Element {
  const { enableBuilderIO } = cmsConfig;
  const { product, selectedOptions } = useVariationProduct() as any;
  const { useScopedAddProductToCart, useScopedAddSubscriptionItemToCart } =
    useCart();
  const { mutate: mutateAddItem, isPending: isPendingAddItem } =
    useScopedAddProductToCart();
  const {
    mutate: mutateAddSubscriptionItem,
    isPending: isPendingSubscriptionItem,
  } = useScopedAddSubscriptionItemToCart();

  const { response, main_image, otherImages } = product;
  const { extensions } = response.attributes;
  const {
    id,
    meta: { original_display_price },
  } = response;
  const [quantity, setQuantity] = useState<number>(1);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const enableClickAndCollect =
    process.env.NEXT_PUBLIC_ENABLE_CLICK_AND_COLLECT === "true";

  const handleOverlay = (
    event: React.FormEvent<HTMLFormElement>,
    value: boolean,
  ) => {
    event.preventDefault();
    setIsOverlayOpen(value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data: any = {
      custom_inputs: {
        additional_information: [],
        options: [],
      },
    };
    if (enableClickAndCollect) {
      const deliveryMode = formData.get("delivery_mode");
      if (deliveryMode) {
        data.custom_inputs.location = {};
        data.custom_inputs.location.delivery_mode = deliveryMode;
      }
      const locationCode = formData.get("location_code");
      const locationName = formData.get("location_name");
      if (locationCode && locationName) {
        data.custom_inputs.location.location_name = locationName;
        data.custom_inputs.location.location_code = locationCode;
      }
    }

    response?.attributes?.custom_inputs &&
      Object.keys(response.attributes.custom_inputs).map((input) => {
        const value = formData.get(input);
        if (value) {
          const value = formData.get(input);
          if (value) {
            const info = {
              key: response.attributes.custom_inputs[input].name,
              value,
            };
            data.custom_inputs.additional_information.push(info);
          }
        }
      });

    if (response?.attributes?.extensions?.["products(vendor)"]) {
      const info = {
        key: "Fulfilled By",
        value:
          response?.attributes?.extensions?.["products(vendor)"]?.vendor_name,
      };
      info.value && data.custom_inputs.additional_information.push(info);
      data.custom_inputs.vendor_store_id =
        response?.attributes?.extensions?.["products(vendor)"]?.vendor_store_id;
    }

    const options: any = [];
    Object.keys(selectedOptions).map((key: any) => {
      const optionId = selectedOptions[key];
      if (optionId) {
        const variation = product.baseProduct.meta.variations?.find(
          (variation: any) => variation.id === key,
        );
        if (variation) {
          const optionValue = variation?.options.find(
            (option: any) => option.id === optionId,
          );
          if (optionValue) {
            options.push(optionValue.description);
          }
        }
      }
    });

    if (options.length > 0) {
      data.custom_inputs.options = options.join(" / ");
    }

    const price_type = formData.get("price_type")?.toString() || "";
    if (price_type === "" || price_type === "one_time") {
      mutateAddItem(
        { productId: response.id, quantity, data },
        {
          onSuccess: () => {
            setIsOverlayOpen(false);
          },
          onError: (response: any) => {
            if (response?.errors) {
              toast.error(response?.errors?.[0].detail, {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: false,
              });
            }
          },
        },
      );
    } else {
      const planId = formData.get("plan")?.toString() || "";
      if (main_image?.link?.href) {
        data.custom_inputs.image_url = main_image?.link?.href;
      }
      mutateAddSubscriptionItem({
        data: {
          type: "subscription_item",
          id: price_type,
          quantity,
          subscription_configuration: {
            plan: planId,
          },
          custom_inputs: data.custom_inputs,
        },
      });
    }
  };

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 mt-10">
        <div className="basis-full lg:basis-1/2">
          {main_image && (
            <ProductCarousel images={otherImages} mainImage={main_image} />
          )}
        </div>
        <div className="basis-full lg:basis-1/2">
          {original_display_price && (
            <span className="uppercase inline-flex items-center rounded-sm bg-white px-2 py-1 text-sm font-medium text-pink-700 ring-1 ring-inset ring-pink-700 mb-6 mr-2">
              {response.meta.sale_id}
            </span>
          )}
          <form onSubmit={(e: any) => handleSubmit(e)}>
            <div className="flex flex-col gap-4 md:gap-6">
              <input
                type="text"
                name="delivery_mode"
                value="Home Delivery"
                hidden
                readOnly
              ></input>

              <ProductSummary product={response} offerings={offerings} />
              <ProductVariations />
              {offerings && offerings.data.length > 0 && (
                <SubscriptionOfferPlans
                  offerings={offerings}
                  product={response}
                />
              )}
              <PersonalisedInfo
                custom_inputs={response.attributes.custom_inputs}
              />
              <QuantitySelector quantity={quantity} setQuantity={setQuantity} />
              <StatusButton
                disabled={product.kind === "base-product"}
                type="submit"
                status={
                  isPendingAddItem || isPendingSubscriptionItem
                    ? "loading"
                    : "idle"
                }
              >
                ADD TO CART
              </StatusButton>
              {offerings?.data?.length == 0 && enableClickAndCollect && (
                <StatusButton
                  disabled={product.kind === "base-product"}
                  type="submit"
                  onClick={(event: any) => handleOverlay(event, true)}
                  className="uppercase"
                >
                  Click & Collect
                </StatusButton>
              )}

              <ProductDetails product={response} />
              {extensions && <ProductHighlights extensions={extensions} />}
              {extensions && <ProductExtensions extensions={extensions} />}
            </div>
          </form>
          {isOverlayOpen && (
            <StoreLocator
              onClose={() => setIsOverlayOpen(false)}
              product={response}
              handleSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
      <RecommendedProducts productId={id} />
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
  );
}
