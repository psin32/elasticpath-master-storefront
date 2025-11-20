"use client";
import { Form, Formik, useFormikContext } from "formik";
import {
  BundleProduct,
  BundleProductProvider,
  useBundle,
  useCart,
} from "../../../react-shopper-hooks";
import { useCallback, useMemo, useState, useEffect } from "react";
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
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ProductComponent } from "./ProductComponent";
import ProductComponents from "./ProductComponents";
import Price from "../Price";
import StrikePrice from "../StrikePrice";
import {
  formSelectedOptionsToData,
  selectedOptionsToFormValues,
} from "./form-parsers";
import { createBundleFormSchema } from "./validation-schema";
import { toFormikValidate } from "zod-formik-adapter";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

interface IBundleProductMultiStepPage {
  bundleProduct: BundleProduct;
  offerings: ResourcePage<SubscriptionOffering, never>;
  content: any;
  relationship: any[];
}

const BundleProductMultiStepPageDetail = ({
  bundleProduct,
  offerings,
  content,
  relationship,
}: IBundleProductMultiStepPage): JSX.Element => {
  return (
    <BundleProductProvider bundleProduct={bundleProduct}>
      <BundleProductMultiStepPageContainer
        offerings={offerings}
        content={content}
        relationship={relationship}
      />
    </BundleProductProvider>
  );
};

