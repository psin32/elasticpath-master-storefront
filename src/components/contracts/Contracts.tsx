"use client";

import { useEffect, useState } from "react";
import {
  formatIsoDateString,
  formatIsoTimeString,
} from "../../lib/format-iso-date-string";
import { AccountMemberCredential } from "../../app/(auth)/account-member-credentials-schema";
import { getAllActiveContracts } from "../../app/(checkout)/create-quote/contracts-service";
import clsx from "clsx";
import Link from "next/link";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

export type ContractsProps = {
  account: AccountMemberCredential;
};

export function Contracts({ account }: ContractsProps) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await getAllActiveContracts();
        if (response?.data) {
          setContracts(response.data);
        }
      } catch (error) {
        console.error("Error fetching contracts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  const getContractStatus = (contract: any) => {
    const now = new Date();
    const startDate = new Date(contract.start_date);
    const endDate = contract.end_date ? new Date(contract.end_date) : null;

    if (endDate && now > endDate) {
      return "Expired";
    } else if (now < startDate) {
      return "Pending";
    } else {
      return "Active";
    }
  };

  return (
    <div className="flex flex-col lg:flex-row flex-1 self-stretch">
      <div className="flex justify-center self-stretch items-start gap-2 flex-only-grow">
        <div className="flex flex-col gap-10 p-5 lg:p-24 w-full">
          <h1 className="text-4xl font-medium">Contract Terms</h1>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center mt-8">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                No contracts found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You don&apos;t have any contracts associated with your account.
              </p>
            </div>
          ) : (
            <div className="mt-8 flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                          >
                            Contract Name
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Start Date
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            End Date
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Created
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {contracts.map((contract) => {
                          const status = getContractStatus(contract);
                          return (
                            <tr key={contract.id} className="hover:bg-gray-200">
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                <div className="flex items-center space-x-2">
                                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                                  <span>
                                    {contract.display_name ||
                                      `Contract ${contract.id.substring(0, 8)}`}
                                  </span>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {formatIsoDateString(contract.start_date)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {contract.end_date ? (
                                  formatIsoDateString(contract.end_date)
                                ) : (
                                  <span className="text-gray-400">
                                    No end date
                                  </span>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <div>
                                  {formatIsoDateString(
                                    contract.meta?.timestamps?.created_at,
                                  )}
                                </div>
                                <div className="mt-1 text-xs leading-5 text-gray-500">
                                  {formatIsoTimeString(
                                    contract.meta?.timestamps?.created_at,
                                  )}
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <span
                                  className={clsx(
                                    status === "Active"
                                      ? "bg-green-50 text-green-700 ring-green-600/20"
                                      : status === "Expired"
                                        ? "bg-red-50 text-red-700 ring-red-600/20"
                                        : "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
                                    "uppercase inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                  )}
                                >
                                  {status}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <Link
                                  href={`/contracts/${contract.id}`}
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  View Details
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
