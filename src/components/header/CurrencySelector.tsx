"use client";

import { Fragment, useEffect, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { getEpccImplicitClient } from "../../lib/epcc-implicit-client";
import { Currency, ResourcePage } from "@elasticpath/js-sdk";
import { getCookie, setCookie } from "cookies-next";
import { COOKIE_PREFIX_KEY } from "../../lib/resolve-cart-env";
import aa from "search-insights";
import { algoliaEnvData } from "../../lib/resolve-algolia-env";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../lib/cookie-constants";
import {
  getSelectedAccount,
  parseAccountMemberCredentialsCookieStr,
} from "../../lib/retrieve-account-member-credentials";

const CurrencySelector = () => {
  const [selected, setSelected] = useState<Currency>();
  const [currencies, setCurrencies] = useState<ResourcePage<Currency, never>>();

  const client = getEpccImplicitClient();
  const currencyInCookie = getCookie(`${COOKIE_PREFIX_KEY}_ep_currency`);
  const cookieValue =
    getCookie(ACCOUNT_MEMBER_TOKEN_COOKIE_NAME)?.toString() || "";

  useEffect(() => {
    const init = async () => {
      const response = await client.Currencies.All();
      setCurrencies(response);
      const selectedCurrency = response.data.find(
        (currency) => currency.code === currencyInCookie,
      );
      setSelected(selectedCurrency);
      const accountMemberCookie =
        cookieValue && parseAccountMemberCredentialsCookieStr(cookieValue);
      if (accountMemberCookie && algoliaEnvData.enabled) {
        const selectedAccount = getSelectedAccount(accountMemberCookie);
        aa("setUserToken", selectedAccount.account_id);
        aa("setAuthenticatedUserToken", selectedAccount.account_id);
      } else {
        aa("setAuthenticatedUserToken", undefined);
      }
    };
    init();
  }, []);

  const handleChangeCurrency = (currency: Currency) => {
    setSelected(currency);
    setCookie(`${COOKIE_PREFIX_KEY}_ep_currency`, currency.code);
    location.reload();
  };

  return (
    selected && (
      <div className="text-sm w-28 ml-2">
        <Listbox value={selected} onChange={handleChangeCurrency}>
          {({ open }) => (
            <>
              <div className="relative mt-1">
                <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary sm:text-sm sm:leading-6">
                  <span className="flex items-center">
                    <span className="ml-3 block truncate">
                      {selected?.code}
                    </span>
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </span>
                </Listbox.Button>

                <Transition
                  show={open}
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {currencies?.data.map((currency) => (
                      <Listbox.Option
                        key={currency.id}
                        className={({ active }) =>
                          clsx(
                            active
                              ? "bg-brand-primary text-white"
                              : "text-gray-900",
                            "relative cursor-default select-none py-2 pl-3 pr-9",
                          )
                        }
                        value={currency}
                      >
                        {({ selected, active }) => (
                          <>
                            <div className="flex items-center">
                              <span
                                className={clsx(
                                  selected ? "font-semibold" : "font-normal",
                                  "ml-3 block truncate",
                                )}
                              >
                                {currency.code}
                              </span>
                            </div>

                            {selected ? (
                              <span
                                className={clsx(
                                  active ? "text-white" : "text-brand-primary",
                                  "absolute inset-y-0 right-0 flex items-center pr-4",
                                )}
                              >
                                <CheckIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </>
          )}
        </Listbox>
      </div>
    )
  );
};

export default CurrencySelector;
