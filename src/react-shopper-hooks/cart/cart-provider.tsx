import React, { createContext, ReactNode } from "react";
import {
  Cart,
  CartIncluded,
  ResourceIncluded,
  CartItem,
  CartItemsResponse,
} from "@elasticpath/js-sdk";
import { CartState } from "./types/cart-types";
import { enhanceCartResponse } from "./util/enhance-cart-response";
import { StoreEvent } from "../shared";
import { cartQueryKeys, useGetCart } from "./hooks/use-get-cart";
import { useUpdateCartItem } from "./hooks/use-update-cart-items";
import { useQueryClient } from "@tanstack/react-query";
import { useRemoveCartItem } from "./hooks/use-remove-cart-item";
import {
  useAddBundleProductToCart,
  useAddCustomItemToCart,
  useAddProductToCart,
  useAddPromotionToCart,
  useDeleteCartItems,
} from "./hooks";
import { useRemovePromotionCode } from "./hooks/use-remove-promotion";
import { useAddSubscriptionItemToCart } from "./hooks/use-add-subscription-item";
import { toast } from "react-toastify";
import { useAddBulkProductToCart } from "./hooks/use-add-bulk-product";
import { useReorderToCart } from "./hooks/use-reorder";

export const CartItemsContext = createContext<
  | ({
      state: CartState | undefined;
      cartId?: string;
      emit?: (event: StoreEvent) => void;
      useScopedUpdateCartItem: () => ReturnType<typeof useUpdateCartItem>;
      useScopedRemoveCartItem: () => ReturnType<typeof useRemoveCartItem>;
      useScopedAddPromotion: () => ReturnType<typeof useAddPromotionToCart>;
      useScopedRemovePromotion: () => ReturnType<typeof useRemovePromotionCode>;
      useScopedAddProductToCart: () => ReturnType<typeof useAddProductToCart>;
      useScopedAddBulkProductToCart: () => ReturnType<
        typeof useAddBulkProductToCart
      >;
      useScopedAddCustomItemToCart: () => ReturnType<
        typeof useAddCustomItemToCart
      >;
      useScopedAddSubscriptionItemToCart: () => ReturnType<
        typeof useAddSubscriptionItemToCart
      >;
      useScopedReorderToCart: () => ReturnType<typeof useReorderToCart>;
      useScopedAddBundleProductToCart: () => ReturnType<
        typeof useAddBundleProductToCart
      >;
      useClearCart: () => ReturnType<typeof useDeleteCartItems>;
    } & Omit<ReturnType<typeof useGetCart>, "data">)
  | undefined
>(undefined);

export interface CartProviderProps {
  children: ReactNode;
  cartId?: string;
  initialState?: {
    cart?: ResourceIncluded<Cart, CartIncluded>;
  };
  emit?: (event: StoreEvent) => void;
}

export function CartProvider({
  initialState,
  children,
  emit,
  cartId = "",
}: CartProviderProps) {
  const queryClient = useQueryClient();

  const { data: rawCartData, ...rest } = useGetCart(cartId, {
    initialData: initialState?.cart,
  });

  async function invalidateCartQuery() {
    return queryClient.invalidateQueries({
      queryKey: cartQueryKeys.detail(cartId),
    });
  }

  function setCartQueryData(updatedData: CartItemsResponse) {
    // Updates the cart items in the query cache
    return queryClient.setQueryData(
      cartQueryKeys.detail(cartId),
      createCartItemsUpdater(updatedData.data),
    );
  }

  const state =
    rawCartData &&
    enhanceCartResponse({
      data: rawCartData,
      included: rest.included,
    });

  const updateCartItem = () =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useUpdateCartItem(cartId, {
      onSuccess: (updatedData) => {
        setCartQueryData(updatedData);
        invalidateCartQuery();
      },
    });

  const addProductToCart = () =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAddProductToCart(cartId, {
      onSuccess: (updatedData) => {
        setCartQueryData(updatedData);
        invalidateCartQuery();
        toast("Item added successfully in your cart", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
        });
      },
    });

  const addBulkProductToCart = () =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAddBulkProductToCart(cartId, {
      onSuccess: async (updatedData) => {
        setCartQueryData(updatedData);
        await invalidateCartQuery();
      },
    });

  const addCustomItemToCart = () =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAddCustomItemToCart(cartId, {
      onSuccess: (updatedData) => {
        setCartQueryData(updatedData);
        invalidateCartQuery();
        toast("Item added successfully in your cart", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
        });
      },
    });

  const addSubscriptionItemToCart = () =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAddSubscriptionItemToCart(cartId, {
      onSuccess: (updatedData) => {
        setCartQueryData(updatedData);
        invalidateCartQuery();
        toast("Item added successfully in your cart", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
        });
      },
    });

  const addReorderToCart = () =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useReorderToCart(cartId, {
      onSuccess: (updatedData) => {
        setCartQueryData(updatedData);
        invalidateCartQuery();
        toast("Order items added successfully in your cart", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
        });
      },
    });

  const removeCartItem = () =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useRemoveCartItem(cartId, {
      onSuccess: (updatedData) => {
        setCartQueryData(updatedData);
        invalidateCartQuery();
      },
    });

  const addPromotion = () =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAddPromotionToCart(cartId, {
      onSuccess: (updatedData) => {
        setCartQueryData(updatedData);
        invalidateCartQuery();
      },
    });

  const removePromotion = () =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useRemovePromotionCode(cartId, {
      onSuccess: (updatedData) => {
        setCartQueryData(updatedData);
        invalidateCartQuery();
      },
    });

  const addBundleItemToCart = () =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAddBundleProductToCart(cartId, {
      onSuccess: (updatedData) => {
        setCartQueryData(updatedData);
        invalidateCartQuery();
        toast("Item added successfully in your cart", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
        });
      },
    });

  const clearCart = () =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useDeleteCartItems(cartId, {
      onSuccess: async (updatedData) => {
        setCartQueryData(updatedData);
        await invalidateCartQuery();
      },
    });

  return (
    <CartItemsContext.Provider
      value={{
        state,
        emit,
        cartId: cartId ? cartId : undefined,
        useScopedUpdateCartItem: updateCartItem,
        useScopedRemoveCartItem: removeCartItem,
        useScopedAddPromotion: addPromotion,
        useScopedRemovePromotion: removePromotion,
        useScopedAddProductToCart: addProductToCart,
        useScopedAddBulkProductToCart: addBulkProductToCart,
        useScopedAddBundleProductToCart: addBundleItemToCart,
        useScopedAddCustomItemToCart: addCustomItemToCart,
        useScopedAddSubscriptionItemToCart: addSubscriptionItemToCart,
        useScopedReorderToCart: addReorderToCart,
        useClearCart: clearCart,
        ...rest,
      }}
    >
      {children}
    </CartItemsContext.Provider>
  );
}

function createCartItemsUpdater(updatedData: CartItem[]) {
  return function cartItemsUpdater(
    oldData: ResourceIncluded<Cart, CartIncluded>,
  ) {
    return {
      ...oldData,
      included: {
        items: updatedData,
      },
    };
  };
}
export const useCart = () => {
  const context = React.useContext(CartItemsContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
