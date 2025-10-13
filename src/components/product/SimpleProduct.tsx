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
import { AddToCartButton } from "./AddToCartButton";
import { ResourcePage, SubscriptionOffering } from "@elasticpath/js-sdk";
import SubscriptionOfferPlans from "./SubscriptionOfferPlans";
import { toast } from "react-toastify";
import ProductExtensions from "./ProductExtensions";
import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import QuantitySelector from "./QuantitySelector";
import StoreLocator from "./StoreLocator";
import LocationInventorySelector from "./LocationInventorySelector";
import { Content as BuilderContent } from "@builder.io/sdk-react";
import { cmsConfig } from "../../lib/resolve-cms-env";
import { builder } from "@builder.io/sdk";
import { builderComponent } from "../../components/builder-io/BuilderComponents";
import { RecommendedProducts } from "../recommendations/RecommendationProducts";
import ProductRelationship from "./related-products/ProductRelationship";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");
import moment from "moment";
import Link from "next/link";
import { getInventoryDetails } from "./actions";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";

interface ISimpleProductDetail {
  simpleProduct: SimpleProduct;
  offerings: ResourcePage<SubscriptionOffering, never>;
  content: any;
  relationship: any[];
  purchaseHistory: any;
}

function SimpleProductDetail({
  simpleProduct,
  offerings,
  content,
  relationship,
  purchaseHistory,
}: ISimpleProductDetail): JSX.Element {
  return (
    <SimpleProductProvider simpleProduct={simpleProduct}>
      <SimpleProductContainer
        offerings={offerings}
        content={content}
        relationship={relationship}
        purchaseHistory={purchaseHistory}
      />
    </SimpleProductProvider>
  );
}

