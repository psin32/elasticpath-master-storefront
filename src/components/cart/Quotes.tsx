"use client";

import { useEffect, useState } from "react";
import {
  formatIsoDateString,
  formatIsoTimeString,
} from "../../lib/format-iso-date-string";
import { StatusButton } from "../button/StatusButton";
import { AccountMemberCredential } from "../../app/(auth)/account-member-credentials-schema";
import { getAccountQuotes } from "../../app/(store)/quotes/action";
import clsx from "clsx";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getEpccImplicitClient } from "../../lib/epcc-implicit-client";
import { getShippingGroups } from "../../app/(admin)/admin/quotes/actions";
import { getMultipleContractsByIds } from "../../app/(checkout)/create-quote/contracts-service";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

export type QuotesProps = {
  account: AccountMemberCredential;
};

export function Quotes({ account }: QuotesProps) {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [contractCache, setContractCache] = useState<Record<string, any>>({});

  useEffect(() => {
    const getData = async () => {
      try {
        const res = await getAccountQuotes(account.account_id);
        if (res?.data) {
          setQuotes(res.data);

          // Load contract information for all quotes
          const contractsToFetch: string[] = res.data
            .filter((quote: any) => quote.contract_term_id)
            .map((quote: any) => quote.contract_term_id);

          // Create a unique set of contract IDs to fetch
          const uniqueContractIds: string[] = Array.from(
            new Set(contractsToFetch),
          );

          if (uniqueContractIds.length > 0) {
            const contractsResponse =
              await getMultipleContractsByIds(uniqueContractIds);

            // Transform array of contracts into a lookup object
            const contractsData: Record<string, any> = {};
            if (contractsResponse && contractsResponse.data) {
              contractsResponse.data.forEach((contract: any) => {
                contractsData[contract.id] = contract;
              });
            }

            setContractCache(contractsData);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    getData();
  }, [account?.account_id]);

  const downloadPDF = async (quoteId: string, quoteRef: string) => {
    try {
      const client = getEpccImplicitClient();
      const quoteData = quotes.find((q) => q.id === quoteId);
      if (!quoteData) return;

      const shipping = await getShippingGroups(quoteData.cart_id);
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text(`Quote #${quoteRef}`, 105, 20, { align: "center" });

      // Date
      doc.setFontSize(10);
      doc.text(
        `Date: ${formatIsoDateString(quoteData.meta.timestamps.created_at)}`,
        20,
        30,
      );

      // Contact Info
      doc.setFontSize(12);
      doc.text("Contact Information", 20, 40);
      doc.setFontSize(10);
      doc.text(`Name: ${quoteData.first_name} ${quoteData.last_name}`, 20, 50);
      doc.text(`Email: ${quoteData.email}`, 20, 55);

      // Shipping Address
      if (shipping?.data?.[0]?.address) {
        const shippingAddress = shipping.data[0].address;
        doc.setFontSize(12);
        doc.text("Shipping Address", 20, 65);
        doc.setFontSize(10);
        doc.text(
          `${shippingAddress.first_name} ${shippingAddress.last_name}`,
          20,
          75,
        );
        doc.text(`${shippingAddress.line_1}`, 20, 80);
        if (shippingAddress.line_2) {
          doc.text(`${shippingAddress.line_2}`, 20, 85);
        }
        doc.text(
          `${shippingAddress.city}, ${shippingAddress.region} ${shippingAddress.postcode}`,
          20,
          90,
        );
        doc.text(`${shippingAddress.country}`, 20, 95);
      }

      // Contract information if available
      if (
        quoteData.contract_term_id &&
        contractCache[quoteData.contract_term_id]
      ) {
        const contract = contractCache[quoteData.contract_term_id];
        doc.setFontSize(12);
        doc.text("Contract Information", 20, 105);
        doc.setFontSize(10);
        doc.text(`Contract: ${contract.display_name || "No name"}`, 20, 115);
        doc.text(
          `Start Date: ${new Date(contract.start_date).toLocaleDateString()}`,
          20,
          120,
        );
        if (contract.end_date) {
          doc.text(
            `End Date: ${new Date(contract.end_date).toLocaleDateString()}`,
            20,
            125,
          );
        }
      }

      // Quote Details
      doc.setFontSize(12);
      doc.text("Quote Summary", 20, 135);

      autoTable(doc, {
        startY: 140,
        head: [["Items", "Total"]],
        body: [
          [
            quoteData.total_items.toString(),
            new Intl.NumberFormat("en", {
              style: "currency",
              currency: quoteData.currency,
            }).format((quoteData.total_amount || 0) / 100),
          ],
        ],
      });

      doc.save(`quote-${quoteRef}.pdf`);
    } catch (e) {
      console.error(e);
    }
  };

  const getContractDisplayName = (contractId: string | null | undefined) => {
    if (!contractId) return "No Contract";

    const contract = contractCache[contractId];
    if (!contract) return "Loading...";

    return contract.display_name || `Contract #${contractId.substring(0, 8)}`;
  };

  return (
    <div className="flex flex-col lg:flex-row flex-1 self-stretch">
      <div className="flex justify-center self-stretch items-start gap-2 flex-only-grow">
        <div className="flex flex-col gap-10 p-5 lg:p-24 w-full">
          <h1 className="text-4xl font-medium">Quotes</h1>

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
                          Quote #
                        </th>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Items
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Contract
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Total
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
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {quotes.map((quote: any) => (
                        <tr key={quote.id} className="hover:bg-gray-200">
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {quote.quote_ref}
                          </td>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {quote?.first_name} {quote?.last_name}
                            <div className="text-xs text-gray-500 mt-1">
                              {quote?.email}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div>
                              {formatIsoDateString(
                                quote.meta.timestamps.created_at,
                              )}
                            </div>
                            <div className="mt-1 text-xs leading-5 text-gray-500">
                              {formatIsoTimeString(
                                quote.meta.timestamps.created_at,
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {quote.total_items}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {quote.contract_term_id ? (
                              <div className="flex items-center space-x-1">
                                <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                                <span>
                                  {getContractDisplayName(
                                    quote.contract_term_id,
                                  )}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">No Contract</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Intl.NumberFormat("en", {
                              style: "currency",
                              currency: quote.currency,
                            }).format((quote.total_amount || 0) / 100)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span
                              className={clsx(
                                quote.status == "Approved" ||
                                  quote.status == "Completed"
                                  ? "bg-green-50 text-green-700 ring-green-600/20"
                                  : "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
                                "uppercase inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                              )}
                            >
                              {quote.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <StatusButton
                              variant="secondary"
                              className="text-xs"
                              onClick={() =>
                                downloadPDF(quote.id, quote.quote_ref)
                              }
                            >
                              Download
                            </StatusButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
