"use client";
import type { SimpleProduct } from "../../react-shopper-hooks";
import {
  SimpleProductProvider,
  useAuthedAccountMember,
  useCart,
  useSimpleProduct,
} from "../../react-shopper-hooks";
import ProductCarousel from "./carousel/ProductCarousel";
import ProductSummary from "./ProductSummary";
import ProductDetails from "./ProductDetails";
import { StatusButton } from "../button/StatusButton";
import PersonalisedInfo from "./PersonalisedInfo";
import ProductHighlights from "./ProductHighlights";
import Reviews from "../reviews/yotpo/Reviews";
import { ResourcePage, SubscriptionOffering } from "@elasticpath/js-sdk";
import SubscriptionOfferPlans from "./SubscriptionOfferPlans";
import { toast } from "react-toastify";
import ProductExtensions from "./ProductExtensions";
import { useState, useEffect, useRef } from "react";
import QuantitySelector from "./QuantitySelector";
import StoreLocator from "./StoreLocator";
import { Content as BuilderContent } from "@builder.io/sdk-react";
import { cmsConfig } from "../../lib/resolve-cms-env";
import { builder } from "@builder.io/sdk";
import { builderComponent } from "../../components/builder-io/BuilderComponents";
import { RecommendedProducts } from "../recommendations/RecommendationProducts";
import ProductRelationship from "./related-products/ProductRelationship";
import { calculateContractItemPrice } from "../../services/contract-price-calculator";
import { getCurrentCartContract } from "../contracts/actions";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");
import moment from "moment";
import Link from "next/link";

interface ISimpleProductDetail {
  simpleProduct: SimpleProduct;
  offerings: ResourcePage<SubscriptionOffering, never>;
  content: any;
  relationship: any[];
  purchaseHistory: any;
  initialPricing?: {
    priceData: {
      amount: number;
      currency: string;
      includes_tax?: boolean;
      breakdown?: any;
      error?: boolean;
    } | null;
    isLoading: boolean;
  } | null;
  contractId?: string | null;
}

function SimpleProductDetail({
  simpleProduct,
  offerings,
  content,
  relationship,
  purchaseHistory,
  initialPricing,
  contractId,
}: ISimpleProductDetail): JSX.Element {
  return (
    <SimpleProductProvider simpleProduct={simpleProduct}>
      <SimpleProductContainer
        offerings={offerings}
        content={content}
        relationship={relationship}
        purchaseHistory={purchaseHistory}
        initialPricing={initialPricing}
        contractId={contractId}
      />
    </SimpleProductProvider>
  );
}

