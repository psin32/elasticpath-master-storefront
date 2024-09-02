"use client";

import {
  formatIsoDateString,
  formatIsoTimeString,
} from "../../../../../lib/format-iso-date-string";

export function SubscriptionInvoices({ invoices }: { invoices: any }) {
  return (
    invoices?.data?.length > 0 && (
      <>
        <div className="flex flex-col self-stretch gap-5">
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
              <div className="inline-block py-2 align-middle sm:px-6 lg:px-8 w-full">
                <div className="ring-1 ring-black ring-opacity-5  bg-white rounded-lg shadow-lg p-2 border border-gray-300">
                  <table className="divide-y divide-gray-300 w-full">
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                        >
                          Invoice Details
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Price
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Created At
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Billing From
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Billing To
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Payment Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {invoices?.data.map((invoice: any) => {
                        const {
                          id,
                          attributes: {
                            created_at,
                            billing_period,
                            invoice_items,
                          },
                          outstanding,
                          payment_retries_limit_reached,
                          meta: {
                            price: { amount, currency },
                          },
                        } = invoice;

                        return (
                          <tr key={id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-800 sm:pl-6">
                              <div className="mt-1 text-md leading-5 text-gray-800 flex gap-2">
                                <div className="">
                                  {invoice_items[0]?.description}
                                  <div className="mt-1 text-xs leading-5 text-gray-500">
                                    {id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-800">
                              <span className="text-base font-medium">
                                {new Intl.NumberFormat("en", {
                                  style: "currency",
                                  currency,
                                }).format((amount || 0) / 100)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-800">
                              <div>{formatIsoDateString(created_at)}</div>
                              <div className="mt-1 text-xs leading-5 text-gray-500">
                                {formatIsoTimeString(created_at)}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-800">
                              <div>
                                <div>
                                  {formatIsoDateString(billing_period.start)}
                                </div>
                                <div className="mt-1 text-xs leading-5 text-gray-500">
                                  {formatIsoTimeString(billing_period.start)}
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-800">
                              <div>
                                <div>
                                  {formatIsoDateString(billing_period.end)}
                                </div>
                                <div className="mt-1 text-xs leading-5 text-gray-500">
                                  {formatIsoTimeString(billing_period.end)}
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-800">
                              {outstanding ? (
                                <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                                  Unpaid
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                  Paid
                                </span>
                              )}

                              {payment_retries_limit_reached && (
                                <div className="text-red-600 mt-2 text-xs">
                                  Payment Retry Limit Reached
                                </div>
                              )}
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
        </div>
      </>
    )
  );
}
