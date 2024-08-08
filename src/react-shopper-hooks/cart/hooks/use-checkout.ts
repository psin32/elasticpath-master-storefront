import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { useElasticPath } from "../../elasticpath";
import {
  Address,
  CartAdditionalHeaders,
  CheckoutCustomer,
  CheckoutCustomerObject,
  Order,
  Resource,
} from "@moltin/sdk";

export type UseCheckoutReq = {
  customer: string | CheckoutCustomer | CheckoutCustomerObject;
  billingAddress: Partial<Address>;
  shippingAddress?: Partial<Address>;
  additionalHeaders?: CartAdditionalHeaders;
  purchaseOrderNumber?: string;
};

export const useCheckout = (
  cartId: string,
  options?: UseMutationOptions<Resource<Order>, Error, UseCheckoutReq>,
) => {
  const { client } = useElasticPath();
  return useMutation({
    mutationFn: async ({
      customer,
      billingAddress,
      shippingAddress,
      additionalHeaders,
      purchaseOrderNumber,
    }: UseCheckoutReq) => {
      const body: any = {
        data: {
          customer,
          shipping_address: shippingAddress,
          billing_address: billingAddress,
        },
      };
      if (purchaseOrderNumber) {
        body.data.purchase_order_number = purchaseOrderNumber;
      }
      return await client.request.send(
        `/carts/${cartId}/checkout`,
        "POST",
        body,
        undefined,
        client,
        false,
        "v2",
        additionalHeaders as any,
      );
    },
    ...options,
  });
};

export type UseCheckoutWithAccountReq = {
  contact: string | CheckoutCustomer | CheckoutCustomerObject;
  billingAddress: Partial<Address>;
  shippingAddress?: Partial<Address>;
  additionalHeaders?: CartAdditionalHeaders;
  purchaseOrderNumber?: string;
};

export const useCheckoutWithAccount = (
  cartId: string,
  options?: UseMutationOptions<
    Resource<Order>,
    Error,
    UseCheckoutWithAccountReq
  >,
) => {
  const { client } = useElasticPath();
  return useMutation({
    mutationFn: async ({
      contact,
      billingAddress,
      shippingAddress,
      additionalHeaders,
      purchaseOrderNumber,
    }: UseCheckoutWithAccountReq) => {
      const body: any = {
        data: {
          contact,
          shipping_address: shippingAddress,
          billing_address: billingAddress,
        },
      };
      if (purchaseOrderNumber) {
        body.data.purchase_order_number = purchaseOrderNumber;
      }
      return await client.request.send(
        `/carts/${cartId}/checkout`,
        "POST",
        body,
        undefined,
        client,
        false,
        "v2",
        additionalHeaders as any,
      );
    },
    ...options,
  });
};
