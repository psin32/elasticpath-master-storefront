import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { useElasticPath } from "../../elasticpath";
import { ConfirmPaymentResponse } from "@elasticpath/js-sdk";
import { getCookie } from "cookies-next";

export type UsePaymentsReq = {
  orderId: string;
  payment: any;
};

export const usePayments = (
  options?: UseMutationOptions<ConfirmPaymentResponse, Error, UsePaymentsReq>,
) => {
  const { client } = useElasticPath();
  return useMutation({
    mutationFn: async ({ orderId, payment }: UsePaymentsReq) => {
      return client.Orders.Payment(orderId, payment);
    },
    ...options,
  });
};

/**
 * Initiate a PayPal payment for the given order using Elastic Path API.
 * Returns the PayPal redirect_url for user authorization.
 * See: https://elasticpath.dev/guides/How-To/paymentgateways/implement-paypal-express-checkout
 */
export async function createPayPalPayment(client: any, orderId: string) {
  // Read initial_payment_mode cookie
  let paymentMode =
    (typeof window !== "undefined" && getCookie("initial_payment_mode")) ||
    "purchase";
  // The payment object for PayPal Express Checkout
  const payment = {
    gateway: "paypal_express_checkout",
    method: paymentMode,
    options: {
      description: "PayPal Checkout",
      soft_descriptor: "EP Storefront",
      application_context: {
        brand_name: "Elastic Path Storefront",
        locale: "en-US",
        landing_page: "LOGIN",
        shipping_preference: "SET_PROVIDED_ADDRESS",
        user_action: "PAY_NOW",
        return_url:
          typeof window !== "undefined"
            ? window.location.origin +
              `/checkout/payment/${orderId}?paypal=return`
            : "",
        cancel_url:
          typeof window !== "undefined"
            ? window.location.origin +
              `/checkout/payment/${orderId}?paypal=cancel`
            : "",
      },
    },
  };
  // Call the Elastic Path API to create the PayPal payment
  const response = await client.Orders.Payment(orderId, payment);
  // Return the redirect_url for PayPal authorization
  return response.data?.client_parameters?.redirect_url;
}
