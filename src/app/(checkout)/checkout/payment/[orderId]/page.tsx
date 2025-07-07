"use server";
import { getServerSideCredentialsClientWihoutAccountToken } from "../../../../../lib/epcc-server-side-credentials-client";
import PayPalOrderConfirmClient from "./PayPalOrderConfirmClient";

export default async function PayPalReturnPage({
  params,
  searchParams,
}: {
  params: { orderId: string };
  searchParams: { paypal?: string; PayerID?: string };
}) {
  const { orderId } = params;
  const paypal = searchParams?.paypal;
  const payerId = searchParams?.PayerID;

  if (paypal !== "return" || !payerId) {
    // Optionally, render an error or redirect
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-lg text-red-600">
          Missing PayPal parameters. Please contact support.
        </div>
      </div>
    );
  }
  const client = getServerSideCredentialsClientWihoutAccountToken();
  // Get the latest transaction for this order
  const transactions = await client.Transactions.All({ order: orderId });
  const data = transactions.data.find((transaction) => {
    return transaction.gateway === "paypal_express_checkout";
  });
  const transactionId = data?.id;
  if (!transactionId) throw new Error("No transaction found for this order.");

  return (
    <PayPalOrderConfirmClient
      orderId={orderId}
      payerId={payerId}
      transactionId={transactionId}
    />
  );
}
