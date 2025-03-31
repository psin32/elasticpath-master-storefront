import { useElasticPath } from "../../elasticpath/elasticpath";
import { UseQueryOptionsWrapper } from "../../types";
import type { Cart, CartIncluded, ResourceIncluded } from "@elasticpath/js-sdk";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { queryKeysFactory } from "../../shared/util/query-keys-factory";

const CARTS_QUERY_KEY = "carts" as const;

export const cartQueryKeys = queryKeysFactory(CARTS_QUERY_KEY);
type CartQueryKey = typeof cartQueryKeys;

export function useGetCart(
  id: string,
  options?: UseQueryOptionsWrapper<
    ResourceIncluded<any, CartIncluded>,
    Error,
    ReturnType<CartQueryKey["detail"]>
  >,
): Partial<ResourceIncluded<any, CartIncluded>> &
  Omit<UseQueryResult<ResourceIncluded<any, CartIncluded>, Error>, "data"> {
  const { client } = useElasticPath();
  const included: any = ["items", "custom_discounts"];

  const { data, ...rest } = useQuery({
    queryKey: cartQueryKeys.detail(id),
    queryFn: async () => {
      const cartData: any = await client.Cart(id).With(included).Get();
      const cartItems: any = await client.Cart(id).With(included).Items();
      cartData.included.itemCustomDiscount =
        cartItems.included.custom_discounts;
      return { ...cartData };
    },
    ...options,
  });

  return { ...data, ...rest } as const;
}
