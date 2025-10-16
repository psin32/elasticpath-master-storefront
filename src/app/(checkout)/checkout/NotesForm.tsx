"use client";

import { CheckoutForm as CheckoutFormSchemaType } from "../../../components/checkout/form-schema/checkout-form-schema";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/form/Form";
import { useFormContext } from "react-hook-form";
import { cn } from "../../../lib/cn";

export function NotesForm() {
  const { control } = useFormContext<CheckoutFormSchemaType>();

  return (
    <fieldset className="flex flex-col gap-5 w-full">
      <div>
        <legend className="text-2xl font-medium">Order Notes</legend>
        <p className="text-sm text-gray-600 mt-1">
          Add any special instructions or notes for your order (optional)
        </p>
      </div>
      <FormField
        control={control}
        name="notes"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel className="text-base font-semibold">Notes</FormLabel>
            <FormControl>
              <textarea
                {...field}
                placeholder="Enter any special instructions, delivery notes, or comments for your order..."
                className={cn(
                  "w-full text-black/80 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-white disabled:cursor-not-allowed disabled:opacity-50 leading-relaxed px-4 py-3 min-h-[120px] resize-y transition-all duration-200 placeholder:text-gray-400 hover:border-gray-400",
                )}
                maxLength={500}
                rows={5}
              />
            </FormControl>
            <div className="flex items-center justify-between mt-2">
              <FormMessage />
              <div className="text-xs text-gray-500 font-medium">
                {field.value?.length || 0}/500 characters
              </div>
            </div>
          </FormItem>
        )}
      />
    </fieldset>
  );
}
