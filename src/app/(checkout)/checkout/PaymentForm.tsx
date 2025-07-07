"use client";
import React, { useEffect, useState } from "react";
import { PaymentElement } from "@stripe/react-stripe-js";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import { useFormContext } from "react-hook-form";
import { CheckoutForm as CheckoutFormSchemaType } from "../../../components/checkout/form-schema/checkout-form-schema";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/form/Form";
import { Input } from "../../../components/input/Input";
import { useSession } from "next-auth/react";
import { getSavedCard } from "../../(store)/account/subscriptions/[subscriptionId]/actions";
import { useRouter } from "next/navigation";
import {
  useCheckout,
  useCheckoutWithAccount,
} from "../../../react-shopper-hooks/cart/hooks/use-checkout";
import { getEpccImplicitClient } from "../../../lib/epcc-implicit-client";
import { createPayPalPayment } from "../../../react-shopper-hooks/payments/hooks/use-payments";
import { useCart } from "../../../react-shopper-hooks";

type PaymentFormProps = {
  stripeCustomerId?: string | undefined;
  quoteId?: string;
};

export function PaymentForm({ stripeCustomerId, quoteId }: PaymentFormProps) {
  const [openTab, setOpenTab] = useState(1);
  const { data: session, status } = useSession();
  const { control, setValue } = useFormContext<CheckoutFormSchemaType>();
  const [savedCards, setSavedCards] = useState<any>([]);
  const [selectedCard, setSelectedCard] = useState<string>("");
  const router = useRouter();
  const [paypalLoading, setPaypalLoading] = useState(false);

  // Add hooks for order creation
  const { state: cartState } = useCart();
  const { mutateAsync: mutateCheckout } = useCheckout(cartState?.id || "");
  const { mutateAsync: mutateCheckoutWithAccount } = useCheckoutWithAccount(
    cartState?.id || "",
  );

  const toggleTab = (tab: number) => {
    setValue(
      "paymentMethod",
      tab === 1 ? "ep_payment" : tab === 2 ? "manual" : "saved_card",
    );
    setOpenTab(openTab === tab ? 0 : tab);
  };

  useEffect(() => {
    const fetchSavedCards = async () => {
      if (stripeCustomerId) {
        const response = await getSavedCard(stripeCustomerId);
        setSavedCards(response);
        setCardId(response?.[0]?.id);
      }
    };
    fetchSavedCards();
  }, []);

  const setCardId = (cardId: string) => {
    setSelectedCard(cardId);
    setValue("cardId", cardId);
  };

  const enablePurchaseOrderCheckout =
    process.env.NEXT_PUBLIC_ENABLE_PURCHASE_ORDER_CHECKOUT === "true" || false;
  const enablePayPal = process.env.NEXT_PUBLIC_ENABLE_PAYPAL === "true";

  // Replace the placeholder handlePayPalPayment with real logic
  async function handlePayPalPayment() {
    setPaypalLoading(true);
    try {
      // 1. Gather form data
      // (Assume react-hook-form context is up to date)
      const formValues = (control as any)._formValues || {};
      const isAuthenticated = !!formValues.account;
      const shippingAddress = formValues.shippingAddress;
      const billingAddress = formValues.sameAsShipping
        ? shippingAddress
        : formValues.billingAddress;
      const purchaseOrderNumber = formValues.purchaseOrderNumber;
      const quoteId = formValues.quoteId;
      let order;
      // 2. Create the order if needed
      if (isAuthenticated) {
        order = await mutateCheckoutWithAccount({
          contact: formValues.account,
          shippingAddress,
          billingAddress,
          purchaseOrderNumber,
          quoteId,
        });
      } else {
        order = await mutateCheckout({
          customer: formValues.guest,
          shippingAddress,
          billingAddress,
          purchaseOrderNumber,
          quoteId,
        });
      }
      const orderId = order?.data?.id;
      if (!orderId) throw new Error("Order creation failed");
      // 3. Call Elastic Path API to create PayPal payment
      const client = getEpccImplicitClient();
      const redirectUrl = await createPayPalPayment(client, orderId);
      if (!redirectUrl) throw new Error("PayPal redirect URL not received");
      // 4. Redirect user to PayPal
      window.location.href = redirectUrl;
    } catch (e: any) {
      alert(e?.message || "PayPal payment failed. Please try again.");
    } finally {
      setPaypalLoading(false);
    }
  }

  return (
    <fieldset className="flex flex-col gap-6 self-stretch">
      <div>
        <legend className="text-2xl font-medium">Payment</legend>
      </div>
      <div className="w-full mx-auto mt-2">
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div
              className="cursor-pointer p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition"
              onClick={() => toggleTab(1)}
            >
              <h2 className="text-lg font-medium text-gray-800">
                Card Payment
              </h2>
              {openTab === 1 ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-800" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-800" />
              )}
            </div>
            {openTab === 1 && (
              <PaymentElement id="payment-element" className="p-4 bg-gray-50" />
            )}
          </div>

          {/* PayPal Payment Tab */}
          {enablePayPal && (
            <div className="border rounded-lg overflow-hidden shadow-md">
              <div
                className="cursor-pointer p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition"
                onClick={() => {
                  setValue("paymentMethod", "paypal");
                  setOpenTab(openTab === 4 ? 0 : 4);
                }}
              >
                <h2 className="text-lg font-medium text-gray-800">PayPal</h2>
                {openTab === 4 ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-800" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-800" />
                )}
              </div>
              {openTab === 4 && (
                <div className="p-4 bg-gray-50">
                  <p className="text-sm mb-2">
                    You will be redirected to PayPal to complete your payment.
                  </p>
                  <button
                    type="button"
                    className="mt-4 flex items-center justify-center gap-2 px-6 py-2 rounded-md font-bold text-white transition
                      bg-[#0070BA] hover:bg-[#003087] focus:ring-2 focus:ring-[#0070BA] focus:outline-none"
                    onClick={handlePayPalPayment}
                    disabled={paypalLoading}
                    style={{ minHeight: 44 }}
                  >
                    {/* PayPal SVG Logo */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <g>
                        <path
                          d="M7.5 20.5L9.5 4.5H17.5C19.5 4.5 20.5 6.5 20 8.5L18.5 15.5C18.2 16.8 17.2 17.5 16 17.5H10.5L9.8 22H7.5V20.5Z"
                          fill="#fff"
                        />
                        <path
                          d="M9.5 4.5L7.5 20.5H9.8L10.5 17.5H16C17.2 17.5 18.2 16.8 18.5 15.5L20 8.5C20.5 6.5 19.5 4.5 17.5 4.5H9.5Z"
                          fill="#003087"
                        />
                      </g>
                    </svg>
                    {paypalLoading ? (
                      <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : null}
                    Pay with PayPal
                  </button>
                </div>
              )}
            </div>
          )}
          {enablePurchaseOrderCheckout && (
            <div className="border rounded-lg overflow-hidden shadow-md">
              <div
                className="cursor-pointer p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition"
                onClick={() => toggleTab(2)}
              >
                <h2 className="text-lg font-medium text-gray-800">
                  Purchase Order
                </h2>
                {openTab === 2 ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-800" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-800" />
                )}
              </div>
              {openTab === 2 && (
                <div className="p-4 bg-gray-50">
                  <form>
                    <FormField
                      control={control}
                      name="purchaseOrderNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Order Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              sizeKind="mediumUntilSm"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </div>
              )}
            </div>
          )}
          {session?.user && status === "authenticated" && stripeCustomerId && (
            <div className="border rounded-lg overflow-hidden shadow-md">
              <div
                className="cursor-pointer p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition"
                onClick={() => toggleTab(3)}
              >
                <h2 className="text-lg font-medium text-gray-800">
                  Saved Cards
                </h2>
                {openTab === 3 ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-800" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-800" />
                )}
              </div>
              {openTab === 3 && (
                <div className="p-4 bg-gray-50">
                  <form>
                    {savedCards.length > 0 ? (
                      <select
                        className="block w-full p-2 border border-gray-300 rounded-md"
                        value={selectedCard || ""}
                        onChange={(e) => setCardId(e.target.value)}
                      >
                        {savedCards.map((card: any) => (
                          <option key={card.id} value={card.id}>
                            {card.card.brand} **** **** **** {card.card.last4} -{" "}
                            {card.card.exp_month}/{card.card.exp_year}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-600">No saved cards available</p>
                    )}
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <FormField
        control={control}
        name="paymentMethod"
        defaultValue="ep_payment"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input {...field} sizeKind="mediumUntilSm" type="hidden" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {selectedCard && (
        <FormField
          control={control}
          name="cardId"
          defaultValue={selectedCard}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} sizeKind="mediumUntilSm" type="hidden" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      {quoteId && (
        <FormField
          control={control}
          name="quoteId"
          defaultValue={quoteId}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} sizeKind="mediumUntilSm" type="hidden" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </fieldset>
  );
}
