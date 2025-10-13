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
import { Location } from "@elasticpath/js-sdk";
import { getCookie } from "cookies-next";
import { COOKIE_PREFIX_KEY } from "../../lib/resolve-cart-env";
import {
  getAllLocations,
  getAllInventoriesByProductId,
} from "../../services/multi-location-inventory";

interface LocationWithInventory {
  location: Location;
  available: number;
  total: number;
}

interface LocationInventorySelectorProps {
  productId: string;
  onLocationChange?: (
    locationSlug: string,
    available: number,
    locationId: string,
    locationName: string,
  ) => void;
  onReady?: () => void;
}

const LocationInventorySelector = ({
  productId,
  onLocationChange,
  onReady,
}: LocationInventorySelectorProps) => {
  const [selected, setSelected] = useState<LocationWithInventory | null>(null);
  const [locationsWithInventory, setLocationsWithInventory] = useState<
    LocationWithInventory[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const client = getEpccImplicitClient();
  const locationInCookie = getCookie(`${COOKIE_PREFIX_KEY}_ep_location`);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);

        // Fetch locations and inventories in parallel
        const [locationsResponse, inventoriesResponse] = await Promise.all([
          getAllLocations(client),
          getAllInventoriesByProductId(productId, client),
        ]);

        // Check if responses are valid
        if (
          !locationsResponse?.data ||
          !Array.isArray(locationsResponse.data)
        ) {
          console.error("Invalid locations response");
          return;
        }

        const inventories = inventoriesResponse?.data as any;

        // Check if inventories is undefined or invalid - means multi-location inventory is not setup for this product
        if (!inventories || !inventories?.attributes?.locations) {
          setLocationsWithInventory([]);
          // Notify parent that we're ready (but with no locations - will fall back to traditional inventory)
          if (onReady) {
            onReady();
          }
          return;
        }

        // Combine locations with their inventory data
        const combined: LocationWithInventory[] = locationsResponse.data.map(
          (location) => {
            return {
              location,
              available:
                inventories?.attributes.locations?.[location.attributes.slug]
                  ?.available || 0,
              total:
                inventories?.attributes.locations?.[location.attributes.slug]
                  ?.total || 0,
            };
          },
        );

        setLocationsWithInventory(combined);

        // Find selected location from cookie or use first one
        let selectedLocation = combined.find(
          (item) => item.location.attributes.slug === locationInCookie,
        );

        // If no cookie match, use first location
        if (!selectedLocation && combined.length > 0) {
          selectedLocation = combined[0];
        }

        if (selectedLocation) {
          setSelected(selectedLocation);

          // Notify parent component
          if (onLocationChange) {
            onLocationChange(
              selectedLocation.location.attributes.slug,
              selectedLocation.available,
              selectedLocation.location.id,
              selectedLocation.location.attributes?.name || "",
            );
          }

          // Notify parent that we're ready
          if (onReady) {
            onReady();
          }
        }
      } catch (error) {
        console.error("Error loading location inventory:", error);
        // Notify parent that we're ready (even on error, fall back to traditional inventory)
        if (onReady) {
          onReady();
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      init();
    }
  }, [productId]);

  const handleChangeLocation = (
    locationWithInventory: LocationWithInventory,
  ) => {
    setSelected(locationWithInventory);

    // Notify parent component
    if (onLocationChange) {
      onLocationChange(
        locationWithInventory.location.attributes.slug,
        locationWithInventory.available,
        locationWithInventory.location.id,
        locationWithInventory.location.attributes?.name || "",
      );
    }
  };

  // Don't render if no locations or still loading
  if (isLoading) {
    return (
      <div className="text-sm text-gray-500 animate-pulse">
        Loading locations...
      </div>
    );
  }

  if (
    !locationsWithInventory ||
    locationsWithInventory.length === 0 ||
    !selected
  ) {
    return null;
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-900 mb-2">
        Select Inventory Location
      </label>
      <Listbox value={selected} onChange={handleChangeLocation}>
        {({ open }) => (
          <>
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-3 pl-4 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary sm:text-sm sm:leading-6 hover:ring-brand-primary transition-all">
                <span className="flex items-center justify-between">
                  <span className="flex items-center">
                    <MapPinIcon
                      className="h-5 w-5 text-brand-primary flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="ml-3 block truncate font-medium">
                      {selected.location.attributes?.name || "Select Location"}
                    </span>
                  </span>
                  <span
                    className={clsx(
                      "ml-2 text-xs font-semibold px-2 py-1 rounded-full",
                      selected.available > 0
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800",
                    )}
                  >
                    {selected.available > 0
                      ? `${selected.available} in stock`
                      : "Out of stock"}
                  </span>
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
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
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {locationsWithInventory.map((item) => (
                    <Listbox.Option
                      key={item.location.attributes.slug}
                      className={({ active }) =>
                        clsx(
                          active
                            ? "bg-brand-primary text-white"
                            : "text-gray-900",
                          "relative cursor-default select-none py-3 pl-3 pr-9",
                        )
                      }
                      value={item}
                    >
                      {({ selected, active }) => (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <MapPinIcon
                                className={clsx(
                                  active ? "text-white" : "text-brand-primary",
                                  "h-5 w-5 flex-shrink-0",
                                )}
                                aria-hidden="true"
                              />
                              <span
                                className={clsx(
                                  selected ? "font-semibold" : "font-normal",
                                  "ml-3 block truncate",
                                )}
                              >
                                {item.location.attributes?.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={clsx(
                                  "text-xs font-semibold px-2 py-1 rounded-full",
                                  active
                                    ? item.available > 0
                                      ? "bg-green-600 text-white"
                                      : "bg-red-600 text-white"
                                    : item.available > 0
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800",
                                )}
                              >
                                {item.available > 0
                                  ? `${item.available} available`
                                  : "Out of stock"}
                              </span>
                            </div>
                          </div>

                          {selected && (
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
                          )}
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

export default LocationInventorySelector;
