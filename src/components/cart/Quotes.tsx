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

export type QuotesProps = {
  account: AccountMemberCredential;
};

export function Quotes({ account }: QuotesProps) {
  const [quotes, setQuotes] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      const response = await getAccountQuotes(account.account_id);
      setQuotes(response.data);
    };
    init();
  }, []);

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
    doc.setFontSize(15);
    doc.text(
      `Total Amount: ${cart.data.meta?.display_price?.with_tax?.formatted}`,
      10,
      60,
    );

    const tableData = cart?.included?.items.map((item: any) => [
      item.name,
      item.quantity.toString(),
      `${item?.meta?.display_price?.with_tax?.value?.formatted}`,
    ]);

    autoTable(doc, {
      head: [["Product", "Quantity", "Total"]],
      body: tableData,
      startY: 70,
    });

    doc.save(`Quote_${quote.quote_ref}.pdf`);
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
                          Total
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Sales Agent Email
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
                        ></th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        ></th>
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
                            {new Intl.NumberFormat("en", {
                              style: "currency",
                              currency: quote.currency,
                            }).format((quote.total_amount || 0) / 100)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {quote.sales_agent_email}
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
