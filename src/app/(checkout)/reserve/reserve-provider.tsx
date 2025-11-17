"use client";

import React, { createContext, useContext, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ReserveForm,
  accountMemberReserveFormSchema,
  anonymousReserveFormSchema,
} from "./reserve-form-schema";
import { useAuthedAccountMember, useCart } from "../../../react-shopper-hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "../../../components/form/Form";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useReserveComplete } from "./useReserveComplete";
import { deleteCookie } from "cookies-next";
import { CART_COOKIE_NAME } from "../../../lib/cookie-constants";
import { useQueryClient } from "@tanstack/react-query";
import { cartQueryKeys } from "../../../react-shopper-hooks/cart/hooks/use-get-cart";

type ReserveContext = {
  cart?: any;
  isLoading: boolean;
  completeReserve: ReturnType<typeof useReserveComplete>;
  isCompleting: boolean;
  confirmationData: ReturnType<typeof useReserveComplete>["data"];
};

const ReserveContext = createContext<ReserveContext | null>(null);

type ReserveProviderProps = {
  children?: React.ReactNode;
  cart?: any;
};

export function ReserveProvider({ children, cart }: ReserveProviderProps) {
  const { state, useClearCart } = useCart();
  const { mutateAsync: mutateClearCart } = useClearCart();
  const [confirmationData, setConfirmationData] =
    useState<ReturnType<typeof useReserveComplete>["data"]>(undefined);

  const { selectedAccountToken } = useAuthedAccountMember();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isAuthenticated = !!selectedAccountToken;

  // Determine the schema based on authentication
  const reserveFormSchema = isAuthenticated
    ? accountMemberReserveFormSchema
    : anonymousReserveFormSchema;

  const formMethods = useForm<ReserveForm>({
    reValidateMode: "onChange",
    resolver: zodResolver(reserveFormSchema),
    defaultValues: isAuthenticated
      ? {
          account: {
            email: "",
            name: "",
          },
          shippingAddress: {
            first_name: "",
            last_name: "",
            company_name: "",
            line_1: "",
            line_2: "",
            city: "",
            county: "",
            region: "",
            postcode: "",
            country: "",
            phone_number: "",
            instructions: "",
          },
          sameAsShipping: true,
          shippingMethod: "__shipping_standard",
          notes: "",
        }
      : {
          guest: {
            email: "",
          },
          shippingAddress: {
            first_name: "",
            last_name: "",
            company_name: "",
            line_1: "",
            line_2: "",
            city: "",
            county: "",
            region: "",
            postcode: "",
            country: "",
            phone_number: "",
            instructions: "",
          },
          sameAsShipping: true,
          shippingMethod: "__shipping_standard",
          notes: "",
        },
  });

  const reserveComplete = useReserveComplete({
    cartId: state?.id,
  });

  const isCompleting = reserveComplete.isPending;

  const onSubmit = async (data: ReserveForm) => {
    try {
      const result = await reserveComplete.mutateAsync({ data });

      if (result?.order) {
        setConfirmationData(result);

        // Clear cart after successful reserve
        const cartIdToClear = cart?.data?.id || state?.id;
        if (cartIdToClear) {
          try {
            await mutateClearCart({ cartId: cartIdToClear });
            deleteCookie(CART_COOKIE_NAME);

            // Invalidate cart queries
            await queryClient.invalidateQueries({
              queryKey: cartQueryKeys.detail(cartIdToClear),
            });
          } catch (error) {
            console.error("Error clearing cart:", error);
          }
        }

        toast.success("Order reserved successfully!", {
          position: "top-center",
        });
      }
    } catch (error: any) {
      console.error("Reserve order error:", error);
      
      // Check if error is about snapshot_date
      const errorDetail =
        error?.errors?.[0]?.detail ||
        error?.response?.data?.errors?.[0]?.detail ||
        error?.data?.errors?.[0]?.detail;
      
      const isSnapshotDateError =
        errorDetail &&
        typeof errorDetail === "string" &&
        errorDetail.toLowerCase().includes("snapshot date");

      if (isSnapshotDateError) {
        toast.error(
          "Cannot reserve order with preview date. Please remove the preview date from your cart to continue.",
          {
            position: "top-center",
            autoClose: 5000,
          },
        );
      } else {
        toast.error("Failed to reserve order. Please try again.", {
          position: "top-center",
          autoClose: 5000,
        });
      }
    }
  };

  return (
    <ReserveContext.Provider
      value={{
        cart: cart || state,
        isLoading: false,
        completeReserve: reserveComplete,
        isCompleting,
        confirmationData,
      }}
    >
      <Form {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onSubmit)}>{children}</form>
      </Form>
    </ReserveContext.Provider>
  );
}

export function useReserve() {
  const context = useContext(ReserveContext);
  if (!context) {
    throw new Error("useReserve must be used within ReserveProvider");
  }
  return context;
}
