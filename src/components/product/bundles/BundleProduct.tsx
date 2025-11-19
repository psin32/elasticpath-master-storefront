"use client";
import ProductComponents from "./ProductComponents";
import { Field, Form, Formik } from "formik";
import {
  BundleProduct,
  BundleProductProvider,
  useBundle,
  useCart,
} from "../../../react-shopper-hooks";
import { useCallback, useMemo, useState, useEffect } from "react";
import {
  formSelectedOptionsToData,
  selectedOptionsToFormValues,
} from "./form-parsers";
import { createBundleFormSchema } from "./validation-schema";
import { toFormikValidate } from "zod-formik-adapter";
import ProductCarousel from "../carousel/ProductCarousel";
import ProductSummary from "../ProductSummary";
import ProductDetails from "../ProductDetails";
import PersonalisedInfo from "../PersonalisedInfo";
import { AddToCartButton } from "../AddToCartButton";
import ProductHighlights from "../ProductHighlights";
import Reviews from "../../reviews/yotpo/Reviews";
import { ResourcePage, SubscriptionOffering } from "@elasticpath/js-sdk";
import { Content as BuilderContent } from "@builder.io/sdk-react";
import { cmsConfig } from "../../../lib/resolve-cms-env";
import { builder } from "@builder.io/sdk";
import { builderComponent } from "../../builder-io/BuilderComponents";
import ProductRelationship from "../related-products/ProductRelationship";
import { updateCustomAttributesForBundlesInCart } from "./actions";
import BundleLocationInventorySelector from "./BundleLocationInventorySelector";
import { getCookie } from "cookies-next";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

interface IBundleProductDetail {
  bundleProduct: BundleProduct;
  offerings: ResourcePage<SubscriptionOffering, never>;
  content: any;
  relationship: any[];
}

const BundleProductDetail = ({
  bundleProduct,
  offerings,
  content,
  relationship,
}: IBundleProductDetail): JSX.Element => {
  return (
    <BundleProductProvider bundleProduct={bundleProduct}>
      <BundleProductContainer
        offerings={offerings}
        content={content}
        relationship={relationship}
      />
    </BundleProductProvider>
  );
};

function BundleProductContainer({
  offerings,
  content,
  relationship,
}: {
  offerings: ResourcePage<SubscriptionOffering, never>;
  content: any;
  relationship: any[];
}): JSX.Element {
  const { enableBuilderIO } = cmsConfig;
  const { configuredProduct, selectedOptions, components } = useBundle();
  const { state, useScopedAddBundleProductToCart } = useCart();

  const { mutate, isPending } = useScopedAddBundleProductToCart();
  const { response, main_image, otherImages } = configuredProduct as any;
  const { extensions } = response.attributes;
  const {
    id,
    meta: { original_display_price, display_price },
  } = response;
  const enableClickAndCollect =
    process.env.NEXT_PUBLIC_ENABLE_CLICK_AND_COLLECT === "true";

  // Multi-location inventory state
  const [selectedLocationSlug, setSelectedLocationSlug] = useState<string>("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [selectedLocationName, setSelectedLocationName] = useState<string>("");
  const [allComponentsAvailable, setAllComponentsAvailable] =
    useState<boolean>(true); // Default to true (allow if no MLI configured)
  const [componentInventories, setComponentInventories] = useState<any[]>([]);
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

  const handleLocationChange = (
    locationSlug: string,
    allAvailable: boolean,
    locationId: string,
    locationName: string,
    componentInventories: any[],
  ) => {
    setSelectedLocationSlug(locationSlug);
    setSelectedLocationId(locationId);
    setSelectedLocationName(locationName);
    setAllComponentsAvailable(allAvailable);
    setComponentInventories(componentInventories);
    setMultiLocationReady(true);
  };

  const submit = useCallback(
    async (values: any) => {
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
        if (!data.custom_inputs.location) {
          data.custom_inputs.location = {};
        }
        data.custom_inputs.location.delivery_mode = "Home Delivery";
      }
      response?.attributes?.custom_inputs &&
        Object.keys(response?.attributes?.custom_inputs).map((input) => {
          const value = values[input];
          if (value) {
            const info = {
              key: response.attributes.custom_inputs[input].name,
              value,
            };
            data.custom_inputs.additional_information.push(info);
          }
        });
      const selectedOptions = formSelectedOptionsToData(
        values.selectedOptions,
        values.quantities,
        components,
      );
      // state?.id &&
      //   (await updateCustomAttributesForBundlesInCart(
      //     state?.id,
      //     selectedOptions,
      //   ));
      mutate({
        productId: configuredProduct.response.id,
        selectedOptions,
        quantity: 1,
        data,
      });
    },
    [
      configuredProduct.response.id,
      mutate,
      useMultiLocation,
      selectedLocationSlug,
      selectedLocationId,
      selectedLocationName,
      componentInventories,
    ],
  );

  const validationSchema = useMemo(
    () => createBundleFormSchema(components),
    [components],
  );

  // Initialize quantities for each component option
  const initialQuantities = useMemo(() => {
    const quantities: any = {};
    Object.keys(components).forEach((componentKey) => {
      quantities[componentKey] = {};
      components[componentKey].options.forEach((option) => {
        quantities[componentKey][option.id] = option.quantity || 1;
      });
    });
    return quantities;
  }, [components]);

  return (
    <Formik
      initialValues={{
        selectedOptions: selectedOptionsToFormValues(selectedOptions),
        quantities: initialQuantities,
      }}
      validate={toFormikValidate(validationSchema)}
      onSubmit={async (values) => submit(values)}
    >
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
            <Form>
              <div className="flex flex-col gap-6 md:gap-10">
                <ProductSummary product={response} offerings={offerings} />
                <ProductComponents product={response} />
                <PersonalisedInfo
                  custom_inputs={response.attributes?.custom_inputs}
                  formikForm={true}
                />

                {/* Multi-Location Inventory Selector for Bundle Components */}
                {useMultiLocation && (
                  <BundleLocationInventorySelector
                    selectedComponents={selectedOptions}
                    componentProducts={
                      configuredProduct.componentProductResponses
                    }
                    onLocationChange={handleLocationChange}
                    onReady={() => setMultiLocationReady(true)}
                  />
                )}

                <AddToCartButton
                  type="submit"
                  status={isPending ? "loading" : "idle"}
                  disabled={
                    isPending ||
                    (useMultiLocation &&
                    multiLocationReady &&
                    selectedLocationSlug
                      ? !allComponentsAvailable
                      : false)
                  }
                  showPrice={!!display_price}
                />
                <ProductDetails product={response} />
                {extensions && <ProductHighlights extensions={extensions} />}
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

export default BundleProductDetail;
