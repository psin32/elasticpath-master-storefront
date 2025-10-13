"use client";

import { Fragment, useEffect, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import {
  CheckIcon,
  ChevronUpDownIcon,
  MapPinIcon,
} from "@heroicons/react/20/solid";
import clsx from "clsx";
import { getEpccImplicitClient } from "../../lib/epcc-implicit-client";
import { Location, ResourcePage } from "@elasticpath/js-sdk";
import { getCookie, setCookie } from "cookies-next";
import { COOKIE_PREFIX_KEY } from "../../lib/resolve-cart-env";
import { getAllLocations } from "../../services/multi-location-inventory";

const LocationSelector = () => {
  const [selected, setSelected] = useState<Location | null>(null);
  const [locations, setLocations] = useState<ResourcePage<Location> | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);

  const client = getEpccImplicitClient();
  const locationInCookie = getCookie(`${COOKIE_PREFIX_KEY}_ep_location`);

  // Check if multi-location inventory is enabled
  useEffect(() => {
    const multiLocationValue = getCookie("use_multi_location_inventory");
    // Default to true (enabled) if cookie doesn't exist
    setIsEnabled(multiLocationValue !== "false");
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      setIsLoading(false);
      return;
    }

    const init = async () => {
      try {
        setIsLoading(true);
        const response = await getAllLocations(client);

        // Check if response is valid and has data
        if (response && response.data && response.data.length > 0) {
          setLocations(response);

          // Find selected location from cookie or use first one
          const selectedLocation = locationInCookie
            ? response.data.find(
                (location) => location.attributes.slug === locationInCookie,
              )
            : response.data[0];

          setSelected(selectedLocation || response.data[0]);

          // Set cookie if not already set
          if (!locationInCookie && selectedLocation) {
            setCookie(
              `${COOKIE_PREFIX_KEY}_ep_location`,
              selectedLocation.attributes.slug,
            );
          }
        }
      } catch (error) {
        console.error("Error loading locations:", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [isEnabled]);

  const handleChangeLocation = (location: Location) => {
    setSelected(location);
    setCookie(`${COOKIE_PREFIX_KEY}_ep_location`, location.attributes.slug);
    window.location.reload();
  };

  // Don't render if feature is disabled
  if (!isEnabled) {
    return null;
  }

  // Don't render if no locations or still loading
  if (
    isLoading ||
    !locations ||
    !locations.data ||
    locations.data.length === 0 ||
    !selected
  ) {
    return null;
  }

  return (
    <div className="text-sm w-48 ml-2">
      <Listbox value={selected} onChange={handleChangeLocation}>
        {({ open }) => (
          <>
            <div className="relative mt-1">
              <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary sm:text-sm sm:leading-6 hover:ring-brand-primary transition-all">
                <span className="flex items-center">
                  <MapPinIcon
                    className="h-4 w-4 text-brand-primary flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span className="ml-2 block truncate">
                    {selected?.attributes?.name || "Select Location"}
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
                  {locations.data.map((location) => (
                    <Listbox.Option
                      key={location.attributes.slug}
                      className={({ active }) =>
                        clsx(
                          active
                            ? "bg-brand-primary text-white"
                            : "text-gray-900",
                          "relative cursor-default select-none py-2 pl-3 pr-9",
                        )
                      }
                      value={location}
                    >
                      {({ selected, active }) => (
                        <>
                          <div className="flex items-center">
                            <MapPinIcon
                              className={clsx(
                                active ? "text-white" : "text-brand-primary",
                                "h-4 w-4 flex-shrink-0",
                              )}
                              aria-hidden="true"
                            />
                            <span
                              className={clsx(
                                selected ? "font-semibold" : "font-normal",
                                "ml-2 block truncate",
                              )}
                            >
                              {location.attributes?.name}
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
  );
};

export default LocationSelector;
