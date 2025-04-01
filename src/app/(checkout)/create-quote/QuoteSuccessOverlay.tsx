"use client";

import { Dialog } from "@headlessui/react";
import { CheckBadgeIcon } from "@heroicons/react/24/outline";
import { mergeCart } from "../../(auth)/actions";
import { StatusButton } from "../../../components/button/StatusButton";

interface QuoteSuccessOverlay {
  isOpen: boolean;
  setIsOpen: any;
  accountId: string;
  accountToken: string;
}

export const QuoteSuccessOverlay: React.FC<QuoteSuccessOverlay> = ({
  isOpen,
  setIsOpen,
  accountId,
  accountToken,
}) => {
  if (!isOpen) return null;

  const quoteComplete = async () => {
    await mergeCart(accountToken, accountId, false);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => setIsOpen(true)}
      className="relative z-10"
    >
      <Dialog.Backdrop className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                <CheckBadgeIcon
                  aria-hidden="true"
                  className="h-6 w-6 text-green-600"
                />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <Dialog.Title
                  as="h3"
                  className="text-base font-semibold leading-6 text-gray-900"
                >
                  Quote Successfully Created
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    An email has been sent to the admin team, they will review
                    your quote and approve.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <StatusButton
                onClick={quoteComplete}
                className="inline-flex w-full justify-center rounded-md bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90 sm:ml-3 sm:w-auto"
              >
                Continue Shopping
              </StatusButton>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};
