"use client";

import { useEffect, useState } from "react";
import { getCurrentCartContract, getContractDetails } from "./actions";
import { DocumentCheckIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function ContractIndicator({
  contractId,
}: {
  contractId: string;
}) {
  const [contractName, setContractName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContractInfo() {
      try {
        setLoading(true);

        if (contractId) {
          // Fetch contract details to get the name
          const contractDetails = await getContractDetails(contractId);
          console.log("Contract details:", contractDetails);

          if (contractDetails.success && contractDetails.contractName) {
            setContractName(contractDetails.contractName);
          } else {
            setError("Failed to get contract name");
          }
        }
      } catch (error) {
        console.error("Error fetching contract info:", error);
        setError("Error fetching contract info");
      } finally {
        setLoading(false);
      }
    }

    fetchContractInfo();
  }, []);

  if (loading) {
    return null;
  }

  if (!contractId) {
    return null;
  }

  return (
    <Link
      href="/contracts"
      className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
      title={`You are browsing with contract: ${contractName || "Contract"} - Click to manage contracts`}
    >
      <DocumentCheckIcon className="h-4 w-4" />
      <span className="hidden sm:inline">
        {contractName || "Contract"}
        {error && " (Error)"}
      </span>
    </Link>
  );
}
