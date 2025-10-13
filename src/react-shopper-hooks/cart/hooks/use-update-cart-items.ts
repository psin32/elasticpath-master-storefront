import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { useElasticPath } from "../../elasticpath";
import { CartItemsResponse } from "@elasticpath/js-sdk";

type CartUpdateReq = {
  itemId: string;
  quantity: number;
  location?: string;
  customInputs?: any;
};

export const useUpdateCartItem = (
  cartId: string,
  options?: UseMutationOptions<CartItemsResponse, Error, CartUpdateReq>,
) => {
  const { client } = useElasticPath();
  return useMutation({
    mutationFn: async ({
      itemId,
      quantity,
      location,
      customInputs,
    }: CartUpdateReq) => {
      // If location is provided, include it in the update
      if (location || customInputs) {
        const data: any = {};

        if (location) {
          data.location = location;
        }

        if (customInputs) {
          data.custom_inputs = customInputs;
        }

        return client.Cart(cartId).UpdateItem(itemId, quantity, data);
      }

      return client.Cart(cartId).UpdateItem(itemId, quantity);
    },
    ...options,
  });
};
