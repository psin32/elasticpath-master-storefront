"use client";

import { Fragment, useEffect, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import {
  CheckIcon,
  ChevronUpDownIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import clsx from "clsx";
import { getEpccImplicitClient } from "../../../lib/epcc-implicit-client";
import { Location } from "@elasticpath/js-sdk";
import { getCookie } from "cookies-next";
import { COOKIE_PREFIX_KEY } from "../../../lib/resolve-cart-env";
import {
  getAllLocations,
  getMultipleInventoriesByProductIds,
} from "../../../services/multi-location-inventory";

interface ComponentInventory {
  productId: string;
  productName: string;
  quantity: number;
  available: number;
  hasStock: boolean;
}

interface LocationWithBundleInventory {
  location: Location;
  components: ComponentInventory[];
  allComponentsAvailable: boolean;
}

interface BundleLocationInventorySelectorProps {
  selectedComponents: { [key: string]: { [optionId: string]: number } };
  componentProducts: any;
  onLocationChange?: (
    locationSlug: string,
    allAvailable: boolean,
    locationId: string,
    locationName: string,
    componentInventories: ComponentInventory[],
  ) => void;
  onReady?: () => void;
}

const BundleLocationInventorySelector = ({
  selectedComponents,
  componentProducts,
  onLocationChange,
  onReady,
}: BundleLocationInventorySelectorProps) => {
  const [selected, setSelected] = useState<LocationWithBundleInventory | null>(
    null,
  );
  const [locationsWithInventory, setLocationsWithInventory] = useState<
    LocationWithBundleInventory[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const client = getEpccImplicitClient();
  const locationInCookie = getCookie(`${COOKIE_PREFIX_KEY}_ep_location`);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);

        // Get all component product IDs and quantities from selected options
        const componentData: {
          productId: string;
          productName: string;
          quantity: number;
        }[] = [];

        Object.keys(selectedComponents).forEach((componentKey) => {
          const selectedOptions = selectedComponents[componentKey];
          Object.keys(selectedOptions).forEach((optionId) => {
            const quantity = selectedOptions[optionId];
            const componentProduct = componentProducts.find(
              (cp: any) => cp.id === optionId,
            );
            if (componentProduct && quantity > 0) {
              componentData.push({
                productId: optionId,
                productName: componentProduct.attributes?.name || "Unknown",
                quantity,
              });
            }
          });
        });

        if (componentData.length === 0) {
          setLocationsWithInventory([]);
          if (onReady) onReady();
          return;
        }

        const productIds = componentData.map((c) => c.productId);

        // Fetch locations and inventories in parallel
        const [locationsResponse, inventoriesResponse] = await Promise.all([
          getAllLocations(client),
          getMultipleInventoriesByProductIds(productIds, client),
        ]);

        // Check if responses are valid
        if (
          !locationsResponse?.data ||
          !Array.isArray(locationsResponse.data)
        ) {
          console.error("Invalid locations response");
          if (onReady) onReady();
          return;
        }

        const inventories = inventoriesResponse?.data as any;

        // Check if inventories is undefined or invalid - means multi-location inventory is not setup
        if (!inventories || inventories.length === 0) {
          setLocationsWithInventory([]);
          if (onReady) onReady();
          return;
        }

        // Combine locations with their inventory data for all components
        const combined: LocationWithBundleInventory[] =
          locationsResponse.data.map((location) => {
            const componentInventories: ComponentInventory[] =
              componentData.map((comp) => {
                // Find inventory for this component at this location
                const inventory = inventories.find(
                  (inv: any) => inv.id === comp.productId,
                );

                const available =
                  inventory?.attributes?.locations?.[location.attributes.slug]
                    ?.available || 0;

                return {
                  productId: comp.productId,
                  productName: comp.productName,
                  quantity: comp.quantity,
                  available,
                  hasStock: available >= comp.quantity,
                };
              });

            // Check if ALL components have enough stock at this location
            const allComponentsAvailable = componentInventories.every(
              (comp) => comp.hasStock,
            );

            return {
              location,
              components: componentInventories,
              allComponentsAvailable,
            };
          });

        setLocationsWithInventory(combined);

        // Find selected location from cookie or use first available location
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
              selectedLocation.allComponentsAvailable,
              selectedLocation.location.id,
              selectedLocation.location.attributes?.name || "",
              selectedLocation.components,
            );
          }

          // Notify parent that we're ready
          if (onReady) {
            onReady();
          }
        }
      } catch (error) {
        console.error("Error loading bundle location inventory:", error);
        // Notify parent that we're ready (even on error, fall back to traditional inventory)
        if (onReady) {
          onReady();
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedComponents && Object.keys(selectedComponents).length > 0) {
      init();
    }
  }, [selectedComponents]);

  const handleChangeLocation = (
    locationWithInventory: LocationWithBundleInventory,
  ) => {
    setSelected(locationWithInventory);

    // Notify parent component
    if (onLocationChange) {
      onLocationChange(
        locationWithInventory.location.attributes.slug,
        locationWithInventory.allComponentsAvailable,
        locationWithInventory.location.id,
        locationWithInventory.location.attributes?.name || "",
        locationWithInventory.components,
      );
    }
  };

  // Don't render if still loading
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
                      selected.allComponentsAvailable
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800",
                    )}
                  >
                    {selected.allComponentsAvailable
                      ? "All components available"
                      : "Some components unavailable"}
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
                <Listbox.Options className="absolute z-10 mt-1 max-h-80 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
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
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <MapPinIcon
                                  className={clsx(
                                    active
                                      ? "text-white"
                                      : "text-brand-primary",
                                    "h-5 w-5 flex-shrink-0",
                                  )}
                                  aria-hidden="true"
                                />
                                <span
                                  className={clsx(
                                    selected ? "font-semibold" : "font-normal",
                                    "ml-3 block",
                                  )}
                                >
                                  {item.location.attributes?.name}
                                </span>
                              </div>
                              {item.allComponentsAvailable ? (
                                <CheckIcon
                                  className={clsx(
                                    active ? "text-white" : "text-green-600",
                                    "h-5 w-5 flex-shrink-0",
                                  )}
                                />
                              ) : (
                                <ExclamationTriangleIcon
                                  className={clsx(
                                    active ? "text-white" : "text-red-600",
                                    "h-5 w-5 flex-shrink-0",
                                  )}
                                />
                              )}
                            </div>

                            {/* Component availability breakdown */}
                            <div className="ml-8 space-y-1">
                              {item.components.map((comp) => (
                                <div
                                  key={comp.productId}
                                  className={clsx(
                                    "text-xs flex items-center justify-between",
                                    active ? "text-white/90" : "text-gray-600",
                                  )}
                                >
                                  <span className="truncate mr-2">
                                    {comp.productName}
                                  </span>
                                  <span
                                    className={clsx(
                                      "font-medium flex-shrink-0",
                                      comp.hasStock
                                        ? active
                                          ? "text-white"
                                          : "text-green-600"
                                        : active
                                          ? "text-white"
                                          : "text-red-600",
                                    )}
                                  >
                                    {comp.hasStock
                                      ? `✓ ${comp.available} available`
                                      : `✗ Only ${comp.available} available (need ${comp.quantity})`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {selected && (
                            <span
                              className={clsx(
                                active ? "text-white" : "text-brand-primary",
                                "absolute top-3 right-0 flex items-center pr-4",
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

            {/* Show component inventory details for selected location */}
            {selected && !selected.allComponentsAvailable && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800 mb-2">
                      Insufficient stock at this location
                    </p>
                    <div className="space-y-1">
                      {selected.components
                        .filter((comp) => !comp.hasStock)
                        .map((comp) => (
                          <div
                            key={comp.productId}
                            className="text-xs text-red-700"
                          >
                            • {comp.productName}: Only {comp.available}{" "}
                            available (need {comp.quantity})
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Listbox>
    </div>
  );
};

export default BundleLocationInventorySelector;
