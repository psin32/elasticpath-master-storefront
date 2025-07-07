"use client";
import { useEffect, useState } from "react";
import { useOrderConfirm } from "../../../../../react-shopper-hooks/order/hooks/use-order-confirm";
import { getEpccImplicitClient } from "../../../../../lib/epcc-implicit-client";
import { OrderConfirmation } from "../../OrderConfirmation";

export default function PayPalOrderConfirmClient({
  orderId,
  payerId,
  transactionId,
}: {
  orderId: string;
  payerId: string;
  transactionId: string;
}) {
  const { mutateAsync: mutateConfirmOrder } = useOrderConfirm();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState<string>("");
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    async function confirmOrder() {
      setStatus("loading");
      try {
        await mutateConfirmOrder({
          orderId,
          transactionId,
          options: {
            gateway: "paypal_express_checkout",
            method: "purchase",
            payment: payerId,
          },
        });
        const client = getEpccImplicitClient();
        const orderResponse = await client.Orders.With("items").Get(orderId);
        setOrder(orderResponse);
        setStatus("success");
      } catch (e: any) {
        setStatus("error");
        setMessage(
          e?.errors?.[0]?.detail ||
            e?.message ||
            "There was an error confirming your PayPal payment.",
        );
      }
    }
    confirmOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, payerId, transactionId]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-lg">Confirming your PayPal payment...</div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-lg text-red-600">{message}</div>
      </div>
    );
  }

  if (status === "success" && order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <OrderConfirmation order={order} />
      </div>
    );
  }

  return null;
}
