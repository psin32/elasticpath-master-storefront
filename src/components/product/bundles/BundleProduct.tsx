"use client";
import ProductComponents from "./ProductComponents";
import { Field, Form, Formik } from "formik";
import {
  BundleProduct,
  BundleProductProvider,
  useBundle,
  useCart,
} from "../../../react-shopper-hooks";
import { useCallback, useMemo } from "react";
import {
  formSelectedOptionsToData,
  selectedOptionsToFormValues,
} from "./form-parsers";
import { createBundleFormSchema } from "./validation-schema";
import { toFormikValidate } from "zod-formik-adapter";
import ProductCarousel from "../carousel/ProductCarousel";
import ProductSummary from "../ProductSummary";
import ProductDetails from "../ProductDetails";
import { StatusButton } from "../../button/StatusButton";
import PersonalisedInfo from "../PersonalisedInfo";
import ProductHighlights from "../ProductHighlights";
import Reviews from "../../reviews/yotpo/Reviews";
import { ResourcePage, SubscriptionOffering } from "@moltin/sdk";

interface IBundleProductDetail {
  bundleProduct: BundleProduct;
  offerings: ResourcePage<SubscriptionOffering, never>;
}

const BundleProductDetail = ({
  bundleProduct,
  offerings,
}: IBundleProductDetail): JSX.Element => {
  return (
    <BundleProductProvider bundleProduct={bundleProduct}>
      <BundleProductContainer offerings={offerings} />
    </BundleProductProvider>
  );
};

function BundleProductContainer({
  offerings,
}: {
  offerings: ResourcePage<SubscriptionOffering, never>;
}): JSX.Element {
  const { configuredProduct, selectedOptions, components } = useBundle();
  const { useScopedAddBundleProductToCart } = useCart();

  const { mutate, isPending } = useScopedAddBundleProductToCart();
  const { response, main_image, otherImages } = configuredProduct as any;
  const { extensions } = response.attributes;
  const {
    meta: { original_display_price },
  } = response;

  const submit = useCallback(
    async (values: any) => {
      const data: any = {
        custom_inputs: {
          additional_information: [],
        },
      };
      {
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
      }
      mutate({
        productId: configuredProduct.response.id,
        selectedOptions: formSelectedOptionsToData(values.selectedOptions),
        quantity: 1,
        data,
      });
    },
    [configuredProduct.response.id, mutate],
  );

  const validationSchema = useMemo(
    () => createBundleFormSchema(components),
    [components],
  );

  return (
    <Formik
      initialValues={{
        selectedOptions: selectedOptionsToFormValues(selectedOptions),
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
                <StatusButton
                  type="submit"
                  status={isPending ? "loading" : "idle"}
                >
                  ADD TO CART
                </StatusButton>
                <ProductDetails product={response} />
                {extensions && <ProductHighlights extensions={extensions} />}
              </div>
            </Form>
          </div>
        </div>
        <Reviews product={response} />
      </div>
    </Formik>
  );
}

export default BundleProductDetail;
