"use server";

import Stripe from "stripe";
import { epPaymentsEnvData } from "../../lib/resolve-ep-stripe-env";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
  stripeAccount: epPaymentsEnvData.accountId,
});

export const getSavedCard = async (customerId: string) => {
  const response = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });
  return response.data;
};

export const saveCardWithCustomer = async (
  customerId: string,
  paymentMethodId: string,
) => {
  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });
  return {
    success: true,
  };
};

export const updateCardWithCustomer = async (
  paymentMethodId: string,
  exp_month: number,
  exp_year: number,
) => {
  const updatedPaymentMethod = await stripe.paymentMethods.update(
    paymentMethodId,
    {
      card: {
        exp_month,
        exp_year,
      },
    },
  );
  return {
    success: true,
    paymentMethod: updatedPaymentMethod.card,
  };
};

export const updateCardExpiry = async (
  paymentMethodId: string,
  exp_month: number,
  exp_year: number,
) => {
  const updatedPaymentMethod = await stripe.paymentMethods.update(
    paymentMethodId,
    {
      card: {
        exp_month,
        exp_year,
      },
    },
  );
  return {
    success: true,
    paymentMethod: updatedPaymentMethod.card,
  };
};

export const getCardDetails = async (cardId: string) => {
  const response = await stripe.paymentMethods.retrieve(cardId);
  return response.card;
};
