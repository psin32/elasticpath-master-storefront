"use client";

import React, { useState, useEffect } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import {
  getCardDetails,
  getSavedCard,
  saveCardWithCustomer,
  updateCardExpiry,
  updateCardWithCustomer,
} from "./actions";
import { StatusButton } from "../button/StatusButton";
import { useRouter } from "next/navigation";

interface CardFormProps {
  customerId: string;
}

const CardForm: React.FC<CardFormProps> = ({ customerId }) => {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [cardData, setCardData] = useState<any>();
  const [isEditing, setIsEditing] = useState(false);
  const [expMonth, setExpMonth] = useState<number>();
  const [expYear, setExpYear] = useState<number>();
  const [cardUpdateLoading, setCardUpdateLoading] = useState<boolean>(false);
  const [savedCards, setSavedCards] = useState<any>([]);
  const [selectedCard, setSelectedCard] = useState<string>("");

  useEffect(() => {
    const fetchSavedCards = async () => {
      if (customerId) {
        const response = await getSavedCard(customerId);
        setSavedCards(response);
        setSelectedCard(response?.[0]?.id);
        setExpMonth(response?.[0]?.card?.exp_month);
        setExpYear(response?.[0]?.card?.exp_year);
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
      const response = await getSavedCard(customerId);
      setSavedCards(response);
      setSelectedCard(paymentMethod?.id);
    } else {
      setMessage("Failed to save card");
    }
    router.refresh();
    setLoading(false);
  };

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    const cardData = savedCards.find((card: any) => card.id === selectedCard);
    setExpMonth(cardData.card.exp_month);
    setExpYear(cardData.card.exp_year);
    setIsEditing(false);
  };

  const handleUpdate = async (cardId: string) => {
    setCardUpdateLoading(true);
    if (expMonth && expMonth > 0 && expMonth <= 12 && expYear) {
      await updateCardExpiry(cardId, expMonth, expYear);
      const card = await getCardDetails(cardId);
      if (card) {
        setCardData(card);
        setExpMonth(card.exp_month);
        setExpYear(card.exp_year);
        const response = await getSavedCard(customerId);
        setSavedCards(response);
        setSelectedCard(cardId);
      }
      setIsEditing(false);
    }
    setCardUpdateLoading(false);
  };

  const handleChangeCard = async (cardId: string) => {
    const cardData = savedCards.find((card: any) => card.id === cardId);
    setExpMonth(cardData.card.exp_month);
    setExpYear(cardData.card.exp_year);
    setIsEditing(false);
    setSelectedCard(cardId);
  };

  return (
    <div className="w-1/2">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-4 pb-2">Saved Cards</h1>
        {savedCards.length > 0 ? (
          <>
            <select
              className="block w-full p-2 border border-gray-300 rounded-md"
              value={selectedCard || ""}
              onChange={(e) => handleChangeCard(e.target.value)}
            >
              {savedCards.map((card: any) => (
                <option key={card.id} value={card.id}>
                  {card.card.brand} **** **** **** {card.card.last4} -{" "}
                  {card.card.exp_month}/{card.card.exp_year}
                </option>
              ))}
            </select>
            <div className="mb-2">
              {isEditing && (
                <>
                  <span className="font-bold">Expiration:</span>
                  <div className="flex space-x-2 mt-2">
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={expMonth}
                      onChange={(e) => setExpMonth(parseInt(e.target.value))}
                      className="w-16 p-1 border border-gray-300 rounded"
                      placeholder="MM"
                    />
                    <input
                      type="number"
                      min="2023"
                      max="2050"
                      value={expYear}
                      onChange={(e) => setExpYear(parseInt(e.target.value))}
                      className="w-20 p-1 border border-gray-300 rounded"
                      placeholder="YYYY"
                    />
                  </div>
                </>
              )}

              {isEditing ? (
                <div className="flex space-x-4 mt-4">
                  <StatusButton
                    className="py-2 text-sm mt-6 uppercase"
                    onClick={() => handleUpdate(selectedCard)}
                    status={cardUpdateLoading ? "loading" : "idle"}
                  >
                    Update
                  </StatusButton>
                  <StatusButton
                    className="py-2 text-sm mt-6 bg-gray-300 text-gray-700 uppercase"
                    onClick={handleCancel}
                  >
                    Cancel
                  </StatusButton>
                </div>
              ) : (
                <StatusButton
                  className="py-2 text-sm mt-6 uppercase"
                  onClick={handleEdit}
                >
                  Edit Card
                </StatusButton>
              )}
            </div>
          </>
        ) : (
          <p className="text-gray-600">No saved cards available</p>
        )}
      </div>
      <div className="mb-6">
        <div className="max-w-2xl mx-auto mt-10 bg-white">
          <h1 className="text-2xl font-semibold mb-4 pb-2">Add a New Card</h1>
          <form onSubmit={handleCardSave}>
            <div className="p-4 border border-gray-300 rounded-md mb-4">
              <CardElement className="p-2" options={{ hidePostalCode: true }} />
            </div>
            <StatusButton
              className="py-2 text-sm mt-6 uppercase"
              type="submit"
              status={loading ? "loading" : "idle"}
            >
              Save Card
            </StatusButton>
          </form>

          {message && (
            <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardForm;
