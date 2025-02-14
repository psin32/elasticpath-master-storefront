"use client";

import React, { useState } from "react";
import {
  AddressElement,
  LinkAuthenticationElement,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { useFormContext } from "react-hook-form";
import { CheckoutForm as CheckoutFormSchemaType } from "../../../components/checkout/form-schema/checkout-form-schema";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../../../components/form/Form";
import { Input } from "../../../components/input/Input";

type StripeAddressProps = {
  line1: string;
  line2: string | null;
  city: string;
  country: string;
  postal_code: string;
  state: string;
};

type ExpressCheckoutPaymentFormProps = {
  isAnonymous: boolean;
};

export function ExpressCheckoutPaymentForm({
  isAnonymous,
}: ExpressCheckoutPaymentFormProps) {
  const { control, setValue } = useFormContext<CheckoutFormSchemaType>();

  const [shippingAddress, setShippingAddress] =
    useState<StripeAddressProps | null>();
  const [billingAddress, setBillingAddress] =
    useState<StripeAddressProps | null>();
  const [name, setName] = useState<string | null>();
  const enableExpressCheckout: boolean =
    process.env.NEXT_PUBLIC_ENABLE_EXPRESS_CHECKOUT === "true" || false;

  const setAddressDetails = () => {
    setValue("shippingMethod", "__shipping_standard");
    setValue("sameAsShipping", true);
    setValue("paymentMethod", "ep_payment");
    if (name && shippingAddress) {
      const firstName = name.split(" ")[0];
      const lastName = name.split(" ")[1];

      setValue("shippingAddress", {
        postcode: shippingAddress.postal_code,
        line_1: shippingAddress.line1,
        city: shippingAddress.city,
        county: shippingAddress.state,
        country: shippingAddress.country,
        first_name: firstName,
        last_name: lastName,
        region: shippingAddress.state,
      });
    }

    if (name && billingAddress) {
      const firstName = name.split(" ")[0];
      const lastName = name.split(" ")[1];

      setValue("billingAddress", {
        postcode: billingAddress.postal_code,
        line_1: billingAddress.line1,
        city: billingAddress.city,
        county: billingAddress.state,
        country: billingAddress.country,
        first_name: firstName,
        last_name: lastName,
        region: billingAddress.state,
      });
    }
  };

  const setEmailAddress = (email: string) => {
    setValue("guest", {
      email,
    });
  };

  return (
    <fieldset className="flex flex-col gap-6 self-stretch">
      <div>
        <legend className="text-2xl font-medium">Your Info</legend>
      </div>
      {enableExpressCheckout && (
        <>
          {isAnonymous && (
            <LinkAuthenticationElement
              onChange={(event) => {
                if (event.complete) {
                  setEmailAddress(event.value.email);
                }
              }}
            />
          )}
          <AddressElement
            options={{
              mode: "shipping",
            }}
            onChange={(event) => {
              if (event.complete) {
                const address = event.value.address;
                setShippingAddress(address);
                setName(event.value.name);
              } else {
                setShippingAddress(null);
                setName(null);
              }
              setAddressDetails();
            }}
          ></AddressElement>
          <AddressElement
            options={{
              mode: "billing",
            }}
            onChange={(event) => {
              if (event.complete) {
                const address = event.value.address;
                setBillingAddress(address);
              } else {
                setBillingAddress(null);
              }
              setAddressDetails();
            }}
          ></AddressElement>
        </>
      )}
      <PaymentElement id="payment-element" />
      <div>
        {shippingAddress && (
          <>
            <FormField
              control={control}
              name="shippingAddress.first_name"
              defaultValue={name?.split(" ")?.[0]}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} type="hidden" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="shippingAddress.last_name"
              defaultValue={name?.split(" ")?.[1]}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} type="hidden" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="shippingAddress.line_1"
              defaultValue={shippingAddress.line1}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} type="hidden" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="shippingAddress.city"
              defaultValue={shippingAddress.city}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} type="hidden" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="shippingAddress.postcode"
              defaultValue={shippingAddress.postal_code}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} type="hidden" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="shippingAddress.country"
              defaultValue={shippingAddress.country}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} type="hidden" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="shippingMethod"
              defaultValue="__shipping_standard"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} type="hidden" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="paymentMethod"
              defaultValue="ep_payment"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} type="hidden" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isAnonymous && (
              <FormField
                control={control}
                name="guest.email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} type="hidden" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        )}

        {billingAddress && (
          <>
            <FormField
              control={control}
              name="billingAddress.first_name"
              defaultValue={name?.split(" ")?.[0]}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} type="hidden" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="billingAddress.last_name"
              defaultValue={name?.split(" ")?.[1]}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} type="hidden" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="billingAddress.line_1"
              defaultValue={billingAddress.line1}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} type="hidden" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="billingAddress.city"
              defaultValue={billingAddress.city}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} type="hidden" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="billingAddress.postcode"
              defaultValue={billingAddress.postal_code}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} type="hidden" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="billingAddress.country"
              defaultValue={billingAddress.country}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} type="hidden" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </div>
    </fieldset>
  );
}
