"use client";

import { DocumentCheckIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getContractDisplayData } from "../../app/(checkout)/create-quote/contracts-service";
import { getCurrentCartContract } from "./actions";

export default function ContractIndicator() {
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

  if (isLoading || isRefetching) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100 transition-colors">
        <div className="animate-pulse flex items-center">
          <DocumentCheckIcon className="h-4 w-4" />
          <div className="hidden sm:flex ml-1 items-center">
            <div className="h-2 w-16 bg-green-200 rounded"></div>
            <div className="ml-1 h-3 w-3 rounded-full border-2 border-green-700 border-t-transparent animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <Link
        href="/contracts"
        className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors border border-dashed border-gray-300"
        title="Select a contract to apply"
      >
        <DocumentCheckIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Select Contract</span>
      </Link>
    );
  }

  return (
    <Link
      href="/contracts"
      className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
      title={`You are browsing with contract: ${contract?.name || "Contract"} - Click to manage contracts`}
    >
      <DocumentCheckIcon className="h-4 w-4" />
      <span className="hidden sm:inline">{contract?.name || "Contract"}</span>
    </Link>
  );
}
