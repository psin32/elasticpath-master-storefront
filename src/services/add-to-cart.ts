"use server";

import {
  CartAdditionalHeaders,
  CartItem,
  ProductResponse,
  ShopperCatalogResource,
} from "@elasticpath/js-sdk";
import { getServerSideImplicitClient } from "../lib/epcc-server-side-implicit-client";
import {
  getSelectedAccount,
  retrieveAccountMemberCredentials,
} from "../lib/retrieve-account-member-credentials";
import { cookies } from "next/headers";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../lib/cookie-constants";
import { redirect } from "next/navigation";
import { COOKIE_PREFIX_KEY } from "../lib/resolve-cart-env";

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
  const cookieStore = cookies();

  const { cartId, productId, quantity, data, isSku, token, additionalHeaders } =
    props;

  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookieStore,
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  if (!accountMemberCookie) {
    redirect("/login?returnUrl=/checkout");
    throw new Error("No account member cookie found");
  }

  const selectedAccount = getSelectedAccount(accountMemberCookie);

  const cartCookie = cookieStore.get(`${COOKIE_PREFIX_KEY}_ep_cart`);
  const cart = await client.Cart(cartCookie?.value).With("items").Get();

  if (!cart) {
    throw new Error("No cart found");
  }

  const currentCartItems = cart.included?.items ?? [];
  const mappedCartItems = currentCartItems.map((item) => ({
    product_id: item.product_id ?? item.custom_inputs?.product_id,
    quantity: item.quantity,
  }));

  // @ts-ignore
  const customAttributes = cart?.data?.custom_attributes || {};

  const contractTerm = customAttributes?.contract_term_id?.value;

  // CHeck if mappedCartItems has productId

  const filteredMappedCartItems = mappedCartItems.filter(
    (item) => item.product_id !== productId,
  );

  const resolvedDynamicPricing = await getDynamicPricing({
    contract_terms: contractTerm,
    account: selectedAccount.account_id,
    products: [
      ...mappedCartItems,
      {
        product_id: productId,
        quantity: quantity ?? 1,
      },
    ],
  });

  const originalProduct = await client.ShopperCatalog.Products.With(
    "main_image",
  ).Get({
    productId,
  });

  if (!resolvedDynamicPricing?.success) {
    return client
      .Cart(cartId)
      .AddProduct(productId, quantity, data, isSku, token, additionalHeaders);
  }

  const cartItemLookUpByProductId = currentCartItems.reduce(
    (acc, item) => {
      const productId = item.custom_inputs?.product_id ?? item.product_id;

      return {
        ...acc,
        ...(productId && { [productId]: item }),
      };
    },
    {} as Record<string, CartItem>,
  );

  const customItems = resolvedDynamicPricing.products?.map((item) =>
    convertDynamicPricingResponseToCustomItem(
      item,
      originalProduct,
      cartItemLookUpByProductId[item.product_id],
    ),
  );

  console.log("original customItems", currentCartItems);
  console.log("latest customItems", customItems);

  await client.Cart(cartId).RemoveAllItems();
  return client.Cart(cartId).AddCustomItem(customItems);
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
      image_url: resolveCustomItemImage(originalProduct),
      originalQuantityForContract:
        resolvedDynamicPricing.originalQuantityForContract,
    },
  };
}

function resolveCustomItemImage(
  originalProduct: ShopperCatalogResource<ProductResponse>,
) {
  // @ts-ignore
  return originalProduct.included?.main_images?.[0].link.href ?? null;
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

export type DynamicPricingRequest = {
  contract_terms: string;
  account: string;
  products: {
    product_id: string;
    quantity: number;
  }[];
};

export async function getDynamicPricing(request: DynamicPricingRequest) {
  console.log("dynamic pricing request", request);

  const response = await fetch(
    "https://hooks.eu-west-1.elasticpathintegrations.com/trigger/SW5zdGFuY2VGbG93Q29uZmlnOjMxOTllY2JhLTc4MjEtNDRkZS1hYzFkLTYxNjkzNDk4YjJkNQ==",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );

  const responseBody: DynamicPricingResponse = await response.json();
  console.log("dynamic pricing response", responseBody);

  if (responseBody) {
    return {
      success: true,
      products: responseBody,
    };
  }

  return {
    success: false,
    products: null,
  };
}

type DynamicPricingResponse = [
  {
    product_id: string;
    sku: string;
    quantity: number;
    price: number;
    listPrice: number;
    regularPrice: number;
    partnerPrice: number;
    totalPartnerDiscountPercentage: number;
    totalDiscounted: number;
  },
];

function convertDynamicPricingResponseToCustomItem(
  response: DynamicPricingResponse[number],
  originalProduct: ShopperCatalogResource<ProductResponse>,
  originalCartItem?: CartItem,
) {
  return {
    type: "custom_item",
    quantity: response.quantity || 1,
    price: {
      amount: response.price,
    },
    description:
      originalCartItem?.description ??
      originalProduct.data.attributes.description,
    sku: originalCartItem?.sku ?? originalProduct.data.attributes.sku,
    name: originalCartItem?.name ?? originalProduct.data.attributes.name,
    custom_inputs: {
      image_url:
        originalCartItem?.custom_inputs?.image_url ??
        resolveCustomItemImage(originalProduct),
      originalQuantityForContract:
        originalCartItem?.custom_inputs?.originalQuantityForContract ?? 1,
      product_id:
        originalCartItem?.custom_inputs?.product_id ?? originalProduct.data.id,
      partnerPrice: response.partnerPrice,
      totalPartnerDiscountPercentage: response.totalPartnerDiscountPercentage,
      totalDiscounted: response.totalDiscounted,
    },
  };
}
