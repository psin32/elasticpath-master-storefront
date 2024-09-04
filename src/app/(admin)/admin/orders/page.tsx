"use client";

import { useEffect, useState } from "react";
import { StatusButton } from "../../../../components/button/StatusButton";
import { getAllOrders } from "./actions";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSpinner from "../../../../components/AdminSpinner";

export default function OrderPage() {
  const { status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState<string>("");

  if (status == "unauthenticated") {
    router.push("/admin");
  }

  useEffect(() => {
    const fetchAllOrders = async () => {
      setLoading(true);
      try {
        const response = await getAllOrders();
        setOrders(response.data);
        setLoading(false);
      } catch (error) {
        setError("Failed to load orders.");
        setLoading(false);
      }
    };
    fetchAllOrders();
  }, []);

  const handleFindMember = async () => {
    if (!searchEmail) {
      alert("Please enter an email address to search");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getAllOrders(encodeURIComponent(searchEmail));
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      setError("No member found with the provided email.");
      setLoading(false);
      setOrders([]);
    }
  };

  const handleClearSearch = async () => {
    setSearchEmail("");
    setError(null);

    try {
      const response = await getAllOrders();
      setOrders(response.data);
    } catch (error) {
      setError("Failed to reload account members.");
    }
  };

  return (
    orders && (
      <div className="p-8 shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold mb-6">Orders</h2>

        <div className="mb-6 flex items-center space-x-4">
          <input
            type="email"
            placeholder="Enter email address"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring focus:outline-none w-1/3"
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
                        Payment
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Shipping
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
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-200">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {order?.customer?.name
                            ? order?.customer?.name
                            : order?.contact?.name}
                          <div className="text-xs text-gray-500 mt-1">
                            {order?.customer?.email
                              ? order?.customer?.email
                              : order?.contact?.email}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {order.meta.timestamps.created_at}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {order.relationships.items.data.length}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {order.meta.display_price.with_tax.formatted}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span
                            className={clsx(
                              order.payment == "paid"
                                ? "bg-green-50 text-green-700 ring-green-600/20"
                                : order.payment == "unpaid"
                                  ? "bg-red-50 text-red-700 ring-red-600/10"
                                  : "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
                              "uppercase inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                            )}
                          >
                            {order.payment}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span
                            className={clsx(
                              order.shipping == "fulfilled"
                                ? "bg-green-50 text-green-700 ring-green-600/20"
                                : "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
                              "uppercase inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                            )}
                          >
                            {order.shipping}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span
                            className={clsx(
                              order.status == "complete"
                                ? "bg-green-50 text-green-700 ring-green-600/20"
                                : "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
                              "uppercase inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                            )}
                          >
                            {order.status}
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

        {!loading && orders.length === 0 && !error && (
          <div className="p-4 text-gray-600">No orders found.</div>
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
