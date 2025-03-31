"use client";

import { useState, useEffect } from "react";
import {
  createNewQuote,
  getAccountDetails,
  getQuoteByQuoteRef,
  getShippingGroups,
} from "../actions";
import { useCart } from "../../../../../react-shopper-hooks";
import CartArea from "../new/CartArea";
import AddCartCustomDiscount from "../new/AddCartCustomDiscount";
import { QuoteSuccessOverlay } from "../new/QuoteSuccessOverlay";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { StatusButton } from "../../../../../components/button/StatusButton";
import {
  EnvelopeIcon,
  HashtagIcon,
  UserCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

export default function QuoteDetails({ quoteId }: { quoteId: string }) {
  const { state } = useCart() as any;
  const [quoteData, setQuoteData] = useState<any>(null);
  const [openDiscount, setOpenDiscount] = useState(false);
  const [enableCustomDiscount, setEnableCustomDiscount] = useState(false);
  const [loadingCreateQuote, setLoadingCreateQuote] = useState(false);
  const [error, setError] = useState<string>("");
  const [isOverlayOpen, setIsOverlayOpen] = useState<boolean>(false);
  const [shippingGroup, setShippingGroup] = useState<any>(null);
  const [accounts, setAccounts] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const quote = await getQuoteByQuoteRef(quoteId);
      setQuoteData(quote?.data?.[0]);
      if (state.discount_settings.custom_discounts_enabled) {
        setEnableCustomDiscount(true);
      }
      const shipping = await getShippingGroups(state?.id);
      setShippingGroup(shipping?.data?.[0]);
      const accountResponse = await getAccountDetails(
        quote?.data?.[0].account_id,
      );
      setAccounts(accountResponse.data);
    };
    init();
  }, [quoteId]);

  const getCountryName = (country: string) => {
    const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(country.toUpperCase()) || country;
  };

  const createQuote = async () => {
    setLoadingCreateQuote(true);
    const request = {
      type: "quote_ext",
      cart_id: state?.id,
      status: "Approved",
      sales_agent_email: quoteData.sales_agent_email,
      total_items: state?.items?.length,
      total_amount: state?.meta?.display_price?.with_tax.amount,
      currency: state?.meta?.display_price?.with_tax.currency,
    };
    const response = await createNewQuote(state?.id, request);
    if (response?.errors) {
      setError(response?.errors?.[0]?.detail);
    }
    setLoadingCreateQuote(false);
    setIsOverlayOpen(true);
  };

  return (
    quoteData && (
      <div className="m-6">
        <StatusButton
          onClick={() => router.back()}
          variant="secondary"
          className="rounded-lg py-2 text-sm"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
          <span className="text-gray-700 font-medium pl-2">Back</span>
        </StatusButton>
        <div className="mt-6">
          <div className="bg-gray-100 px-4 py-6 sm:rounded-lg sm:px-6 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:px-8 lg:py-8">
            <dl className="text-sm lg:col-span-3 lg:mt-0 mb-8 lg:mb-0">
              <div className="flex mb-4">
                <dt className="">
                  <HashtagIcon
                    className="h-6 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </dt>
                <dd className="text-sm leading-6 font-medium text-gray-900 ml-4">
                  {quoteData.quote_ref}
                </dd>
              </div>
              <div className="flex">
                <dt>
                  <UserCircleIcon
                    className="h-6 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </dt>
                <dd className="text-sm font-medium text-gray-900 ml-4">
                  {quoteData.first_name} {quoteData.last_name}
                </dd>
              </div>
              <div className="flex mb-4">
                <dt className="">
                  <EnvelopeIcon
                    className="h-6 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </dt>
                <dd className="text-sm  text-gray-500 ml-4">
                  {quoteData.email}
                </dd>
              </div>
              <div className="flex">
                <dt className="">
                  <UserGroupIcon
                    className="h-6 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </dt>
                <dd className="text-sm  text-gray-500 ml-4">
                  {accounts && accounts.name}
                </dd>
              </div>
            </dl>
            <dl className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-2 md:gap-x-8 lg:col-span-6">
              {shippingGroup && (
                <div>
                  <dt className="font-medium text-gray-900">
                    Shipping address
                  </dt>
                  <dd className="mt-3 text-gray-500">
                    <span className="block text-gray-700 mb-1 font-medium">
                      {shippingGroup?.address?.name}
                    </span>
                    <span className="block">
                      {shippingGroup?.address?.first_name}{" "}
                      {shippingGroup?.address?.last_name}{" "}
                    </span>
                    <span className="block">
                      {shippingGroup?.address?.line_1}
                    </span>
                    {shippingGroup?.address?.line_2 && (
                      <span className="block">
                        {shippingGroup?.address?.line_2}
                      </span>
                    )}
                    <span className="block">
                      {shippingGroup?.address?.city},{" "}
                      {shippingGroup?.address?.postcode}
                    </span>
                    <span className="block">
                      {getCountryName(shippingGroup?.address?.country)}
                    </span>
                  </dd>
                </div>
              )}

              <div>
                <dt className="font-medium text-gray-900">Sales Agent</dt>
                <dd className="mt-3 text-gray-500">
                  <span className="block mb-1 font-medium text-gray-800">
                    {quoteData.sales_agent_email}
                  </span>
                </dd>
              </div>
            </dl>
            <dl className="mt-8 divide-y divide-gray-200 text-sm lg:col-span-3 lg:mt-0">
              <div className="flex items-center justify-between py-2">
                <dt className="text-gray-600">Subtotal</dt>
                <dd className="font-medium text-gray-900">
                  {state?.meta?.display_price?.without_discount?.formatted}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-gray-600">Tax</dt>
                <dd className="font-medium text-gray-900">
                  {state?.meta?.display_price?.tax?.formatted}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-gray-600">Discount</dt>
                <dd className="font-medium text-gray-900">
                  {state?.meta?.display_price?.discount.formatted}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="font-medium text-gray-900">Order Total</dt>
                <dd className="font-medium text-primary-600">
                  {state?.meta?.display_price?.with_tax.formatted}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <CartArea
          enableCustomDiscount={enableCustomDiscount}
          setOpenDiscount={setOpenDiscount}
          selectedAccount={quoteData.sales_agent_email}
          createQuote={createQuote}
          loadingCreateQuote={loadingCreateQuote}
          error={error}
          status="created"
          accountId={quoteData.account_id}
        />
        <AddCartCustomDiscount
          selectedSalesRep={quoteData.sales_agent_email}
          enableCustomDiscount={enableCustomDiscount}
          openDiscount={openDiscount}
          setOpenDiscount={setOpenDiscount}
        />
        <QuoteSuccessOverlay
          isOpen={isOverlayOpen}
          setIsOpen={setIsOverlayOpen}
        />
      </div>
    )
  );
}
