"use client";

import { useState, Fragment, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { applyItemCustomDiscount } from "../actions";
import { StatusButton } from "../../../../../components/button/StatusButton";
import { useCart } from "../../../../../react-shopper-hooks";

export default function AddItemCustomDiscount({
  itemId,
  selectedSalesRep,
  enableCustomDiscount,
  openDiscount,
  setOpenDiscount,
  name,
  sku,
}: {
  itemId: string;
  selectedSalesRep: string;
  enableCustomDiscount: boolean;
  openDiscount: boolean;
  setOpenDiscount: any;
  name: string;
  sku: string;
}) {
  const { state } = useCart() as any;
  const cancelButtonRef = useRef(null);
  const [loadingCustomDiscount, setLoadingCustomDiscount] = useState(false);

  const { useScopedUpdateCartItem } = useCart();
  const { mutate: mutateUpdate } = useScopedUpdateCartItem();

  const handleCustomDiscount = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    setLoadingCustomDiscount(true);
    event.preventDefault();
    const form = new FormData(event.target as HTMLFormElement);
    const data = {
      amount: form.get("amount"),
      description: form.get("description"),
      username: selectedSalesRep,
    };
    await applyItemCustomDiscount(state.id, itemId, data);
    if (state?.items?.length > 0) {
      mutateUpdate({
        itemId: state?.items?.[0]?.id,
        quantity: state?.items?.[0]?.quantity,
      });
    }
    setLoadingCustomDiscount(false);
    setOpenDiscount(false);
  };

  return (
    <Transition.Root show={openDiscount} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        initialFocus={cancelButtonRef}
        onClose={setOpenDiscount}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                {enableCustomDiscount && (
                  <div className="isolate bg-white">
                    <div className="mx-auto max-w-2xl text-center">
                      <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                        Apply Item Level Discount
                      </h2>
                      <div className="mt-4 text-sm">
                        <div>
                          <strong>Product Name:</strong> {name}
                        </div>
                        <div>
                          <strong>SKU:</strong> {sku}
                        </div>
                      </div>
                    </div>
                    <form
                      action="#"
                      method="POST"
                      className="mx-auto mt-10 max-w-xl sm:mt-10"
                      onSubmit={handleCustomDiscount}
                    >
                      <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label
                            htmlFor="email"
                            className="block text-sm font-semibold leading-6 text-gray-900"
                          >
                            Amount
                          </label>
                          <div className="mt-2.5">
                            <input
                              type="number"
                              name="amount"
                              id="amount"
                              required
                              className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
                            />
                          </div>
                          <p className="text-[10px] leading-6 text-gray-600">
                            Enter amount multiplied by 100 e.g. £10.99 should be
                            1099
                          </p>
                        </div>
                        <div className="sm:col-span-2">
                          <label
                            htmlFor="email"
                            className="block text-sm font-semibold leading-6 text-gray-900"
                          >
                            Description
                          </label>
                          <div className="mt-2.5">
                            <input
                              type="text"
                              name="description"
                              id="description"
                              required
                              className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-10">
                        <StatusButton
                          type="submit"
                          className="w-full rounded-md"
                          status={loadingCustomDiscount ? "loading" : "idle"}
                        >
                          Add
                        </StatusButton>
                      </div>
                    </form>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
