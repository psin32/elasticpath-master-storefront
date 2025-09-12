import {
  useAddCustomItemToCart,
  useCheckout,
  useCheckoutWithAccount,
  useOrderConfirm,
  usePayments,
} from "../../../react-shopper-hooks";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { CheckoutForm } from "../../../components/checkout/form-schema/checkout-form-schema";
import { useShippingMethod } from "./useShippingMethod";
import {
  CartItemsResponse,
  ConfirmPaymentResponse,
  Order,
  Resource,
} from "@elasticpath/js-sdk";
import { useElements, useStripe } from "@stripe/react-stripe-js";
import {
  getSelectedAccount,
  parseAccountMemberCredentialsCookieStr,
} from "../../../lib/retrieve-account-member-credentials";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../lib/cookie-constants";
import { getCookie } from "cookies-next";
import { getEpccImplicitClient } from "../../../lib/epcc-implicit-client";
import { toast } from "react-toastify";

export type UsePaymentCompleteProps = {
  cartId: string | undefined;
  accountToken?: string;
};

export type UsePaymentCompleteReq = {
  data: CheckoutForm;
};

export function usePaymentComplete(
  { cartId }: UsePaymentCompleteProps,
  options?: UseMutationOptions<
    {
      order: Resource<Order>;
      payment: ConfirmPaymentResponse;
      cart: CartItemsResponse;
    },
    unknown,
    UsePaymentCompleteReq
  >,
) {
  const { mutateAsync: mutatePayment } = usePayments();
  const { mutateAsync: mutateConvertToOrder } = useCheckoutWithAccount(
    cartId ?? "",
  );
  const { mutateAsync: mutateConvertToOrderGuest } = useCheckout(cartId ?? "");
  const { mutateAsync: mutateAddCustomItemToCart } = useAddCustomItemToCart(
    cartId ?? "",
  );
  const { mutateAsync: mutateConfirmOrder } = useOrderConfirm();

  const stripe = useStripe() as any;
  const elements = useElements();

  const { shippingMethods } = useShippingMethod();

  const paymentComplete = useMutation({
    mutationFn: async ({ data }) => {
      const {
        shippingAddress,
        billingAddress,
        sameAsShipping,
        shippingMethod,
        purchaseOrderNumber,
        paymentMethod,
        cardId,
        quoteId,
      } = data;

      const client = getEpccImplicitClient();
      const cookieValue =
        getCookie(ACCOUNT_MEMBER_TOKEN_COOKIE_NAME)?.toString() || "";
      let stripe_customer_id = null;
      if (!("guest" in data) && cookieValue) {
        const accountMemberCookie =
          parseAccountMemberCredentialsCookieStr(cookieValue);
        if (accountMemberCookie) {
          const selectedAccount = getSelectedAccount(accountMemberCookie);
          const response: any = await client.Accounts.Get(
            selectedAccount.account_id,
          );
          stripe_customer_id = response.data.stripe_customer_id;
        }
      }

      // Use shipping address from shipping groups or fallback to form data
      const effectiveShippingAddress = shippingAddress || {
        first_name: "",
        last_name: "",
        line_1: "",
        city: "",
        postcode: "",
        country: "",
      };

      const customerName =
        `${effectiveShippingAddress.first_name || ""} ${effectiveShippingAddress.last_name || ""}`.trim() ||
        "Customer";

      const checkoutProps = {
        billingAddress:
          billingAddress && !sameAsShipping
            ? billingAddress
            : effectiveShippingAddress,
        shippingAddress: effectiveShippingAddress,
      };

      /**
       * The handling of shipping options is not production ready.
       * You must implement your own based on your business needs.
       */
      const shippingAmount =
        shippingMethods.find((method) => method.value === shippingMethod)
          ?.amount ?? 0;

      /**
       * Using a cart custom_item to represent shipping for demo purposes.
       * Skip adding shipping item for standard shipping method.
       */
      let cartInclShipping;
      if (shippingMethod && shippingMethod !== "__shipping_standard") {
        cartInclShipping = await mutateAddCustomItemToCart({
          type: "custom_item",
          name: "Shipping",
          sku: shippingMethod || "standard",
          quantity: 1,
          price: {
            amount: shippingAmount,
            includes_tax: true,
          },
        });
      } else {
        // For standard shipping, get the current cart items without adding shipping item
        cartInclShipping = await client.Cart(cartId || "").Items();
      }

      if (paymentMethod === "ep_payment") {
        await elements?.submit();
      }

      /**
       * 1. Convert our cart to an order we can pay
       */
      const createdOrder: any = await ("guest" in data
        ? mutateConvertToOrderGuest({
            customer: {
              email: data.guest.email,
              name: customerName,
            },
            ...checkoutProps,
            purchaseOrderNumber,
            quoteId,
          })
        : mutateConvertToOrder({
            contact: {
              name: data.account.name,
              email: data.account.email,
            },
            ...checkoutProps,
            purchaseOrderNumber,
            quoteId,
          }));

      let paymentRequest: any = {};
      // Read initial_payment_mode cookie
      let paymentMode =
        (typeof window !== "undefined" && getCookie("initial_payment_mode")) ||
        "purchase";
      if (paymentMethod === "manual") {
        paymentRequest = {
          orderId: createdOrder.data.id,
          payment: {
            gateway: "manual",
            method: paymentMode,
          },
        };
      }

      if (paymentMethod != "manual") {
        paymentRequest = {
          orderId: createdOrder.data.id,
          payment: {
            gateway: "elastic_path_payments_stripe",
            method: paymentMode,
          },
        };
      }

      const subsItem = createdOrder.included.items.filter(
        (item: any) => item.subscription_offering_id,
      );

      if (cardId && paymentMethod === "saved_card") {
        paymentRequest.payment.payment = cardId;
      }

      if (stripe_customer_id) {
        paymentRequest.payment.options = {
          customer: stripe_customer_id,
          setup_future_usage: "off_session",
        };
      }

      if (
        !("guest" in data) &&
        stripe_customer_id &&
        paymentMethod === "ep_payment"
      ) {
        const effectiveBillingAddress =
          billingAddress || effectiveShippingAddress;
        const { error, paymentMethod } = await stripe?.createPaymentMethod({
          elements,
          params: {
            billing_details: {
              name:
                `${effectiveBillingAddress.first_name || ""} ${effectiveBillingAddress.last_name || ""}`.trim() ||
                "Customer",
              address: {
                country: effectiveBillingAddress.country || "",
                postal_code: effectiveBillingAddress.postcode || "",
                state: effectiveBillingAddress.region || "",
                city: effectiveBillingAddress.city || "",
                line1: effectiveBillingAddress.line_1 || "",
                line2: effectiveBillingAddress.line_2 || "",
              },
            },
          },
        });
        paymentRequest.payment.payment = paymentMethod.id;
        paymentRequest.payment.options = {
          customer: stripe_customer_id,
          setup_future_usage: "off_session",
        };
      }

      /**
       * 2. Start payment against the order
       */
      const confirmedPayment = await mutatePayment(paymentRequest, {
        onError: (error: any) => {
          if (error?.errors?.[0]?.detail) {
            toast.error(error?.errors?.[0]?.detail, {
              position: "top-center",
              autoClose: 3000,
              hideProgressBar: false,
            });
          }
        },
      });

      if (paymentMethod === "ep_payment" && subsItem?.length == 0) {
        /**
         * 3. Confirm the payment with Stripe
         */
        const effectiveBillingAddress =
          billingAddress || effectiveShippingAddress;
        const stripeConfirmResponse = await stripe?.confirmPayment({
          elements: elements!,
          clientSecret: confirmedPayment.data.payment_intent.client_secret,
          redirect: "if_required",
          confirmParams: {
            return_url: `${window.location.href}/thank-you`, // TODO have to confirm if this is needed and what is should be
            payment_method_data: {
              billing_details: {
                address: {
                  country: effectiveBillingAddress.country || "",
                  postal_code: effectiveBillingAddress.postcode || "",
                  state: effectiveBillingAddress.region || "",
                  city: effectiveBillingAddress.city || "",
                  line1: effectiveBillingAddress.line_1 || "",
                  line2: effectiveBillingAddress.line_2 || "",
                },
              },
            },
          },
        });

        if (stripeConfirmResponse?.error) {
          console.error(
            "Stripe confirm payment error: ",
            stripeConfirmResponse,
          );
          // throw new Error(stripeConfirmResponse.error.message);
        }

        /**
         * 4. Confirm the payment with Elastic Path
         */
        await mutateConfirmOrder({
          orderId: createdOrder.data.id,
          transactionId: confirmedPayment.data.id,
          options: {},
        });
      }

      return {
        order: createdOrder,
        payment: confirmedPayment,
        cart: cartInclShipping,
      };
    },
    ...options,
  });

  return {
    ...paymentComplete,
  };
}
