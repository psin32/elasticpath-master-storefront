import {
  useCheckout,
  useCheckoutWithAccount,
  useAddCustomItemToCart,
} from "../../../react-shopper-hooks";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { ReserveForm } from "./reserve-form-schema";
import { CartItemsResponse, Order, Resource } from "@elasticpath/js-sdk";
import {
  getSelectedAccount,
  parseAccountMemberCredentialsCookieStr,
} from "../../../lib/retrieve-account-member-credentials";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../lib/cookie-constants";
import { getCookie } from "cookies-next";
import { getEpccImplicitClient } from "../../../lib/epcc-implicit-client";
import { toast } from "react-toastify";
import { createNoteForOrder } from "../../../services/custom-api";

export type UseReserveCompleteProps = {
  cartId: string | undefined;
  accountToken?: string;
};

export type UseReserveCompleteReq = {
  data: ReserveForm;
};

export function useReserveComplete(
  { cartId }: UseReserveCompleteProps,
  options?: UseMutationOptions<
    {
      order: Resource<Order>;
      cart: CartItemsResponse;
    },
    unknown,
    UseReserveCompleteReq
  >,
) {
  const { mutateAsync: mutateConvertToOrder } = useCheckoutWithAccount(
    cartId ?? "",
  );
  const { mutateAsync: mutateConvertToOrderGuest } = useCheckout(cartId ?? "");
  const { mutateAsync: mutateAddCustomItemToCart } = useAddCustomItemToCart(
    cartId ?? "",
  );

  const reserveComplete = useMutation({
    mutationFn: async ({ data }) => {
      const {
        shippingAddress,
        billingAddress,
        sameAsShipping,
        shippingMethod,
        purchaseOrderNumber,
        notes,
      } = data;

      const client = getEpccImplicitClient();

      // Use shipping address from form data
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

      // Add shipping item if needed
      const shippingAmount = 0; // For reserve orders, we can set shipping to 0 or handle it differently

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
        cartInclShipping = await client.Cart(cartId || "").Items();
      }

      /**
       * Convert cart to order (reserve order without payment)
       */
      const createdOrder: any = await ("guest" in data
        ? mutateConvertToOrderGuest({
            customer: {
              email: data.guest.email,
              name: customerName,
            },
            ...checkoutProps,
            purchaseOrderNumber,
          })
        : mutateConvertToOrder({
            contact: {
              name: data.account.name,
              email: data.account.email,
            },
            ...checkoutProps,
            purchaseOrderNumber,
          }));

      // Create order note if notes are provided
      if (notes && notes.trim()) {
        try {
          let userName = "";
          if ("guest" in data) {
            userName = customerName || data.guest.email;
          } else if ("account" in data) {
            userName = data.account.name || data.account.email;
          }

          await createNoteForOrder({
            order_id: createdOrder.data.id,
            note: notes.trim(),
            added_by: userName,
          });
        } catch (error) {
          console.error("Failed to create order note:", error);
        }
      }

      return {
        order: createdOrder,
        cart: cartInclShipping,
      };
    },
    ...options,
  });

  return {
    ...reserveComplete,
  };
}
