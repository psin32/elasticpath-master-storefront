'use client'

import { storyblokEditable } from "@storyblok/react";
import { getCookie, setCookie } from "cookies-next";
import { COOKIE_PREFIX_KEY } from "../../lib/resolve-cart-env";
import { Fragment, useEffect, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx';

const CatalogMenu = ({ blok }: any) => {

  const [selected, setSelected] = useState<any>()
  const [catalogs, setCatalogs] = useState<any>()
  const [cookieValue, setCookieValue] = useState<string>()
  const catalogInCookie = getCookie(`${COOKIE_PREFIX_KEY}_ep_catalog_tag`);

  const handleClick = (tag: string) => {
    setCookie(`${COOKIE_PREFIX_KEY}_ep_catalog_tag`, tag)
    location.reload()
  }

  const handleClickObject = (tag: any) => {
    setSelected(tag)
    setCookie(`${COOKIE_PREFIX_KEY}_ep_catalog_tag`, tag.tag)
    location.reload()
  }

  useEffect(() => {
    setCatalogs(blok?.catalogs)
    const selectedCatalog = blok?.catalogs.find((catalog: any) => catalog.tag === catalogInCookie)
    setSelected(selectedCatalog || blok?.catalogs[0])
    setCookieValue(catalogInCookie)
  })

  return (
    blok.enable && (
      <div className="py-1" {...storyblokEditable(blok)} style={{ backgroundColor: blok.bg_color?.color ? blok.bg_color?.color : "black"}}>
        {blok.type == "tabs" && (
          <div className="mx-auto flex items-center justify-between">
            <div className="ml-10">
              <nav className="flex">
                <ul
                  role="list"
                  className="flex min-w-full flex-none gap-x-6 px-2 text-sm font-normal leading-6 text-gray-300"
                  style={{color: blok.text_color?.color ? blok.text_color.color : "gray"}}
                >
                  {blok?.catalogs?.map((nestedBlok: any) => {
                    return (
                      <li key={nestedBlok.name}>
                        <a onClick={() => handleClick(nestedBlok.tag)} className={nestedBlok.tag === cookieValue ? 'underline' : 'cursor-pointer'}>
                          {nestedBlok.name}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            </div>
          </div>
        )}

        {blok.type == "dropdown" && (
          <div className="flex items-end justify-end">
            <div className='text-sm ml-2 w-60 mr-10'>
              <Listbox value={selected} onChange={handleClickObject}>
                {({ open }) => (
                  <>
                    <div className="relative mt-1">
                      <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary sm:text-sm sm:leading-6">
                        <span className="flex items-center">
                          <span className="ml-3 block truncate">{selected?.name}</span>
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
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
                          {catalogs?.map((catalog: any) => (
                            <Listbox.Option
                              key={catalog.tag}
                              className={({ active }) =>
                                clsx(
                                  active ? 'bg-brand-primary text-white' : 'text-gray-900',
                                  'relative cursor-default select-none py-2 pl-3 pr-9'
                                )
                              }
                              value={catalog}
                            >
                              {({ selected, active }) => (
                                <>
                                  <div className="flex items-center">
                                    <span
                                      className={clsx(selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate')}
                                    >
                                      {catalog.name}
                                    </span>
                                  </div>

                                  {selected ? (
                                    <span
                                      className={clsx(
                                        active ? 'text-white' : 'text-brand-primary',
                                        'absolute inset-y-0 right-0 flex items-center pr-4'
                                      )}
                                    >
                                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
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
          </div>
        )}
      </div>
    )
  )
};

export default CatalogMenu;
