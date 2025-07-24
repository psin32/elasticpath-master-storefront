import type { ElasticPath as EPCCClient } from "@elasticpath/js-sdk";
import { Cart, CartIncluded, ResourceIncluded } from "@elasticpath/js-sdk";

export async function getCart(
  cartId: string,
  client: EPCCClient,
): Promise<ResourceIncluded<Cart, CartIncluded>> {
  const included: any = ["items", "custom_discounts", "promotions"];
  return client.Cart(cartId).With(included).Get();
}

export async function addSubscriptionItem(
  cartId: string,
  offeringId: string | undefined,
  planId: string | undefined,
  client: EPCCClient,
): Promise<any> {
  const body = {
    data: {
      type: "subscription_item",
      id: offeringId,
      quantity: 1,
      subscription_configuration: {
        plan: planId,
      },
    },
  };

  return await client.request.send(
    `carts/${cartId}/items`,
    "POST",
    body,
    undefined,
    client,
    false,
    "v2",
  );
}
