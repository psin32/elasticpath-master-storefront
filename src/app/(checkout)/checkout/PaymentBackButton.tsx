"use client";

import { Button } from "../../../components/button/Button";
import { useRouter } from "next/navigation";

export function PaymentBackButton() {
  const router = useRouter();

  return (
    <Button
      variant="secondary"
      onClick={() => router.push("/checkout/delivery")}
      className="w-full lg:w-auto"
    >
      ← Back to Delivery
    </Button>
  );
}
