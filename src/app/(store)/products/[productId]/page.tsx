import { Metadata } from "next";
import { ProductDetailsComponent, ProductProvider } from "./product-display";
import { getServerSideImplicitClient } from "../../../../lib/epcc-server-side-implicit-client";
import {
  getNodesByIds,
  getProductBySlug,
  getSubscriptionOfferingByProductId,
} from "../../../../services/products";
import { notFound } from "next/navigation";
import { parseProductResponse } from "../../../../shopper-common/src";
import React from "react";
import { Node } from "@moltin/sdk";

export const dynamic = "force-dynamic";

type Props = {
  params: { productId: string };
};

export async function generateMetadata({
  params: { productId },
}: Props): Promise<Metadata> {
  const client = getServerSideImplicitClient();
  const product = await getProductBySlug(productId, client);

  if (!product) {
    notFound();
  }

  return {
    title: product.data?.[0]?.attributes.name,
    description: product.data?.[0]?.attributes.description,
  };
}

export default async function ProductPage({ params }: Props) {
  const client: any = getServerSideImplicitClient();
  const product = (await getProductBySlug(params.productId, client)) as any;
  if (!product.data?.[0]?.id) {
    notFound();
  }
  const offerings = await getSubscriptionOfferingByProductId(
    product?.data?.[0]?.id,
    client,
  );

  const breadCrumNode = product?.data?.[0].meta?.bread_crumb_nodes?.[0] || "";
  const nodeIds: string[] = [];
  const parentNodes =
    (breadCrumNode &&
      product?.data?.[0].meta?.bread_crumbs?.[breadCrumNode].reverse()) ||
    [];
  nodeIds.push(breadCrumNode, ...parentNodes);
  const breadcrumb: Node[] | undefined = await getNodesByIds(nodeIds, client);

  const shopperProduct = await parseProductResponse(product, client);

  return (
    <div key={"page_" + params.productId}>
      <ProductProvider>
        <ProductDetailsComponent
          product={shopperProduct}
          breadcrumb={breadcrumb}
          offerings={offerings}
        />
      </ProductProvider>
    </div>
  );
}
