import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { CartItemsResponse } from "@elasticpath/js-sdk";
import { useElasticPath } from "../../elasticpath";

export type CartAddReorderReq = {
  data: {
    type: "order_items";
    order_id: string;
    custom_inputs?: Record<string, any>;
    shipping_group_id?: string;
    tax?: any[];
  };
  options: {
    add_all_or_nothing: boolean;
  };
};

export const useReorderToCart = (
  cartId: string,
  options?: UseMutationOptions<CartItemsResponse, Error, CartAddReorderReq>,
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
