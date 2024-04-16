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

export const VariationProductDetail = ({
  variationProduct,
  offerings
}: {
  variationProduct: VariationProduct;
  offerings: ResourcePage<SubscriptionOffering, never>
}): JSX.Element => {
  return (
    <VariationProductProvider variationProduct={variationProduct}>
      <VariationProductContainer offerings={offerings} />
    </VariationProductProvider>
  );
};

export function VariationProductContainer({ offerings }: { offerings: ResourcePage<SubscriptionOffering, never> }): JSX.Element {
  const { product, selectedOptions } = useVariationProduct() as any;
  const { useScopedAddProductToCart } = useCart();
  const { mutate, isPending } = useScopedAddProductToCart();

  const { response, main_image, otherImages } = product;
  const { extensions } = response.attributes;
  const {
    meta: { original_display_price },
  } = response;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data: any = {
      custom_inputs: {
        additional_information: [],
        options: []
      }
    }
    {
      response?.attributes?.custom_inputs && Object.keys(response.attributes.custom_inputs).map(input => {
        const value = formData.get(input)
        if (value) {
          const value = formData.get(input)
          if (value) {
            const info = {
              key: response.attributes.custom_inputs[input].name,
              value
            }
            data.custom_inputs.additional_information.push(info)
          }
        }
      })
    }

    const options: any = []
    Object.keys(selectedOptions).map((key: any) => {
      const optionId = selectedOptions[key]
      if (optionId) {
        const variation = product.baseProduct.meta.variations?.find((variation: any) => variation.id === key)
        if (variation) {
          const optionValue = variation?.options.find((option: any) => option.id === optionId)
          if (optionValue) {
            options.push(optionValue.description)
          }
        }
      }
    })

    if (options.length > 0) {
      data.custom_inputs.options = options.join("/")
    }

    mutate({ productId: response.id, quantity: 1, data })
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
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
              <ProductSummary product={response} offerings={offerings} />
              <ProductVariations />
              <PersonalisedInfo custom_inputs={response.attributes.custom_inputs} />
              <StatusButton
                disabled={product.kind === "base-product"}
                type="submit"
                status={isPending ? "loading" : "idle"}
              >
                ADD TO CART
              </StatusButton>
              <ProductDetails product={response} />
              {extensions && <ProductHighlights extensions={extensions} />}
            </div>
          </form>
        </div>
      </div>
      <Reviews product={response} />
    </div>
  );
}
