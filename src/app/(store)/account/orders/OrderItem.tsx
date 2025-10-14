import { ReactNode } from "react";
import { Order, OrderItem as OrderItemType } from "@elasticpath/js-sdk";
import { ProductThumbnail } from "./[orderId]/ProductThumbnail";
import Link from "next/link";
import { formatIsoDateString } from "../../../../lib/format-iso-date-string";
import { Reorder } from "./Reorder";

export type OrderItemProps = {
  children?: ReactNode;
  order: Order;
  orderItems: OrderItemType[];
  imageUrl?: string;
};

export function OrderItem({ children, order, orderItems }: OrderItemProps) {
  // Sorted order items are used to determine which image to show
  // showing the most expensive item's image
  const sortedOrderItems = orderItems.sort(
    (a, b) => b.unit_price.amount - a.unit_price.amount,
  );

  // Helper functions for status colors
  function getPaymentStatusColor(payment: string) {
    switch ((payment || "").toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "authorized":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "unpaid":
        return "bg-red-100 text-red-800 border-red-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  }

  function getShippingStatusColor(shipping: string) {
    switch ((shipping || "").toLowerCase()) {
      case "fulfilled":
        return "bg-green-100 text-green-800 border-green-200";
      case "unfulfilled":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "partial":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }

  function getOrderStatusColor(status: string) {
    switch ((status || "").toLowerCase()) {
      case "complete":
        return "bg-green-100 text-green-800 border-green-200";
      case "incomplete":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }

  const itemCount = orderItems.length;

  return (
    <Link href={`/account/orders/${order.id}`} className="block">
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden mb-6 hover:border-brand-primary">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">
                Order #{order.external_ref ?? order.id}
              </span>
              <span
                className={`inline-block uppercase px-3 py-1 rounded-full border text-xs font-semibold ${getOrderStatusColor(order.status)}`}
              >
                {order.status}
              </span>
            </div>
            <time
              className="text-sm text-gray-600"
              dateTime={order.meta.timestamps.created_at}
            >
              {formatIsoDateString(order.meta.timestamps.created_at)}
            </time>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex gap-5 p-6">
          <div className="flex-shrink-0">
            <ProductThumbnail productId={sortedOrderItems[0].product_id} />
          </div>
          <div className="flex flex-1 flex-col gap-y-3">
            <h2 className="font-semibold text-base text-gray-900">
              {formatOrderItemsTitle(sortedOrderItems)}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M6 5v1H4.667a1.75 1.75 0 00-1.743 1.598l-.826 9.5A1.75 1.75 0 003.84 19h12.32a1.75 1.75 0 001.742-1.902l-.826-9.5A1.75 1.75 0 0015.333 6H14V5a4 4 0 00-8 0zm4-2.5A2.5 2.5 0 007.5 5v1h5V5A2.5 2.5 0 0010 2.5zM7.5 10a2.5 2.5 0 005 0V8.75a.75.75 0 011.5 0V10a4 4 0 01-8 0V8.75a.75.75 0 011.5 0V10z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </div>
            {children}
            <div className="flex flex-wrap gap-2 mt-2">
              <span
                className={`inline-block uppercase px-3 py-1.5 rounded-lg border text-xs font-semibold ${getPaymentStatusColor(order.payment)}`}
              >
                💳 {order.payment}
              </span>
              <span
                className={`inline-block uppercase px-3 py-1.5 rounded-lg border text-xs font-semibold ${getShippingStatusColor(order.shipping)}`}
              >
                📦 {order.shipping}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end justify-between">
            <span className="text-2xl font-bold text-brand-primary">
              {order.meta.display_price.with_tax.formatted}
            </span>
            <div className="flex items-center gap-2 text-brand-primary text-sm font-medium hover:underline">
              View Details
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Reorder Section */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
          <Reorder orderId={order.id} />
        </div>
      </div>
    </Link>
  );
}

function formatOrderItemsTitle(orderItems: OrderItemType[]): string {
  if (orderItems.length === 0) {
    return "No items in the order";
  }

  if (orderItems.length === 1) {
    return orderItems[0].name;
  }

  const firstTwoItems = orderItems.slice(0, 2).map((item) => item.name);
  const remainingItemCount = orderItems.length - 2;

  if (remainingItemCount === 0) {
    return `${firstTwoItems.join(" and ")} in the order`;
  }

  return `${firstTwoItems.join(", ")} and ${remainingItemCount} other item${
    remainingItemCount > 1 ? "s" : ""
  }`;
}
