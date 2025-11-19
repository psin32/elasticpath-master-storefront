"use client";
import {
  BundleProduct,
  BundleProductProvider,
} from "../../../react-shopper-hooks";
import { ResourcePage, SubscriptionOffering } from "@elasticpath/js-sdk";
import BundleProductDetail from "./BundleProduct";
import BundleProductVariationStylePage from "./BundleProductVariationStylePage";

interface IBundleProductWrapper {
  bundleProduct: BundleProduct;
  offerings: ResourcePage<SubscriptionOffering, never>;
  content: any;
  relationship: any[];
}

const BundleProductWrapper = ({
  bundleProduct,
  offerings,
  content,
  relationship,
}: IBundleProductWrapper): JSX.Element => {
  // Check template version from extensions
  const templateVersion =
    bundleProduct.response.attributes.extensions?.["products(template)"]
      ?.version || "Standard";
  const isProductTemplate = templateVersion === "Product";

  // Render Product template component
  if (isProductTemplate) {
    return (
      <BundleProductVariationStylePage
        bundleProduct={bundleProduct}
        offerings={offerings}
        content={content}
        relationship={relationship}
      />
    );
  }

  // Standard template
  return (
    <BundleProductDetail
      bundleProduct={bundleProduct}
      offerings={offerings}
      content={content}
      relationship={relationship}
    />
  );
};

export default BundleProductWrapper;
