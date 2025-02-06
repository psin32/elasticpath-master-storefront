import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { CartItemsResponse } from "@elasticpath/js-sdk";
import { useElasticPath } from "../../elasticpath";

export type CartAddSubscriptionItemReq = {
  data: {
    type: "subscription_item";
    id: string;
    subscription_configuration: {
      plan: string;
    };
    quantity: number;
    custom_inputs?: Record<string, any>;
    shipping_group_id?: string;
    tax?: any[];
  };
};

export const useAddSubscriptionItemToCart = (
  cartId: string,
  options?: UseMutationOptions<
    CartItemsResponse,
    Error,
    CartAddSubscriptionItemReq
  >,
) => {
  const { client } = useElasticPath();
  return useMutation({
    mutationFn: async (body) => {
      return await client.request.send(
        `carts/${cartId}/items`,
        "POST",
        body,
        undefined,
        client,
        false,
        "v2",
      );
    },
    ...options,
  });
};
