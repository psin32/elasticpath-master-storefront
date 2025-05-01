"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import {
  formatIsoDateString,
  formatIsoTimeString,
} from "../../lib/format-iso-date-string";
import { ContractOrdersResponse } from "../../types/contract-orders";

export function ContractOrderHistoryClient({
  ordersResult,
}: {
  ordersResult: ContractOrdersResponse;
}) {
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);

  // Create a mapping of item IDs to their full data from included items
  const itemsMap = useMemo(() => {
    if (!ordersResult.success || !ordersResult.orders) {
      return {};
    }

    // Access included items safely using type assertion - we know the structure
    // but it's not defined in the ResourcePage type
    const includedItems = (ordersResult.orders as any).included?.items || [];

    const map: Record<string, any> = {};
    includedItems.forEach((item: any) => {
      map[item.id] = item;
    });
    return map;
  }, [ordersResult]);

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders((prevExpanded) =>
      prevExpanded.includes(orderId)
        ? prevExpanded.filter((id) => id !== orderId)
        : [...prevExpanded, orderId],
    );
  };

  // Helper function to format price
  const formatPrice = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  if (
    !ordersResult.success ||
    !ordersResult.orders ||
    !ordersResult.orders.data ||
    ordersResult.orders.data.length === 0
  ) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            No orders found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {ordersResult.error ||
              "There are no orders associated with this contract."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="overflow-hidden border border-gray-200 rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Order ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Total
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Payment
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">View Details</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ordersResult.orders.data.map((order) => (
              <React.Fragment key={order.id}>
                <tr
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleOrderExpand(order.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatIsoDateString(order.meta.timestamps.created_at)}
                    <div className="text-xs">
                      {formatIsoTimeString(order.meta.timestamps.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${
                          order.status === "complete"
                            ? "bg-green-100 text-green-800"
                            : order.status === "processing"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }
                      `}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatPrice(
                      order.meta.display_price.with_tax.amount,
                      order.meta.display_price.with_tax.currency,
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {order.payment || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {expandedOrders.includes(order.id) ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                    )}
                  </td>
                </tr>

                {/* Expanded Order Items */}
                {expandedOrders.includes(order.id) && (
                  <tr>
                    <td colSpan={6} className="px-0 py-0 bg-gray-50">
                      <div className="px-6 py-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Order Items
                        </h4>
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md">
                          <thead className="bg-gray-100">
                            <tr>
                              <th
                                scope="col"
                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Product
                              </th>
                              <th
                                scope="col"
                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                SKU
                              </th>
                              <th
                                scope="col"
                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Quantity
                              </th>
                              <th
                                scope="col"
                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Unit Price
                              </th>
                              <th
                                scope="col"
                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {order.relationships?.items?.data.map((itemRef) => {
                              // Get the full item data from our mapping
                              const item = itemsMap[itemRef.id];

                              if (!item) return null;

                              return (
                                <tr key={item.id} className="text-xs">
                                  <td className="px-4 py-2 whitespace-nowrap text-gray-900">
                                    {item.name || "Unnamed Product"}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                                    {item.sku || "N/A"}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                                    {item.quantity || 0}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                                    {item.unit_price
                                      ? formatPrice(
                                          item.unit_price.amount,
                                          item.unit_price.currency,
                                        )
                                      : "N/A"}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                                    {item.unit_price && item.quantity
                                      ? formatPrice(
                                          item.unit_price.amount *
                                            item.quantity,
                                          item.unit_price.currency,
                                        )
                                      : item.value
                                        ? formatPrice(
                                            item.value.amount,
                                            item.value.currency,
                                          )
                                        : "N/A"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
