"use client";

import { useState, useEffect } from "react";
import { RadioGroup, Dialog } from "@headlessui/react";
import {
  addAddress,
  changeAccountCredentials,
  createNewCart,
  getAccountAddresses,
  getAllSalesReps,
} from "../actions";
import {
  CheckIcon,
  EnvelopeIcon,
  HashtagIcon,
  UserCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { AddAddressForm } from "./AddAddressForm";
import { StatusButton } from "../../../../../components/button/StatusButton";
import { useQueryClient } from "@tanstack/react-query";
import {
  accountAddressesQueryKeys,
  useCart,
} from "../../../../../react-shopper-hooks";
import { FormStatusButton } from "../../../../../components/button/FormStatusButton";
import { useSession } from "next-auth/react";
import { setCookie } from "cookies-next";
import { CART_COOKIE_NAME } from "../../../../../lib/cookie-constants";
import CartArea from "./CartArea";
import AddCartCustomDiscount from "./AddCartCustomDiscount";

export default function AccountSelector({
  accounts,
  accountMember,
}: {
  accounts: any;
  accountMember: any;
}) {
  const [selectedAccount, setSelectedAccount] = useState(
    accounts?.[0]?.account_id,
  );
  const [addresses, setAddresses] = useState<any>();
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [quoteNumber, setQuoteNumber] = useState("");
  const queryClient = useQueryClient();
  const [salesReps, setSalesReps] = useState<any>([]);
  const [selectedSalesRep, setSelectedSalesRep] = useState("");
  const [quoteStarted, setQuoteStarted] = useState(false);
  const { data } = useSession();
  const { state } = useCart() as any;
  const [openDiscount, setOpenDiscount] = useState(false);
  const [enableCustomDiscount, setEnableCustomDiscount] = useState(false);

  useEffect(() => {
    const init = async () => {
      await fetchAddresses(selectedAccount);
      const response = await getAllSalesReps();
      const reps = [
        {
          email: data?.user?.email,
          name: data?.user?.name,
        },
      ];
      const salesRepList = response.data.filter(
        (rep: any) => rep.email != data?.user?.email,
      );
      if (data?.user?.email) {
        setSelectedSalesRep(data?.user?.email);
      }
      setSalesReps(reps.concat(salesRepList));
    };
    init();
  }, [selectedAccount]);

  const fetchAddresses = async (accountId: string, addressId?: string) => {
    try {
      const response = await getAccountAddresses(accountId);
      setAddresses(response?.data);
      if (addressId) {
        setSelectedAddress(
          response.data.find((address) => address.id === addressId),
        );
      } else if (response?.data?.length > 0) {
        setSelectedAddress(response.data?.[0]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getCountryName = (country: string) => {
    const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(country.toUpperCase()) || country;
  };

  const handleCreateQuote = async () => {
    const cart = await createNewCart(quoteNumber);
    setEnableCustomDiscount(true);
    changeAccountCredentials(selectedAccount);
    setCookie(CART_COOKIE_NAME, cart?.data?.id);
    setQuoteStarted(true);
  };

  const generateQuoteNumber = () => {
    const randomQuote = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();
    setQuoteNumber(randomQuote);
  };

  return (
    <>
      {!quoteStarted && (
        <div className="space-y-6 max-w-4xl">
          <div className="mb-4 font-bold text-xl">Select Account</div>
          <RadioGroup
            value={selectedAccount}
            onChange={setSelectedAccount}
            className="grid grid-cols-3 gap-4 text-gray-600"
          >
            {accounts.map((account: any) => (
              <RadioGroup.Option
                key={account.account_id}
                value={account.account_id}
              >
                {({ checked }) => (
                  <div
                    className={`p-4 flex items-center justify-between cursor-pointer border rounded-lg shadow-sm transition hover:shadow-md min-h-20 ${
                      checked ? "border-blue-500 bg-blue-50" : "border-gray-300"
                    }`}
                  >
                    <span className="text-md">{account.account_name}</span>
                    {checked && (
                      <CheckIcon className="w-6 text-brand-primary" />
                    )}
                  </div>
                )}
              </RadioGroup.Option>
            ))}
          </RadioGroup>

          <div className="mb-4 font-bold text-xl">Select Shipping Address</div>
          <RadioGroup
            value={selectedAddress}
            onChange={setSelectedAddress}
            className="grid grid-cols-3 gap-4 text-gray-600"
          >
            {addresses?.map((address: any, index: number) => (
              <RadioGroup.Option key={index} value={address}>
                {({ checked }) => (
                  <div
                    className={`p-4 flex items-center justify-between border rounded-lg shadow-sm cursor-pointer transition hover:shadow-md min-h-52 ${
                      checked
                        ? "border-blue-500 bg-blue-50 text-gray-800"
                        : "border-gray-300"
                    }`}
                  >
                    <span>
                      <p className="font-bold">{address.name}</p>
                      <p>
                        {address.first_name} {address.last_name}
                      </p>
                      <p>{address.line_1}</p>
                      {address.line_2 && <p>{address.line_2}</p>}
                      <p>
                        {address.city}, {address.postcode}
                      </p>
                      <p>{getCountryName(address.country)}</p>
                    </span>
                    {checked && (
                      <CheckIcon className="w-6 text-brand-primary" />
                    )}
                  </div>
                )}
              </RadioGroup.Option>
            ))}
            <div
              className="p-4 border border-dashed border-gray-400 rounded-lg cursor-pointer flex items-center justify-center hover:shadow-md"
              onClick={() => setIsOpen(true)}
            >
              <span className="text-gray-600">+ Add New Address</span>
            </div>
          </RadioGroup>

          <Dialog
            open={isOpen}
            onClose={() => setIsOpen(false)}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          >
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/2 space-y-3">
              <h2 className="text-lg font-semibold">Add New Address</h2>
              <form
                action={async (formData) => {
                  const response = await addAddress(formData, selectedAccount);
                  await fetchAddresses(selectedAccount, response?.data?.id);
                  await queryClient.invalidateQueries({
                    queryKey: [
                      ...accountAddressesQueryKeys.list({
                        accountId: selectedAccount,
                      }),
                    ],
                  });
                  setIsOpen(false);
                }}
                className="flex flex-col gap-5"
              >
                <AddAddressForm />
                <div className="flex space-x-2">
                  <FormStatusButton
                    type="submit"
                    className="w-full text-md mt-6"
                  >
                    Add Address
                  </FormStatusButton>

                  <StatusButton
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-gray-400 text-white hover:bg-gray-500 text-md mt-6"
                  >
                    Cancel
                  </StatusButton>
                </div>
              </form>
            </div>
          </Dialog>
          <div>
            <div className="mb-4 font-bold text-xl">Select Sales Agent</div>
            <select
              value={selectedSalesRep}
              onChange={(e) => setSelectedSalesRep(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {salesReps.map((rep: any) => (
                <option key={rep.email} value={rep.email}>
                  {rep.name} ({rep.email})
                </option>
              ))}
            </select>
          </div>
          {selectedAddress && (
            <div className="flex flex-col items-center justify-center">
              <div className="w-full flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter Quote Number"
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  className="border rounded-lg p-2 w-full "
                />
                <StatusButton
                  onClick={generateQuoteNumber}
                  className="text-sm rounded-lg"
                  variant="secondary"
                >
                  Generate Quote Number
                </StatusButton>
              </div>
              {quoteNumber && (
                <div className="w-full mt-8 flex justify-end">
                  <StatusButton onClick={handleCreateQuote} className="text-sm">
                    Start Quote Process
                  </StatusButton>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {quoteStarted && selectedAddress && state && (
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
                  {quoteNumber}
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
                  {accountMember.name}
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
                  {accountMember.email}
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
                  {
                    accounts.find(
                      (acc: any) => acc.account_id === selectedAccount,
                    )?.account_name
                  }
                </dd>
              </div>
              <div className="mt-10">
                <StatusButton
                  className="text-sm rounded-lg py-2 px-4"
                  variant="secondary"
                  onClick={() => setQuoteStarted(false)}
                >
                  Edit Info
                </StatusButton>
              </div>
            </dl>
            <dl className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-2 md:gap-x-8 lg:col-span-6">
              <div>
                <dt className="font-medium text-gray-900">Shipping address</dt>
                <dd className="mt-3 text-gray-500">
                  <span className="block text-gray-700 mb-1 font-medium">
                    {selectedAddress.name}
                  </span>
                  <span className="block">
                    {selectedAddress.first_name} {selectedAddress.last_name}{" "}
                  </span>
                  <span className="block">{selectedAddress.line_1}</span>
                  {selectedAddress?.line_2 && (
                    <span className="block">{selectedAddress?.line_2}</span>
                  )}
                  <span className="block">
                    {selectedAddress.city}, {selectedAddress.postcode}
                  </span>
                  <span className="block">
                    {getCountryName(selectedAddress.country)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Sales Agent</dt>
                <dd className="mt-3 text-gray-500">
                  <span className="block mb-1 font-medium text-gray-800">
                    {
                      salesReps.find(
                        (rep: any) => rep.email === selectedSalesRep,
                      )?.name
                    }
                  </span>
                  <span className="block">
                    {
                      salesReps.find(
                        (rep: any) => rep.email === selectedSalesRep,
                      )?.email
                    }
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
          <CartArea
            enableCustomDiscount={enableCustomDiscount}
            setOpenDiscount={setOpenDiscount}
            selectedAccount={selectedAccount}
          />
          <AddCartCustomDiscount
            selectedSalesRep={selectedAccount}
            enableCustomDiscount={enableCustomDiscount}
            openDiscount={openDiscount}
            setOpenDiscount={setOpenDiscount}
          />
        </div>
      )}
    </>
  );
}
