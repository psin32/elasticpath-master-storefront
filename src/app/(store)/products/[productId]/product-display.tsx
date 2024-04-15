"use client";
import React, { ReactElement, ReactNode, useState } from "react";
import { ShopperProduct } from "../../../../react-shopper-hooks";
import { VariationProductDetail } from "../../../../components/product/variations/VariationProduct";
import BundleProductDetail from "../../../../components/product/bundles/BundleProduct";
import { ProductContext } from "../../../../lib/product-context";
import SimpleProductDetail from "../../../../components/product/SimpleProduct";
import { ResourcePage, SubscriptionOffering } from "@moltin/sdk";

export function ProductProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [isChangingSku, setIsChangingSku] = useState(false);

  return (
    <ProductContext.Provider
      value={{
        isChangingSku,
        setIsChangingSku,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function resolveProductDetailComponent(
  product: ShopperProduct,
  offerings: ResourcePage<SubscriptionOffering, never>
): JSX.Element {
  switch (product.kind) {
    case "base-product":
      return <VariationProductDetail variationProduct={product} offerings={offerings} />;
    case "child-product":
      return <VariationProductDetail variationProduct={product} offerings={offerings} />;
    case "simple-product":
      return <SimpleProductDetail simpleProduct={product} offerings={offerings} />;
    case "bundle-product":
      return <BundleProductDetail bundleProduct={product} offerings={offerings} />;
  }
}

export function ProductDetailsComponent({
  product,
  offerings
}: {
  product: ShopperProduct;
  offerings: ResourcePage<SubscriptionOffering, never>
}) {
  return resolveProductDetailComponent(product, offerings);
}
