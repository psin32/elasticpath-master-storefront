import { Metadata } from "next";
import { ProductDetailsComponent, ProductProvider } from "./product-display";
import { getServerSideImplicitClient } from "../../../../lib/epcc-server-side-implicit-client";
import { getNodesByIds, getProductById, getSubscriptionOffering } from "../../../../services/products";
import { notFound } from "next/navigation";
import { parseProductResponse } from "@elasticpath/shopper-common";
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
  const product = await getProductById(productId, client);

  if (!product) {
    notFound();
  }

  return {
    title: product.data.attributes.name,
    description: product.data.attributes.description,
  };
}

export default async function ProductPage({ params }: Props) {
  const client: any = getServerSideImplicitClient();
  const product = await getProductById(params.productId, client);
  const offerings = await getSubscriptionOffering(params.productId, client);

  if (!product) {
    notFound();
  }

  const breadCrumNode = product?.data?.meta?.bread_crumb_nodes?.[0] || ""
  const nodeIds: string[] = []
  const parentNodes = breadCrumNode && product?.data?.meta?.bread_crumbs?.[breadCrumNode].reverse() || []
  nodeIds.push(breadCrumNode, ...parentNodes)
  const breadcrumb: Node[] | undefined = await getNodesByIds(nodeIds, client)

  const shopperProduct = await parseProductResponse(product, client);

  return (
    <div
      key={"page_" + params.productId}
    >
      <ProductProvider>
        <ProductDetailsComponent product={shopperProduct} breadcrumb={breadcrumb} offerings={offerings} />
      </ProductProvider>
    </div>
  );
}
