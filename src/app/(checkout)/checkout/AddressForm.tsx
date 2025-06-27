"use client";

import { CheckoutForm as CheckoutFormSchemaType } from "../../../components/checkout/form-schema/checkout-form-schema";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/form/Form";
import { Input } from "../../../components/input/Input";
import React from "react";
import { useCountries } from "../../../hooks/use-countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/select/Select";

type AddressFormProps = {
  title?: string;
  addressField: "shippingAddress" | "billingAddress";
};

export function AddressForm({
  title = "Address",
  addressField,
}: AddressFormProps) {
  const { control } = useFormContext<CheckoutFormSchemaType>();
  const { data: countries } = useCountries();

  return (
    <fieldset className="flex flex-1 flex-col gap-5">
      <div>
        <legend className="text-2xl font-medium">{title}</legend>
      </div>
      <div className="grid gap-4">
        <FormField
          control={control}
          name={`${addressField}.country`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                required
                autoComplete={`${addressField === "shippingAddress" ? "shipping" : "billing"} country`}
                aria-label="Country"
              >
                <SelectTrigger sizeKind="mediumUntilSm">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {countries?.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-[1fr] gap-4 lg:grid-cols-[1fr_1fr]">
          <FormField
            control={control}
            name={`${addressField}.first_name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete={`${addressField === "shippingAddress" ? "shipping" : "billing"} given-name`}
                    aria-label="First Name"
                    sizeKind="mediumUntilSm"
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${addressField}.last_name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete={`${addressField === "shippingAddress" ? "shipping" : "billing"} family-name`}
                    aria-label="Last Name"
                    sizeKind="mediumUntilSm"
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={control}
          name={`${addressField}.company_name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company (optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoComplete={`${addressField === "shippingAddress" ? "shipping" : "billing"} company`}
                  aria-label="Company"
                  sizeKind="mediumUntilSm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`${addressField}.line_1`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoComplete={`${addressField === "shippingAddress" ? "shipping" : "billing"} address-line-1`}
                  aria-label="Address"
                  sizeKind="mediumUntilSm"
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`${addressField}.line_2`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 2 (optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoComplete={`${addressField === "shippingAddress" ? "shipping" : "billing"} address-line-2`}
                  aria-label="Address Line 2"
                  sizeKind="mediumUntilSm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-[1fr] gap-4 lg:grid-cols-3">
          <FormField
            control={control}
            name={`${addressField}.city`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete={`${addressField === "shippingAddress" ? "shipping" : "billing"} city`}
                    aria-label="City"
                    sizeKind="mediumUntilSm"
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${addressField}.region`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete={`${addressField === "shippingAddress" ? "shipping" : "billing"} region`}
                    aria-label="Region"
                    sizeKind="mediumUntilSm"
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${addressField}.postcode`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postcode</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete={`${addressField === "shippingAddress" ? "shipping" : "billing"} postcode`}
                    aria-label="Postcode"
                    sizeKind="mediumUntilSm"
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {addressField === "shippingAddress" && (
          <>
            <FormField
              control={control}
              name={`${addressField}.phone_number`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="shipping tel"
                      aria-label="Phone Number"
                      sizeKind="mediumUntilSm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`${addressField}.instructions`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Instructions (optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="shipping instructions"
                      aria-label="Delivery Instructions"
                      sizeKind="mediumUntilSm"
                    />
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
