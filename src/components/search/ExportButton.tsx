"use client";
import { Popover, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { ProductResponse } from "@elasticpath/js-sdk";
import {
  generateCSV,
  generatePDFHTML,
  downloadCSV,
  downloadPDF,
  ProductInventoryData,
  LocationData,
} from "../../lib/export-utils";

interface ExportButtonProps {
  products: ProductResponse[];
  inventories: Record<string, Record<string, number>>;
  locations: any[];
}

export default function ExportButton({
  products,
  inventories,
  locations,
}: ExportButtonProps) {
  const handleExportCSV = () => {
    const locationData: LocationData[] = locations.map((loc) => ({
      id: loc.id,
      name: loc.attributes?.name || loc.attributes?.slug,
      slug: loc.attributes?.slug,
    }));

    const productData: ProductInventoryData[] = products.map((product) => ({
      product,
      inventories: inventories[product.id] || {},
    }));

    const csvContent = generateCSV(productData, locationData);
    const timestamp = new Date().toISOString().split("T")[0];
    downloadCSV(csvContent, `products-inventory-${timestamp}.csv`);
  };

  const handleExportPDF = () => {
    const locationData: LocationData[] = locations.map((loc) => ({
      id: loc.id,
      name: loc.attributes?.name || loc.attributes?.slug,
      slug: loc.attributes?.slug,
    }));

    const productData: ProductInventoryData[] = products.map((product) => ({
      product,
      inventories: inventories[product.id] || {},
    }));

    const htmlContent = generatePDFHTML(productData, locationData);
    downloadPDF(htmlContent);
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <Popover className="relative">
      {() => (
        <>
          <Popover.Button className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2">
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span className="font-semibold">Export</span>
          </Popover.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute right-0 z-10 mt-2 w-56 transform sm:px-0 xl:left-0 xl:right-auto">
              <div className="flex flex-col items-start overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                <div className="w-full border-b border-gray-100 px-4 py-2.5 bg-gray-50">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Export Format
                  </h3>
                </div>
                <div className="w-full py-1">
                  <Popover.Button
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors text-gray-700 hover:bg-gray-50"
                    onClick={handleExportCSV}
                  >
                    <TableCellsIcon className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">Export as CSV</div>
                      <div className="text-xs text-gray-500">
                        Excel compatible format
                      </div>
                    </div>
                  </Popover.Button>
                  <Popover.Button
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors text-gray-700 hover:bg-gray-50"
                    onClick={handleExportPDF}
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="font-medium">Export as PDF</div>
                      <div className="text-xs text-gray-500">
                        Print-ready document
                      </div>
                    </div>
                  </Popover.Button>
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
