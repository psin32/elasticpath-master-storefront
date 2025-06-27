"use client";

import { Button } from "../../../components/button/Button";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";
import { CheckoutForm } from "../../../components/checkout/form-schema/checkout-form-schema";
import { useCart } from "../../../react-shopper-hooks";
import { useEffect, useState } from "react";

export function DeliveryContinueButton() {
  const router = useRouter();
  const { trigger, getValues } = useFormContext<CheckoutForm>();
  const { state: cart } = useCart();
  const [isAllItemsInShippingGroups, setIsAllItemsInShippingGroups] =
    useState(false);

  // Check if all cart items have shipping_group_id
  useEffect(() => {
    if (cart?.items && cart.items.length > 0) {
      const allItemsHaveShippingGroup = cart.items.every(
        (item) => item.shipping_group_id && item.shipping_group_id !== null,
      );
      setIsAllItemsInShippingGroups(allItemsHaveShippingGroup);
    } else {
      setIsAllItemsInShippingGroups(false);
    }
  }, [cart?.items]);

  const handleContinue = async () => {
    // Check if all items have shipping groups
    if (!isAllItemsInShippingGroups) {
      console.error("Not all items have shipping groups assigned");
      // You could show a toast notification here
      return;
    }

    // Validate the form before proceeding
    const isValid = await trigger();

    if (isValid) {
      router.push("/checkout/payment");
    } else {
      console.error(
        "Form validation failed. Please fill in all required fields.",
      );
      // You could show a toast notification here
    }
  };

  const isDisabled = !isAllItemsInShippingGroups;

  return (
    <Button
      onClick={handleContinue}
      disabled={isDisabled}
      className="w-full lg:w-auto"
    >
      Continue to Payment
      {isDisabled && cart?.items && cart.items.length > 0 && (
        <span className="ml-2 text-xs">
          ({cart.items.filter((item) => !item.shipping_group_id).length} items
          need shipping groups)
        </span>
      )}
    </Button>
  );
}
