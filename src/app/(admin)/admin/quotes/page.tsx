"use client";

import { useEffect, useState } from "react";
import { StatusButton } from "../../../../components/button/StatusButton";
import { getAllQuotes } from "./actions";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSpinner from "../../../../components/AdminSpinner";
import Link from "next/link";
import {
  formatIsoDateString,
  formatIsoTimeString,
} from "../../../../lib/format-iso-date-string";

export default function QuotesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState<string>("");

  if (status == "unauthenticated") {
    router.push("/admin");
  }

  useEffect(() => {
    const fetchAllQuotes = async () => {
      setLoading(true);
      try {
        const response = await getAllQuotes();
        setQuotes(response.data);
        setLoading(false);
      } catch (error) {
        setError("Failed to load orders.");
        setLoading(false);
      }
    };
    fetchAllQuotes();
  }, []);

  const handleFindMember = async () => {
    if (!searchEmail) {
      alert("Please enter an email address to search");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getAllQuotes(encodeURIComponent(searchEmail));
      setQuotes(response.data);
      setLoading(false);
    } catch (error) {
      setError("No member found with the provided email.");
      setLoading(false);
      setQuotes([]);
    }
  };

  const handleClearSearch = async () => {
    setSearchEmail("");
    setError(null);

    try {
      const response = await getAllQuotes();
      setQuotes(response.data);
    } catch (error) {
      setError("Failed to reload account members.");
    }
  };

  return (
    quotes && (
      <div className="p-8 shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold mb-6">Quotes</h2>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4 w-1/2">
            <input
              type="email"
              placeholder="Enter account member email address"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black"
            />
            <StatusButton
              onClick={handleFindMember}
              className="text-sm rounded-lg"
            >
              Find
            </StatusButton>
            <StatusButton
              onClick={handleClearSearch}
              className="text-sm rounded-lg bg-gray-500"
            >
              Clear Search
            </StatusButton>
          </div>
          <Link href="/admin/quotes/new">
            <StatusButton className="text-sm rounded-lg ">
              Create New Quote
            </StatusButton>
          </Link>
        </div>

        {error && (
          <div className="p-4 mb-4 text-red-600 bg-red-100 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {quotes.map((quote) => (
                      <tr key={quote.id} className="hover:bg-gray-200">
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <Link
                            href={`/admin/quotes/${quote.quote_ref}`}
                            className="underline text-brand-primary"
                          >
                            {quote.quote_ref}
                          </Link>
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
                              quote.status == "Approved"
                                ? "bg-green-50 text-green-700 ring-green-600/20"
                                : "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
                              "uppercase inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                            )}
                          >
                            {quote.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {!loading && quotes.length === 0 && !error && (
          <div className="p-4 text-gray-600">No quotes found.</div>
        )}

        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
            <AdminSpinner />
          </div>
        )}
      </div>
    )
  );
}
