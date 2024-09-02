// app/card/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  getSavedCard,
  saveCardWithCustomer,
  updateCardWithCustomer,
} from "./actions";
import { epPaymentsEnvData } from "../../../lib/resolve-ep-stripe-env";

const stripePromise = loadStripe(epPaymentsEnvData.publishableKey, {
  stripeAccount: epPaymentsEnvData.accountId,
});

interface CardFormProps {
  customerId: string;
}

const CardForm: React.FC<CardFormProps> = ({ customerId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [savedCards, setSavedCards] = useState<any>([]);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [expMonth, setExpMonth] = useState<string>("");
  const [expYear, setExpYear] = useState<string>("");

  useEffect(() => {
    const fetchSavedCards = async () => {
      if (customerId) {
        const response = await getSavedCard(customerId);
        setSavedCards(response);
      }
    };
    fetchSavedCards();
  }, [customerId]);

  const handleCardSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (error) {
      setMessage(error.message || "Error occurred");
      setLoading(false);
      return;
    }

    const result = await saveCardWithCustomer(customerId, paymentMethod?.id);
    if (result.success) {
      setMessage("Card saved successfully!");
      setSavedCards((prev: any) => [...prev, paymentMethod]);
    } else {
      setMessage("Failed to save card");
    }

    setLoading(false);
  };

  const handleCardUpdate = async () => {
    if (!selectedCard) {
      setMessage("No card selected for update");
      return;
    }

    setLoading(true);

    if (expMonth && expYear) {
      const result = await updateCardWithCustomer(
        selectedCard,
        Number(expMonth),
        Number(expYear),
      );
      if (result.success) {
        setMessage("Card updated successfully!");
        const response = await getSavedCard(customerId);
        setSavedCards(response);
      } else {
        setMessage("Failed to update card");
      }

      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Manage Cards
      </h2>

      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Saved Cards</h3>
        {savedCards.length > 0 ? (
          <select
            className="block w-full p-2 border border-gray-300 rounded-md"
            value={selectedCard || ""}
            onChange={(e) => setSelectedCard(e.target.value)}
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
      </div>

      {selectedCard && (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Update Expiration Date
            </h3>
            <div className="flex space-x-4">
              <input
                type="number"
                placeholder="MM"
                value={expMonth}
                onChange={(e) => setExpMonth(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <input
                type="number"
                placeholder="YYYY"
                value={expYear}
                onChange={(e) => setExpYear(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <button
            onClick={handleCardUpdate}
            disabled={loading}
            className={`w-full py-2 px-4 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Updating..." : "Update Card"}
          </button>
        </>
      )}

      <h3 className="text-lg font-medium text-gray-700 mb-2">Add a New Card</h3>
      <form onSubmit={handleCardSave}>
        <div className="p-4 border border-gray-300 rounded-md mb-4">
          <CardElement className="p-2" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Saving..." : "Save Card"}
        </button>
      </form>

      {message && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md">
          {message}
        </div>
      )}
    </div>
  );
};

const CardPage: React.FC = () => {
  const customerId = "cus_Ql1kNe8darwUKF"; // Replace with actual customerId

  return (
    <Elements stripe={stripePromise}>
      <CardForm customerId={customerId} />
    </Elements>
  );
};

export default CardPage;
