"use client";

import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { epPaymentsEnvData } from "../../lib/resolve-ep-stripe-env";
import CardForm from "./CardForm";

interface CardFormProps {
  customerId: string;
}
const stripePromise = loadStripe(epPaymentsEnvData.publishableKey, {
  stripeAccount: epPaymentsEnvData.accountId,
});

const CardSection: React.FC<CardFormProps> = ({ customerId }) => {
  return (
    <Elements stripe={stripePromise}>
      <CardForm customerId={customerId} />
    </Elements>
  );
};

export default CardSection;
