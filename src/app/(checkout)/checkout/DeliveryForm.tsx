"use client";
import { CheckoutForm as CheckoutFormSchemaType } from "../../../components/checkout/form-schema/checkout-form-schema";
import {
  RadioGroup,
  RadioGroupItem,
} from "../../../components/radio-group/RadioGroup";
import { Label } from "../../../components/label/Label";
import { cn } from "../../../lib/cn";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../../../components/form/Form";
import { useFormContext } from "react-hook-form";
import { useShippingMethod } from "./useShippingMethod";
import { Skeleton } from "../../../components/skeleton/Skeleton";
import { EP_CURRENCY_CODE } from "../../../lib/resolve-ep-currency-code";

export function DeliveryForm() {
  const { control } = useFormContext<CheckoutFormSchemaType>();
  const { data: deliveryOptions } = useShippingMethod();
  const selectedCurrency = EP_CURRENCY_CODE;
  const selectedLanguage = "en";

  return (
    <fieldset className="flex flex-col gap-6 self-stretch">
      <div>
        <legend className="text-2xl font-medium">Delivery</legend>
      </div>
      {!deliveryOptions ? (
        <div className="flex flex-col flex-1 items-center gap-2 h-10">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <FormField
          control={control}
          name="shippingMethod"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  {deliveryOptions.map((option, optionIndex) => {
                    return (
                      <div
                        key={option.value}
                        className={cn(
                          "flex items-center border border-black/40 py-2.5 px-5",
                          optionIndex === 0
                            ? "rounded-tl-md rounded-tr-md"
                            : "border-b-1",
                          optionIndex === 0 && deliveryOptions.length !== 1
                            ? "border-b-0"
                            : "",
                          optionIndex === deliveryOptions.length - 1
                            ? "rounded-bl-md rounded-br-md"
                            : "border-b-0",
                        )}
                      >
                        <div
                          className={cn(
                            "flex flex-1 items-center space-x-2 h-10",
                          )}
                        >
                          <RadioGroupItem
                            value={option.value}
                            id={option.value}
                          />
                          <Label
                            className="hover:cursor-pointer"
                            htmlFor={option.value}
                          >
                            {option.label}
                          </Label>
                          {option.message && (
                            <div className="text-xs text-gray-500 ml-6 mt-1">
                              {option.message}
                            </div>
                          )}
                        </div>
                        <span className="">
                          {option.amount === 0 && "FREE"}
                          {option.amount > 0 &&
                            new Intl.NumberFormat(selectedLanguage, {
                              style: "currency",
                              currency: selectedCurrency,
                            }).format((option.amount || 0) / 100)}
                        </span>
                      </div>
                    );
                  })}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </fieldset>
  );
}
