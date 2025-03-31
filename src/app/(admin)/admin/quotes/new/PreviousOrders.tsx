import clsx from "clsx";
import React, { useEffect, useState } from "react";
import {
  formatIsoDateString,
  formatIsoTimeString,
} from "../../../../../lib/format-iso-date-string";
import { StatusButton } from "../../../../../components/button/StatusButton";
import { useCart } from "../../../../../react-shopper-hooks";
import { getAccountOrderDetails } from "../actions";

export default function PreviousOrders({ account_id }: { account_id: string }) {
  const { useScopedAddProductToCart, useScopedReorderToCart } = useCart();
  const { mutate: mutateAddItem, isPending: isPendingAddItem } =
    useScopedAddProductToCart();
  const { mutate: mutateReorder, isPending: isPendingReorder } =
    useScopedReorderToCart();
  const [loadingAddAll, setLoadingAddAll] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [itemId, setItemId] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");

  const [orders, setOrders] = useState<any>({
    data: [],
    included: { items: [] },
  });

  useEffect(() => {
    const init = async () => {
      try {
        const response = await getAccountOrderDetails(account_id);
        setOrders(response);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };
    init();
  }, [account_id]);

  const handleAddItem = async (item: any) => {
    setItemId(item.id);
    setLoadingAdd(true);
    mutateAddItem(
      { productId: item.product_id, quantity: item.quantity },
      {
        onSuccess: () => {
          setLoadingAdd(false);
          setItemId("");
        },
      },
    );
  };

  const handleAddAll = async (order: any) => {
    setOrderId(order.id);
    setLoadingAddAll(true);
    mutateReorder(
      {
        data: {
          type: "order_items",
          order_id: order.id,
        },
        options: {
          add_all_or_nothing: false,
        },
      },
      {
        onSuccess: () => {
          setLoadingAddAll(false);
          setOrderId("");
        },
      },
    );
  };

  return (
    orders?.data.length > 0 && (
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Date
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Amount
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Items
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {orders.data.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-200">
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div>
                          {formatIsoDateString(
                            order.meta.timestamps.created_at,
                          )}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-gray-500">
                          {formatIsoTimeString(
                            order.meta.timestamps.created_at,
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {order.meta.display_price.with_tax.formatted}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div
                          className={clsx(
                            order.status === "complete"
                              ? "bg-green-50 text-green-700 ring-green-600/20"
                              : "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
                            "uppercase inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                          )}
                        >
                          {order.status}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {order.relationships.items.data.map((item: any) => {
                          const itemDetails = orders.included.items.find(
                            (itm: any) => itm.id === item.id,
                          );
                          return (
                            <div
                              key={item.id}
                              className="flex items-center space-x-2 mb-4"
                            >
                              <StatusButton
                                onClick={() => handleAddItem(itemDetails)}
                                disabled={!itemDetails.product_id}
                                className="rounded-lg text-xs py-2 px-4"
                                status={
                                  loadingAdd && itemId === itemDetails.id
                                    ? "loading"
                                    : "idle"
                                }
                              >
                                Add
                              </StatusButton>
                              <div>
                                {itemDetails.quantity} x{" "}
                                {itemDetails.name.length > 50
                                  ? `${itemDetails.name.substring(0, 50)}...`
                                  : itemDetails.name}
                                <div>
                                  <span className="font-bold">Item Price:</span>{" "}
                                  {
                                    itemDetails?.meta?.display_price?.with_tax
                                      ?.unit?.formatted
                                  }
                                </div>
                                <div>
                                  <span className="font-bold">Total:</span>{" "}
                                  {
                                    itemDetails?.meta?.display_price?.with_tax
                                      ?.value?.formatted
                                  }
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <StatusButton
                          onClick={() => handleAddAll(order)}
                          className="text-sm rounded-xl"
                          status={
                            loadingAddAll && orderId === order.id
                              ? "loading"
                              : "idle"
                          }
                        >
                          Add All
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
    )
  );
}
