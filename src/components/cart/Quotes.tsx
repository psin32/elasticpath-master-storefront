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

  const getCountryName = (country: string) => {
    const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(country.toUpperCase()) || country;
  };

  const generatePDF = async (quote: any) => {
    const client = getEpccImplicitClient();
    const cart = await client.Cart(quote.cart_id).With("items").Get();
    const shipping = await getShippingGroups(quote.cart_id);

    if (!quote || !cart) return;

    const doc = new jsPDF();
    doc.setFont("helvetica");
    doc.setFontSize(9);
    doc.text("Quote Details", 10, 10);
    doc.text(`Name: ${quote.first_name} ${quote.last_name}`, 10, 15);
    doc.text(`Address:`, 10, 20);
    doc.text(shipping?.data?.[0].address?.line_1 + ",", 15, 25);
    doc.text(shipping?.data?.[0].address?.city + ",", 15, 30);
    doc.text(shipping?.data?.[0].address?.postcode + ",", 15, 35);
    doc.text(getCountryName(shipping?.data?.[0].address?.country), 15, 40);
    doc.text(`Quote ID: ${quote.quote_ref}`, 10, 50);

    // Contract information if available
    if (quote.contract_term_id && contractCache[quote.contract_term_id]) {
      const contract = contractCache[quote.contract_term_id];
      doc.setFontSize(10);
      doc.text(`Contract: ${contract.display_name || "No name"}`, 10, 55);
      doc.text(`Contract ID: ${contract.id}`, 10, 60);
      if (contract.end_date) {
        doc.text(
          `End Date: ${new Date(contract.end_date).toLocaleDateString()}`,
          10,
          65,
        );
      }
    }

    doc.setFontSize(15);
    doc.text(
      `Total Amount: ${cart.data.meta?.display_price?.with_tax?.formatted}`,
      10,
      quote.contract_term_id && contractCache[quote.contract_term_id] ? 80 : 60,
    );

    const tableData = cart?.included?.items.map((item: any) => [
      item.name,
      item.quantity.toString(),
      `${item?.meta?.display_price?.with_tax?.value?.formatted}`,
    ]);

    autoTable(doc, {
      head: [["Product", "Quantity", "Total"]],
      body: tableData,
      startY:
        quote.contract_term_id && contractCache[quote.contract_term_id]
          ? 90
          : 70,
    });

    doc.save(`Quote_${quote.quote_ref}.pdf`);
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
                            {quote.status === "Approved" && (
                              <Link href={`/quote-checkout/${quote.quote_ref}`}>
                                <StatusButton className="text-sm rounded-lg">
                                  Checkout
                                </StatusButton>
                              </Link>
                            )}
                            {quote.status != "Approved" && (
                              <StatusButton
                                className="text-sm rounded-lg"
                                disabled
                              >
                                Checkout
                              </StatusButton>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <StatusButton
                              className="text-sm rounded-lg"
                              disabled={quote.status === "Completed"}
                              onClick={() => generatePDF(quote)}
                            >
                              Download PDF
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