function SimpleProductContainer({
  offerings,
  content,
  relationship,
  purchaseHistory,
}: {
  offerings: any;
  content: any;
  relationship: any[];
  purchaseHistory: any;
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
  const [inventory, setInventory] = useState<number>(0);
  const [unlimitedStock, setUnlimitedStock] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [selectedLocationSlug, setSelectedLocationSlug] = useState<string>("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [selectedLocationName, setSelectedLocationName] = useState<string>("");
  const [locationInventory, setLocationInventory] = useState<number | null>(
    null,
  );
  const [useMultiLocation, setUseMultiLocation] = useState<boolean | null>(
    null,
  );
  const [multiLocationReady, setMultiLocationReady] = useState<boolean>(false);

  // Check cookie for multi-location inventory setting on mount
  useEffect(() => {
    const multiLocationValue = getCookie("use_multi_location_inventory");
    // Default to true (enabled) if cookie doesn't exist
    const isEnabled = multiLocationValue !== "false";
    setUseMultiLocation(isEnabled);

    // If multi-location is disabled, mark as ready immediately
    if (!isEnabled) {
      setMultiLocationReady(true);
    }
  }, []);

  const { main_image, response, otherImages } = product;
  const { extensions } = response.attributes;
  const {
    id,
    meta: { original_display_price, display_price },
  } = response;
  const enableClickAndCollect =
    process.env.NEXT_PUBLIC_ENABLE_CLICK_AND_COLLECT === "true";

  useEffect(() => {
    const init = async () => {
      // Always load traditional inventory as a fallback
      // Even if multi-location is enabled, we need it for products without MLI configured
      setLoaded(false);
      const response = await getInventoryDetails(id);
      if (response) {
        setInventory(response.data.available);
      } else {
        setUnlimitedStock(true);
      }
      setLoaded(true);
    };
    init();
  }, [id]);

  const handleLocationChange = (
    locationSlug: string,
    available: number,
    locationId: string,
    locationName: string,
  ) => {
    setSelectedLocationSlug(locationSlug);
    setSelectedLocationId(locationId);
    setSelectedLocationName(locationName);
    setLocationInventory(available);
    setLoaded(true);
    setMultiLocationReady(true);
  };

  // Determine if we should show traditional inventory
  // Show traditional inventory if:
  // 1. Multi-location is disabled, OR
  // 2. Multi-location is enabled but no location was selected (product doesn't have MLI configured)
  // AND multiLocationReady must be true (so we don't show before location selector has loaded)
  const shouldShowTraditionalInventory =
    useMultiLocation === false ||
    (useMultiLocation === true && multiLocationReady && !selectedLocationSlug);

  const handleOverlay = (
    event: React.FormEvent<HTMLFormElement>,
    value: boolean,
  ) => {
    event.preventDefault();
    setIsOverlayOpen(value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data: any = {
      custom_inputs: {
        additional_information: [],
      },
    };

    // Add multi-location inventory information
    if (useMultiLocation && selectedLocationSlug && selectedLocationId) {
      if (!data.custom_inputs.location) {
        data.custom_inputs.location = {};
      }
      data.custom_inputs.location.location_name = selectedLocationName;

      // Also add as a top-level field for easier access
      data.location = selectedLocationSlug;
    }

    if (enableClickAndCollect) {
      const deliveryMode = formData.get("delivery_mode");
      if (deliveryMode) {
        if (!data.custom_inputs.location) {
          data.custom_inputs.location = {};
        }
        data.custom_inputs.location.delivery_mode = deliveryMode;
      }
      const locationCode = formData.get("location_code");
      const locationName = formData.get("location_name");
      if (locationCode && locationName) {
        if (!data.custom_inputs.location) {
          data.custom_inputs.location = {};
        }
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
      const pricingOptionId = formData.get("pricing_option")?.toString() || "";
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
            pricing_option: pricingOptionId,
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

              <ProductSummary product={response} offerings={offerings} />
              {offerings && offerings.data.length > 0 && (
                <SubscriptionOfferPlans
                  offerings={offerings}
                  product={response}
                />
              )}
              <PersonalisedInfo
                custom_inputs={response.attributes?.custom_inputs}
              />

              {/* Multi-Location Inventory Selector */}
              {useMultiLocation && (
                <LocationInventorySelector
                  productId={id}
                  onLocationChange={handleLocationChange}
                  onReady={() => setMultiLocationReady(true)}
                />
              )}

              {/* Traditional Inventory Display (when multi-location is disabled or not configured for product) */}
              {shouldShowTraditionalInventory && loaded && unlimitedStock && (
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <CheckIcon
                    className="h-5 w-5 flex-shrink-0 text-green-500"
                    aria-hidden="true"
                  />
                  <span>In stock</span>
                </div>
              )}
              {shouldShowTraditionalInventory &&
                loaded &&
                !unlimitedStock &&
                inventory > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-700 mt-2">
                    <CheckIcon
                      className="h-5 w-5 flex-shrink-0 text-green-500"
                      aria-hidden="true"
                    />
                    <span>In stock ({inventory} available)</span>
                  </div>
                )}
              {shouldShowTraditionalInventory &&
                loaded &&
                !unlimitedStock &&
                inventory === 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-700 mt-2">
                    <XMarkIcon
                      className="h-5 w-5 flex-shrink-0 text-red-800"
                      aria-hidden="true"
                    />
                    <span>Out of stock</span>
                  </div>
                )}
              <QuantitySelector quantity={quantity} setQuantity={setQuantity} />
              <AddToCartButton
                type="submit"
                status={
                  isPendingAddItem || isPendingSubscriptionItem
                    ? "loading"
                    : "idle"
                }
                disabled={
                  shouldShowTraditionalInventory
                    ? !unlimitedStock && inventory === 0
                    : locationInventory !== undefined &&
                      locationInventory !== null &&
                      locationInventory === 0
                }
                showPrice={!!display_price}
              />

              {offerings?.data?.length == 0 && enableClickAndCollect && (
                <StatusButton
                  type="submit"
                  onClick={(event: any) => handleOverlay(event, true)}
                  className="uppercase"
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
