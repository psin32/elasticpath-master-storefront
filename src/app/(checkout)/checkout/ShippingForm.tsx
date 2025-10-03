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
import React, { useEffect } from "react";
import { useCountries } from "../../../hooks/use-countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/select/Select";
import { ShippingGroupLink } from "./ShippingGroupLink";

export function ShippingForm() {
  const { control, getValues } = useFormContext<CheckoutFormSchemaType>();
  const { data: countries } = useCountries();

  return (
    <fieldset className="flex flex-1 flex-col gap-5">
      <div className="flex items-center justify-between">
        <legend className="text-2xl font-medium">Shipping address</legend>
        <ShippingGroupLink />
      </div>
      <div className="grid gap-4">
        <FormField
          control={control}
          name="shippingAddress.country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                }}
                defaultValue={field.value}
                required
                autoComplete="shipping country"
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
            name="shippingAddress.first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                    }}
                    autoComplete="shipping given-name"
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
            name="shippingAddress.last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                    }}
                    autoComplete="shipping family-name"
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
          name="shippingAddress.company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company (optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoComplete="shipping company"
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
          name="shippingAddress.line_1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                  }}
                  autoComplete="shipping address-line-1"
                  aria-label="Address"
                  sizeKind="mediumUntilSm"
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-[1fr] gap-4 lg:grid-cols-3">
          <FormField
            control={control}
            name="shippingAddress.city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                    }}
                    autoComplete="shipping city"
                    aria-label="City"
                    sizeKind="mediumUntilSm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="shippingAddress.region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                    }}
                    autoComplete="shipping region"
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
            name="shippingAddress.postcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postcode</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                    }}
                    autoComplete="shipping postcode"
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
        <FormField
          control={control}
          name="shippingAddress.phone_number"
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
      </div>
    </fieldset>
  );
}