function SimpleProductContainer({
  offerings,
  content,
  relationship,
  purchaseHistory,
  initialPricing,
  contractId,
}: {
  offerings: any;
  content: any;
  relationship: any[];
  purchaseHistory: any;
  initialPricing?: {
    priceData: {
      amount: number;
      currency: string;
      includes_tax?: boolean;
      breakdown?: any;
      error?: boolean;
    } | null;
    isLoading: boolean;
  } | null;
  contractId?: string | null;
}): JSX.Element {
  const { enableBuilderIO } = cmsConfig;
  const { product } = useSimpleProduct() as any;
  const { useScopedAddProductToCart, useScopedAddSubscriptionItemToCart } =
    useCart();
  const { mutate: mutateAddItem, isPending: isPendingAddItem } =
    useScopedAddProductToCart();
  const {
    mutate: mutateAddSubscriptionItem,
    isPending: isPendingSubscriptionItem,
  } = useScopedAddSubscriptionItemToCart();
  const [quantity, setQuantity] = useState<number>(1);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  // Add states for dynamic pricing, initialized with server-side data if available
  const [priceData, setPriceData] = useState<{
    amount: number;
    currency: string;
    includes_tax?: boolean;
    breakdown?: any;
    error?: boolean;
  } | null>(initialPricing?.priceData || null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(
    initialPricing?.isLoading || false,
  );
  const [selectedContractId] = useState<string | null>(contractId || null);

  // Add debounce timer ref
  const priceUpdateTimer = useRef<NodeJS.Timeout | null>(null);

  const { main_image, response, otherImages } = product;
  const { extensions } = response.attributes;
  const {
    id,
    meta: { original_display_price },
  } = response;
  const enableClickAndCollect =
    process.env.NEXT_PUBLIC_ENABLE_CLICK_AND_COLLECT === "true";

  // Calculate price when quantity changes (but skip initial calculation if initialPricing is provided)
  useEffect(() => {
    // Only calculate price if we have a selected product and either:
    // 1. We don't have initialPricing, or
    // 2. Quantity has changed from the initial value of 1
    if (
      !response?.id ||
      (initialPricing && quantity === 1 && initialPricing.priceData)
    )
      return;

    setIsLoadingPrice(true);

    // Clear existing timer
    if (priceUpdateTimer.current) {
      clearTimeout(priceUpdateTimer.current);
    }

    // Set new timer for debouncing
    priceUpdateTimer.current = setTimeout(async () => {
      try {
        // The contract ID needs to be a string or undefined (not null)
        const priceResponse = await calculateContractItemPrice(
          response.id,
          quantity,
          selectedContractId || undefined,
        );

        if (priceResponse.success && priceResponse.data) {
          setPriceData({
            ...priceResponse.data.price,
            breakdown: priceResponse.data.breakdown || undefined,
            error: false,
          });
        } else {
          // Default to the product's base price if contract pricing fails
          setPriceData({
            amount: response.meta.display_price.with_tax.amount,
            currency: response.meta.display_price.with_tax.currency,
            error: false,
          });
        }
      } catch (error) {
        console.error("Error calculating price:", error);
        // Fall back to the product's base price
        setPriceData({
          amount: response.meta.display_price.with_tax.amount,
          currency: response.meta.display_price.with_tax.currency,
          error: false,
        });
      } finally {
        setIsLoadingPrice(false);
      }
    }, 300); // 300ms debounce

    // Cleanup timer on unmount
    return () => {
      if (priceUpdateTimer.current) {
        clearTimeout(priceUpdateTimer.current);
      }
    };
  }, [quantity, response?.id, selectedContractId, initialPricing]);

  const handleOverlay = (
    event: React.FormEvent<HTMLFormElement>,
    value: boolean,
  ) => {
    event.preventDefault();
    setIsOverlayOpen(value);
  };

  // Format price helper function
  const formatPrice = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100); // Assuming the amount is in cents
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data: any = {
      custom_inputs: {
        additional_information: [],
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
      Object.keys(response?.attributes?.custom_inputs).map((input) => {
        const value = formData.get(input);
        if (value) {
          const info = {
            key: response.attributes.custom_inputs[input].name,
            value,
          };
          data.custom_inputs.additional_information.push(info);
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
          <form onSubmit={(e: any) => handleSubmit(e)}>
            {original_display_price && (
              <span className="uppercase inline-flex items-center rounded-sm bg-white px-2 py-1 text-sm font-medium text-pink-700 ring-1 ring-inset ring-pink-700 mb-6 mr-2">
                {response.meta.sale_id}
              </span>
            )}
            <div className="flex flex-col gap-6 md:gap-10">
              <input
                type="text"
                name="delivery_mode"
                value="Home Delivery"
                hidden
                readOnly
              ></input>

              <ProductSummary
                product={response}
                offerings={offerings}
                dynamicPricing={{
                  priceData,
                  isLoading: isLoadingPrice,
                }}
              />
              {offerings && offerings.data.length > 0 && (
                <SubscriptionOfferPlans
                  offerings={offerings}
                  product={response}
                />
              )}
              <PersonalisedInfo
                custom_inputs={response.attributes?.custom_inputs}
              />
              <QuantitySelector quantity={quantity} setQuantity={setQuantity} />
              <StatusButton
                type="submit"
                status={
                  isPendingAddItem ||
                  isPendingSubscriptionItem ||
                  isLoadingPrice
                    ? "loading"
                    : "idle"
                }
                disabled={isLoadingPrice}
              >
                ADD TO CART
              </StatusButton>
              {offerings?.data?.length == 0 && enableClickAndCollect && (
                <StatusButton
                  type="submit"
                  onClick={(event: any) => handleOverlay(event, true)}
                  className="uppercase"
                  disabled={isLoadingPrice}
                >
                  Click & Collect
                </StatusButton>
              )}
              {purchaseHistory?.data?.length > 0 && (
                <div>
                  <div className="text-base font-medium uppercase lg:text-lg text-gray-800 mb-4">
                    Previous Purchase Order History
                  </div>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border border-gray-300 px-4 py-2">
                          Purchase Date
                        </th>
                        <th className="border border-gray-300 px-4 py-2">
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseHistory?.data
                        .slice(0, 3)
                        .map((order: any, index: number) => (
                          <tr key={index} className="border border-gray-300">
                            <td className="border border-gray-300 px-4 py-2">
                              <Link
                                href={`/account/orders/${order.order_id}`}
                                className="hover:text-brand-primary hover:underline"
                              >
                                {moment(
                                  order.meta.timestamps.created_at,
                                  moment.ISO_8601,
                                  true,
                                ).format("DD MMM YYYY HH:mm:ss")}
                              </Link>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {order.quantity}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
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
      {enableBuilderIO && (
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

export default SimpleProductDetail;
