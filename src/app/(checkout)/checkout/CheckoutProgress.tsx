"use client";

import { usePathname } from "next/navigation";
import { CheckIcon } from "@heroicons/react/24/solid";

type CheckoutProgressProps = {
  className?: string;
};

export function CheckoutProgress({ className = "" }: CheckoutProgressProps) {
  const pathname = usePathname();
  const isDeliveryPage = pathname === "/checkout/delivery";
  const isPaymentPage = pathname === "/checkout/payment";

  return (
    <div className={`flex items-center justify-center gap-4 py-4 ${className}`}>
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
            isDeliveryPage || isPaymentPage
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted text-muted-foreground border-muted"
          }`}
        >
          {isPaymentPage ? (
            <CheckIcon className="w-4 h-4" />
          ) : (
            <span className="text-sm font-medium">1</span>
          )}
        </div>
        <span
          className={`text-sm font-medium ${
            isDeliveryPage ? "text-primary" : "text-muted-foreground"
          }`}
        >
          Delivery
        </span>
      </div>

      <div className="w-8 h-px bg-border" />

      <div className="flex items-center gap-2">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
            isPaymentPage
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted text-muted-foreground border-muted"
          }`}
        >
          {isPaymentPage ? (
            <span className="text-sm font-medium">2</span>
          ) : (
            <span className="text-sm font-medium">2</span>
          )}
        </div>
        <span
          className={`text-sm font-medium ${
            isPaymentPage ? "text-primary" : "text-muted-foreground"
          }`}
        >
          Payment
        </span>
      </div>
    </div>
  );
}
