"use server";

import Stripe from "stripe";
import { epPaymentsEnvData } from "../../../../../lib/resolve-ep-stripe-env";
import { gateway, SubscriptionsStateAction } from "@moltin/sdk";
import { getServerSideCredentialsClientWihoutAccountToken } from "../../../../../lib/epcc-server-side-credentials-client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
  stripeAccount: epPaymentsEnvData.accountId,
});

export const getCardDetails = async (cardId: string) => {
  const response = await stripe.paymentMethods.retrieve(cardId);
  return response.card;
};

export const associateCardWithSubscription = async (
  subscriptionId: string,
  cardId: string,
) => {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  const request: any = {
    id: subscriptionId,
    type: "subscription",
    attributes: {
      payment_authority: {
        card_id: cardId,
        type: "elastic_path_payments_stripe",
      },
    },
  };
  return await client.Subscriptions.Update(subscriptionId, request);
};

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

export const changeState = async (
  subscriptionId: string,
  state: SubscriptionsStateAction,
) => {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  await client.Subscriptions.CreateState(subscriptionId, state);
};
