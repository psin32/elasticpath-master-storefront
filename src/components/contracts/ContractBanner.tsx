"use client";

import {
  DocumentCheckIcon,
  ShoppingBagIcon,
  ArrowRightIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { getContractDisplayData } from "../../app/(checkout)/create-quote/contracts-service";
import { getCurrentCartContract, removeContractFromCart } from "./actions";
import { toast } from "react-toastify";
import { useState } from "react";
import { useCart } from "../../react-shopper-hooks";
import { Dialog } from "@headlessui/react";

export default function ContractBanner() {
  const [isRemoving, setIsRemoving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const queryClient = useQueryClient();
  const { state } = useCart() as any;
  const hasCartItems = state?.items?.length > 0;

  const {
    data: contract,
    isLoading,
    isRefetching,
  } = useQuery({
    queryKey: ["contract", "active-contract"],
    queryFn: async () => {
      const cartContractResponse = await getCurrentCartContract();

      if (!cartContractResponse.contractId) {
        return null;
      }

      return getContractDisplayData(cartContractResponse.contractId);
    },
  });

  const handleStopShoppingClick = () => {
    if (hasCartItems) {
      setShowConfirmation(true);
    } else {
      handleStopShopping();
    }
  };

  const handleStopShopping = async () => {
    setIsRemoving(true);
    setShowConfirmation(false);
    try {
      const result = await removeContractFromCart();
      if (result.success) {
        toast.success("No longer shopping with contract");
        queryClient.invalidateQueries({
          queryKey: ["contract", "active-contract"],
        });
      } else {
        toast.error(result.error || "Failed to stop shopping with contract");
      }
    } catch (error) {
      console.error("Error removing contract:", error);
      toast.error("Failed to stop shopping with contract");
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading || isRefetching) {
    return (
      <div className="w-full bg-gray-100 bg-opacity-100 text-sm py-1.5 border-b border-gray-200 sticky top-0">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="animate-pulse flex items-center">
            <DocumentCheckIcon className="h-4 w-4 mr-2 text-gray-500" />
            <div className="h-2 w-40 bg-gray-300 rounded"></div>
            <div className="ml-2 h-3 w-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="w-full bg-gray-100 bg-opacity-100 text-sm py-1.5 border-b border-gray-200 sticky top-0">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center">
            <ShoppingBagIcon className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-gray-600">
              <span className="hidden sm:inline">
                Shop with specific contracts to access custom pricing and
                products
              </span>
              <span className="sm:hidden">
                Shop with contracts for custom pricing
              </span>
            </span>
          </div>
          <Link
            href="/contracts"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <span>Shop with Contract</span>
            <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full bg-green-50 bg-opacity-100 text-sm py-1.5 border-b border-green-100 sticky top-0">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center">
            <DocumentCheckIcon className="h-4 w-4 mr-2 text-green-600" />
            <span className="text-green-700">
              <span className="font-medium">Currently shopping with:</span>{" "}
              <span className="xs:inline">{contract?.name || "Contract"}</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleStopShoppingClick}
              disabled={isRemoving}
              className="flex items-center gap-1 text-red-600 hover:text-red-800 font-medium transition-colors"
            >
              {isRemoving ? (
                <>
                  <div className="h-3 w-3 rounded-full border-2 border-red-600 border-t-transparent animate-spin mr-1"></div>
                  <span>Stopping...</span>
                </>
              ) : (
                <>
                  <XMarkIcon className="h-3 w-3" />
                  <span>Stop Shopping</span>
                </>
              )}
            </button>
            <span className="text-gray-300">|</span>
            <Link
              href="/contracts"
              className="flex items-center gap-1 text-green-700 hover:text-green-800 font-medium transition-colors"
            >
              <span>Manage Contracts</span>
              <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-medium text-gray-900">
                  Stop shopping with this contract?
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-gray-500">
                  You have items in your cart. Stopping shopping with this
                  contract may change prices and could affect the availability
                  of some products.
                </Dialog.Description>

                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={() => setShowConfirmation(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    onClick={handleStopShopping}
                  >
                    Stop Shopping
                  </button>
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