// Component to handle form content in overlay with useEffect at component level
function OverlayFormContent({
  currentComponentKey,
  components,
  updateSelectedOptions,
  response,
  currentDisplayPrice,
  currentOriginalPrice,
  isLastStep,
  isFirstOverlayStep,
  handleNext,
  handlePrevious,
  isPending,
}: {
  currentComponentKey: string | undefined;
  components: any;
  updateSelectedOptions: (options: any) => void;
  response: any;
  currentDisplayPrice: any;
  currentOriginalPrice: any;
  isLastStep: boolean;
  isFirstOverlayStep: boolean;
  handleNext: (e?: React.MouseEvent) => void;
  handlePrevious: (e?: React.MouseEvent) => void;
  isPending: boolean;
}): JSX.Element {
  const { values } = useFormikContext<{
    selectedOptions: any;
    quantities?: any;
  }>();

  // Update selected options in bundle context when form values change
  useEffect(() => {
    const selectedOptionsData = formSelectedOptionsToData(
      values.selectedOptions,
      values.quantities,
      components,
    );
    updateSelectedOptions(selectedOptionsData);
  }, [
    values.selectedOptions,
    values.quantities,
    components,
    updateSelectedOptions,
  ]);

  return (
    <Form>
      {/* Use ProductComponents to handle parent product expansion and option syncing */}
      <ProductComponents
        product={response}
        componentKeyToShow={currentComponentKey}
      />

      {/* Price Impact Display */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border sticky bottom-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Current Price:
          </span>
          <div className="flex items-center gap-2">
            {currentOriginalPrice && (
              <StrikePrice
                price={
                  currentOriginalPrice?.without_tax?.formatted ||
                  currentOriginalPrice?.with_tax?.formatted
                }
                currency={
                  currentOriginalPrice?.without_tax?.currency ||
                  currentOriginalPrice?.with_tax?.currency
                }
              />
            )}
            {currentDisplayPrice && (
              <Price
                price={
                  currentDisplayPrice?.without_tax?.formatted ||
                  currentDisplayPrice?.with_tax?.formatted
                }
                currency={
                  currentDisplayPrice?.without_tax?.currency ||
                  currentDisplayPrice?.with_tax?.currency
                }
                original_display_price={currentOriginalPrice}
                size="text-lg"
              />
            )}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handlePrevious(e);
          }}
          disabled={isFirstOverlayStep}
          className={`px-4 py-2 rounded-md ${
            isFirstOverlayStep
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Previous
        </button>

        {isLastStep ? (
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90 disabled:opacity-50"
          >
            {isPending ? "Adding..." : "Finish"}
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNext(e);
            }}
            onMouseDown={(e) => {
              // Prevent form submission on mousedown as well
              e.preventDefault();
            }}
            className="px-6 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90"
          >
            Next
          </button>
        )}
      </div>
    </Form>
  );
}

function BundleProductMultiStepPageContainer({
  offerings,
  content,
  relationship,
}: {
  offerings: ResourcePage<SubscriptionOffering, never>;
  content: any;
  relationship: any[];
}): JSX.Element {
  const { enableBuilderIO } = cmsConfig;
  const {
    configuredProduct,
    components,
    selectedOptions,
    updateSelectedOptions,
  } = useBundle();
  const { useScopedAddBundleProductToCart } = useCart();

  const { mutate, isPending } = useScopedAddBundleProductToCart();
  const { response, main_image, otherImages } = configuredProduct as any;
  const { extensions } = response.attributes;

  const {
    id,
    meta: { display_price, original_display_price },
  } = response;

  // Get current price from configured product (updates as selections change)
  const currentDisplayPrice = configuredProduct.response.meta?.display_price;
  const currentOriginalPrice =
    configuredProduct.response.meta?.original_display_price;

  // State for overlay
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  // Start from step 1 (second component) since first is shown on main page
  // But allow going back to step 0 to change first component selection
  const [currentStep, setCurrentStep] = useState(1);

  // Get component keys in order
  const componentKeys = useMemo(() => {
    return Object.keys(components).sort((a, b) => {
      const componentA = components[a];
      const componentB = components[b];
      return (componentA.sort_order || 0) - (componentB.sort_order || 0);
    });
  }, [components]);

  // Get first component
  const firstComponentKey = componentKeys[0];
  const firstComponent = firstComponentKey
    ? components[firstComponentKey]
    : null;

  // Get current component for overlay step
  const currentComponentKey = componentKeys[currentStep];
  const currentComponent = currentComponentKey
    ? components[currentComponentKey]
    : null;

  const isLastStep = currentStep === componentKeys.length - 1;
  // First step in overlay (step 0) - customer can navigate back here to change first component
  const isFirstOverlayStep = currentStep === 0;

  // Handle overlay open
  const handleAddToCartClick = useCallback(() => {
    setIsOverlayOpen(true);
    // Start from step 1 (second component) since first is shown on main page
    setCurrentStep(1);
  }, []);

  // Handle step navigation
  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      if (currentStep < componentKeys.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    },
    [currentStep, componentKeys.length],
  );

  const handlePrevious = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      // Allow going back to step 0 (first component) so customer can change selection
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    },
    [currentStep],
  );

  // Handle finish (add to cart)
  const handleFinish = useCallback(
    async (values: any) => {
      const selectedOptionsData = formSelectedOptionsToData(
        values.selectedOptions,
        values.quantities,
        components,
      );

      const data: any = {
        custom_inputs: {
          additional_information: [],
        },
      };

      mutate({
        productId: id,
        selectedOptions: selectedOptionsData,
        quantity: 1,
        data,
      });

      setIsOverlayOpen(false);
      setCurrentStep(1);
    },
    [mutate, id, components],
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

  // Get initial form values
  const initialValues = useMemo(() => {
    return {
      selectedOptions: selectedOptionsToFormValues(selectedOptions || {}),
      quantities: initialQuantities,
    };
  }, [selectedOptions, initialQuantities]);

  return (
    <>
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
            <Formik
              initialValues={initialValues}
              enableReinitialize={true}
              validate={toFormikValidate(createBundleFormSchema(components))}
              onSubmit={handleFinish}
            >
              {() => {
                // Note: Form values will sync automatically via enableReinitialize
                // when initialValues change (which happens when selectedOptions change)

                return (
                  <Form>
                    <div className="flex flex-col gap-6 md:gap-10">
                      <ProductSummary
                        product={response}
                        offerings={offerings}
                      />

                      {/* Show only first component - use ProductComponents to handle parent product expansion */}
                      <ProductComponents
                        product={response}
                        componentKeyToShow={firstComponentKey}
                      />

                      <PersonalisedInfo
                        custom_inputs={response.attributes?.custom_inputs}
                        formikForm={true}
                      />

                      <AddToCartButton
                        type="button"
                        onClick={handleAddToCartClick}
                        status="idle"
                        disabled={false}
                        showPrice={!!display_price}
                      >
                        Configure
                      </AddToCartButton>
                    </div>
                  </Form>
                );
              }}
            </Formik>
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

      {/* Multi-Step Overlay */}
      <Dialog
        open={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <Dialog.Title className="text-xl font-semibold">
                Configure Bundle
              </Dialog.Title>
              <button
                type="button"
                data-dialog-close
                onClick={() => setIsOverlayOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                {componentKeys.map((key, index) => {
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;
                  return (
                    <div key={key} className="flex items-center flex-1">
                      <div className="flex items-center">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            isActive
                              ? "bg-brand-primary text-white"
                              : isCompleted
                                ? "bg-green-500 text-white"
                                : "bg-gray-300 text-gray-600"
                          }`}
                        >
                          {isCompleted ? "✓" : index + 1}
                        </div>
                        <span className="ml-2 text-sm font-medium">
                          {components[key].name}
                        </span>
                      </div>
                      {index < componentKeys.length - 1 && (
                        <div className="flex-1 h-0.5 mx-4 bg-gray-300" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <Formik
                initialValues={initialValues}
                enableReinitialize={true}
                validate={toFormikValidate(createBundleFormSchema(components))}
                onSubmit={handleFinish}
              >
                <OverlayFormContent
                  currentComponentKey={currentComponentKey}
                  components={components}
                  updateSelectedOptions={updateSelectedOptions}
                  response={response}
                  currentDisplayPrice={currentDisplayPrice}
                  currentOriginalPrice={currentOriginalPrice}
                  isLastStep={isLastStep}
                  isFirstOverlayStep={isFirstOverlayStep}
                  handleNext={handleNext}
                  handlePrevious={handlePrevious}
                  isPending={isPending}
                />
              </Formik>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}

export default BundleProductMultiStepPageDetail;
