"use client";

import { useState } from "react";
import { Button } from "../../../../../components/button/Button";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { cancelOrder } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface CancelOrderButtonProps {
  orderId: string;
}

export default function CancelOrderButton({ orderId }: CancelOrderButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await cancelOrder(orderId);
      toast.success("Order cancelled successfully", {
        position: "top-center",
        autoClose: 3000,
      });
      // Refresh the page to show updated status
      router.refresh();
      setShowConfirmation(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to cancel order", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        size="medium"
        onClick={() => setShowConfirmation(true)}
        className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 shadow-md"
      >
        <XCircleIcon className="w-5 h-5 mr-2" />
        Cancel Order
      </Button>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
                <XCircleIcon className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Cancel Order?
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this order? This action will
              cancel the authorized payment and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors disabled:opacity-50"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Cancelling...
                  </span>
                ) : (
                  "Yes, Cancel Order"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
