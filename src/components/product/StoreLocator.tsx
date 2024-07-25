"use client";

import { useRef, useState } from "react";
import {
  getAllLocations,
  getCoordinates,
  getInventoryBySKUAndLocation,
} from "../../services/inventory";
import haversine from "haversine";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { StatusButton } from "../button/StatusButton";
import {
  Pagination as DisplayPagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "../pagination/Pagination";
import { cn } from "../../lib/cn";
import { buttonVariants } from "../button/Button";

interface Location {
  id: number;
  location_name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  postcode: string;
  distance: string;
  stock?: number;
  location_code: string;
  latitude: number;
  longitude: number;
}

interface Locations {
  data: Location[];
}

interface Inventory {
  id: number;
  sku: string;
  location_code: string;
  in_stock: number;
  available: number;
  allocated: number;
}

interface Inventories {
  data: Inventory[];
}

interface StoreLocatorProps {
  product: any;
  onClose: () => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

const StoreLocator: React.FC<StoreLocatorProps> = ({
  onClose,
  product,
  handleSubmit,
}) => {
  const [postcode, setPostcode] = useState<string>("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [pagedLocation, setPagedLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const locationPerPage = 3;

  const handlePagination = (pageNumber: number) => {
    const offset = pageNumber * locationPerPage;
    const limit = offset + locationPerPage;
    setPagedLocations(locations.slice(offset, limit));
    setCurrentPage(pageNumber);
  };

  const handleFindStores = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCurrentPage(0);
    setLocations([]);
    setPagedLocations([]);
    setTotalPages(1);

    if (!postcode) {
      setError("Please enter a postcode or town.");
      return;
    }
    setError(null);
    setIsLoading(true);
    const coordinates = await getCoordinates(postcode);
    const latitude =
      coordinates?.resourceSets?.[0]?.resources?.[0]?.point?.coordinates?.[0];
    const longitude =
      coordinates?.resourceSets?.[0]?.resources?.[0]?.point?.coordinates?.[1];

    const startCoordinates = {
      latitude,
      longitude,
    };

    const response: Locations = await getAllLocations();
    const inventories: Inventories = await getInventoryBySKUAndLocation(
      product.attributes.sku,
      response.data.map((location) => location.location_code),
    );
    const locations = response.data.map((location) => {
      const endCoordinates = {
        latitude: location.latitude,
        longitude: location.longitude,
      };

      return {
        distance: haversine(startCoordinates, endCoordinates, {
          unit: "mile",
        }).toFixed(2),
        id: location.id,
        location_name: location.location_name,
        address_line_1: location.address_line_1,
        address_line_2: location.address_line_2,
        city: location.city,
        postcode: location.postcode,
        location_code: location.location_code,
        latitude: location.latitude,
        longitude: location.longitude,
        stock:
          inventories.data.find(
            (inventory) => inventory.location_code === location.location_code,
          )?.available || 0,
      };
    });
    const result = locations.sort(function (a: any, b: any) {
      return a.distance - b.distance;
    });
    setTotalPages(Math.ceil(result.length / locationPerPage));
    setLocations(result);
    setPagedLocations(result.slice(0, locationPerPage));
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-4xl max-h-full overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        <form
          onSubmit={(e: any) => handleFindStores(e)}
          className="flex mb-4 mt-8"
        >
          <input
            ref={inputRef}
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            className="flex-1 p-3 border border-brand-primary rounded-l-lg focus:outline-none focus:ring-0 focus:ring-brand-primary focus-visible:ring-1 focus-visible:border-brand-primary"
            placeholder="Enter postcode or town"
          />
          <button
            type="submit"
            className="bg-brand-primary text-white px-6 py-3 rounded-r-lg hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary text-lg font-semibold"
            disabled={isLoading}
          >
            {isLoading ? "Finding..." : "Find"}
          </button>
        </form>
        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}
        <div className="space-y-4">
          {pagedLocation.map((location) => (
            <div key={location.id} className="p-4 border rounded-lg shadow-md">
              <form onSubmit={(e: any) => handleSubmit(e)}>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {location.location_name}{" "}
                      <span className="text-xs text-gray-600 font-normal">
                        ({location.distance} miles)
                      </span>
                    </h3>
                    <p className="text-gray-600 text-sm mt-2">
                      {location.address_line_1}, {location.address_line_2}
                    </p>
                    <p className="text-gray-600 text-sm">{location.city}</p>
                    <p className="text-gray-600 text-sm">{location.postcode}</p>
                    <p className="text-gray-600 text-xs mt-1">
                      Branch Code: {location.location_code}
                    </p>
                    {location?.stock || 0 > 0 ? (
                      <p className="text-sm mt-1 text-green-700 font-semibold">
                        {location?.stock} In Stock
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <input
                      type="text"
                      name="delivery_mode"
                      value="Click & Collect"
                      hidden
                      readOnly
                    ></input>

                    <input
                      type="text"
                      name="location_name"
                      value={location.location_name}
                      hidden
                      readOnly
                    ></input>
                    <input
                      type="text"
                      name="location_code"
                      value={location.location_code}
                      hidden
                      readOnly
                    ></input>
                    {location?.stock || 0 > 0 ? (
                      <StatusButton
                        type="submit"
                        className="uppercase py-1 text-md w-40"
                      >
                        Add to Cart
                      </StatusButton>
                    ) : (
                      <StatusButton
                        variant="secondary"
                        type="submit"
                        disabled
                        className="uppercase py-1 text-md w-40"
                      >
                        Out of stock
                      </StatusButton>
                    )}
                  </div>
                </div>
              </form>
            </div>
          ))}
          <DisplayPagination>
            <PaginationContent>
              {locations?.length > 0 &&
                totalPages &&
                [...Array(totalPages).keys()].map((pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationItem>
                      <button
                        onClick={() => handlePagination(pageNumber)}
                        className={cn(
                          buttonVariants({
                            variant:
                              pageNumber + 1 === currentPage + 1
                                ? "primary"
                                : "secondary",
                            size: "small",
                          }),
                        )}
                      >
                        {pageNumber + 1}
                      </button>
                    </PaginationItem>
                  </PaginationItem>
                ))}
            </PaginationContent>
          </DisplayPagination>
        </div>
      </div>
    </div>
  );
};

export default StoreLocator;
