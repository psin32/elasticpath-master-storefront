"use server";

import {
  CartAdditionalHeaders,
  Product,
  ProductResponse,
  Resource,
  ShopperCatalogResource,
} from "@elasticpath/js-sdk";
import { getServerSideImplicitClient } from "../lib/epcc-server-side-implicit-client";

export type ServerSideAddProductToCartProps = {
  cartId: string;
  productId: string;
  quantity?: number;
  data?: any;
  isSku?: boolean;
  token?: string;
  additionalHeaders?: CartAdditionalHeaders;
};

export async function serverSideAddProductToCart(
  props: ServerSideAddProductToCartProps,
) {
  const client = getServerSideImplicitClient();

  console.log("props", props);

  const { cartId, productId, quantity, data, isSku, token, additionalHeaders } =
    props;

  const resolvedDynamicPricing = await getDynamicPricing(productId);

  if (!resolvedDynamicPricing?.success) {
    return client
      .Cart(cartId)
      .AddProduct(productId, quantity, data, isSku, token, additionalHeaders);
  }

  const originalProduct = await client.ShopperCatalog.Products.Get({
    productId,
  });

  console.log("originalProduct", originalProduct);

  const customItem = constructCustomItem({
    resolvedDynamicPricing,
    props,
    originalProduct,
  });

  console.log("customItem", customItem);

  return client.Cart(cartId).AddCustomItem(customItem);
}

function constructCustomItem({
  resolvedDynamicPricing,
  props,
  originalProduct,
}: {
  resolvedDynamicPricing: any;
  props: ServerSideAddProductToCartProps;
  originalProduct: ShopperCatalogResource<ProductResponse>;
}) {
  return {
    type: "custom_item",
    quantity: props.quantity || 1,
    price: {
      amount: resolvedDynamicPricing.product.price.amount,
      includes_tax: resolvedDynamicPricing.product.price.includes_tax,
    },
    description: originalProduct.data.attributes.description,
    sku: originalProduct.data.attributes.sku,
    name: originalProduct.data.attributes.name,
    custom_inputs: {
      image: resolveCustomItemImage(originalProduct),
      originalQuantityForContract:
        resolvedDynamicPricing.originalQuantityForContract,
    },
  };
}

function resolveCustomItemImage(
  originalProduct: ShopperCatalogResource<ProductResponse>,
) {
  // @ts-ignore
  return originalProduct.data.image ?? null;
}

const MOCK_DYNAMIC_PRICING_LOOKUP: Record<string, any> = {
  "f6330864-1ba3-4798-a662-28407f42e969": {
    price: {
      amount: 1099,
      includes_tax: true,
    },
    originalQuantityForContract: 1,
  },
};

async function getDynamicPricing(productId: string) {
  const result = MOCK_DYNAMIC_PRICING_LOOKUP[productId];

  if (result) {
    return Promise.resolve({
      success: true,
      product: result,
    });
  }

  return Promise.resolve({
    success: false,
    product: null,
  });
}
