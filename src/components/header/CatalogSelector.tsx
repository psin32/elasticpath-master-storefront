"use client";

import { Fragment, useEffect, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { getCookie, setCookie } from "cookies-next";
import { COOKIE_PREFIX_KEY } from "../../lib/resolve-cart-env";

type CatalogTag = {
  name: string;
  tag: string | undefined;
};

const CatalogSelector = () => {
  const [selected, setSelected] = useState<CatalogTag>();
  const [tags, setTags] = useState<CatalogTag[]>();

  const tagInCookie = getCookie(`${COOKIE_PREFIX_KEY}_ep_catalog_tag`);

  useEffect(() => {
    const catalogTagConfig = process.env.NEXT_PUBLIC_CATALOG_TAGS || "";
    if (catalogTagConfig) {
      const tagList: CatalogTag[] = [];
      catalogTagConfig.split(",").map((item: string) => {
        const config = item.split("|");
        if (config.length === 2) {
          const catalogTag: CatalogTag = {
            name: config[0],
            tag: config[1],
          };
          tagList.push(catalogTag);
        }
      });
      setTags(tagList);
      const selectedCatalogTag = tagList.find((tag) => tag.tag === tagInCookie);
      setSelected(selectedCatalogTag);
    }
  }, []);

  const handleChangeCurrency = (catalogTag: CatalogTag) => {
    setSelected(catalogTag);
    setCookie(`${COOKIE_PREFIX_KEY}_ep_catalog_tag`, catalogTag.tag);
    location.reload();
  };

  return (
    selected && (
      <div className="text-sm w-60 ml-2">
        <Listbox value={selected} onChange={handleChangeCurrency}>
          {({ open }) => (
            <>
              <div className="relative mt-1">
                <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                  <span className="flex items-center">
                    <span className="ml-3 block truncate">
                      {selected?.name}
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
                    {tags?.map((tag) => (
                      <Listbox.Option
                        key={tag.name}
                        className={({ active }) =>
                          clsx(
                            active
                              ? "bg-indigo-600 text-white"
                              : "text-gray-900",
                            "relative cursor-default select-none py-2 pl-3 pr-9",
                          )
                        }
                        value={tag}
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
                                {tag.name}
                              </span>
                            </div>

                            {selected ? (
                              <span
                                className={clsx(
                                  active ? "text-white" : "text-indigo-600",
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

export default CatalogSelector;
