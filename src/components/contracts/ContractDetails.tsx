"use client";

import { useEffect, useState } from "react";
import {
  formatIsoDateString,
  formatIsoTimeString,
} from "../../lib/format-iso-date-string";
import { AccountMemberCredential } from "../../app/(auth)/account-member-credentials-schema";
import {
  ContractLineItem,
  getContractById,
} from "../../app/(checkout)/create-quote/contracts-service";
import Link from "next/link";
import { ArrowLeftIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { jsPDF } from "jspdf";
import {
  ProductResponse,
  ShopperCatalogResourcePage,
} from "@elasticpath/js-sdk";

export type ContractDetailsProps = {
  contractResponse: Awaited<ReturnType<typeof getContractById>>;
  account: AccountMemberCredential;
  productLookup: Record<string, ProductResponse>;
};

// Define the line item type

export function ContractDetails({
  contractResponse,
  productLookup,
}: ContractDetailsProps) {
  const contract = contractResponse.data;
  const getContractStatus = (contract: any) => {
    const now = new Date();
    const startDate = new Date(contract.start_date);
    const endDate = contract.end_date ? new Date(contract.end_date) : null;

    if (endDate && now > endDate) {
      return "Expired";
    } else if (now < startDate) {
      return "Pending";
    } else {
      return "Active";
    }
  };

  const downloadContractPDF = () => {
    if (!contract) return;

    const doc = new jsPDF();
    doc.setFont("helvetica");

    // Title
    doc.setFontSize(20);
    doc.text("Contract Details", 105, 20, { align: "center" });

    // Contract Name
    doc.setFontSize(16);
    doc.text(
      contract.display_name || `Contract ${contract.id.substring(0, 8)}`,
      105,
      35,
      { align: "center" },
    );

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(20, 45, 190, 45);

    // Contract info section
    doc.setFontSize(12);
    doc.text("Contract Information", 20, 60);

    doc.setFontSize(10);
    doc.text(`Contract ID: ${contract.id}`, 25, 70);
    doc.text(`Status: ${getContractStatus(contract)}`, 25, 80);
    doc.text(
      `Start Date: ${new Date(contract.start_date).toLocaleDateString()}`,
      25,
      90,
    );

    if (contract.end_date) {
      doc.text(
        `End Date: ${new Date(contract.end_date).toLocaleDateString()}`,
        25,
        100,
      );
    } else {
      doc.text("End Date: No end date", 25, 100);
    }

    if (contract.meta?.timestamps?.created_at) {
      doc.text(
        `Created: ${new Date(contract.meta.timestamps.created_at).toLocaleString()}`,
        25,
        110,
      );
    }

    // Description section if available
    if (contract.description) {
      doc.setFontSize(12);
      doc.text("Contract Description", 20, 130);
      doc.setFontSize(10);

      const descriptionLines = doc.splitTextToSize(contract.description, 170);
      doc.text(descriptionLines, 25, 140);
    }

    // Add line items section to PDF if available
    if (contract.line_items?.data.length > 0) {
      const yPos = contract.description
        ? 160 + doc.splitTextToSize(contract.description, 170).length * 6
        : 130;

      doc.setFontSize(12);
      doc.text("Contract Line Items", 20, yPos);
      doc.setFontSize(10);

      let itemYPos = yPos + 10;
      contract.line_items?.data.forEach(
        (item: ContractLineItem, index: number) => {
          doc.text(
            `${index + 1}. Product ID: ${item.product_id}`,
            25,
            itemYPos,
          );
          itemYPos += 6;
          doc.text(`   SKU: ${item.sku}`, 25, itemYPos);
          itemYPos += 6;
          doc.text(`   Quantity: ${item.quantity}`, 25, itemYPos);
          itemYPos += 10;
        },
      );
    }

    // Contract Terms section if available
    if (contract.terms) {
      const yPosAfterItems =
        contract.line_items?.data.length > 0
          ? 150 + contract.line_items?.data.length * 22
          : contract.description
            ? 160 + doc.splitTextToSize(contract.description, 170).length * 6
            : 130;

      doc.setFontSize(12);
      doc.text("Contract Terms and Conditions", 20, yPosAfterItems);
      doc.setFontSize(10);

      const termsLines = doc.splitTextToSize(contract.terms, 170);
      doc.text(termsLines, 25, yPosAfterItems + 10);
    }

    // Footer
    doc.setFontSize(8);
    doc.text(`Downloaded on ${new Date().toLocaleString()}`, 105, 280, {
      align: "center",
    });

    doc.save(`Contract_${contract.id.substring(0, 8)}.pdf`);
  };

  if (!contract) {
    return (
      <div className="flex flex-col p-5 lg:p-24">
        <Link
          href="/contracts"
          className="flex items-center text-blue-600 mb-8"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Contracts
        </Link>
        <div className="text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            Contract not found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            We couldn&apos;t find the contract you&apos;re looking for.
          </p>
          <Link href="/contracts" className="mt-6 inline-block text-blue-600">
            Return to Contracts
          </Link>
        </div>
      </div>
    );
  }

  const status = getContractStatus(contract);
  const statusColors = {
    Active: "bg-green-50 text-green-700 ring-green-600/20",
    Expired: "bg-red-50 text-red-700 ring-red-600/20",
    Pending: "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
  };

  return (
    <div className="flex flex-col p-5 lg:p-24">
      <Link href="/contracts" className="flex items-center text-blue-600 mb-8">
        <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Contracts
      </Link>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <DocumentTextIcon className="h-6 w-6 text-gray-500 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">
                {contract.display_name ||
                  `Contract ${contract.id.substring(0, 8)}`}
              </h1>
            </div>
            <span
              className={`${
                statusColors[status as keyof typeof statusColors]
              } uppercase inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset`}
            >
              {status}
            </span>
          </div>
        </div>

        {/* Contract Info */}
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Contract ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{contract.id}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">{status}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Start Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatIsoDateString(contract.start_date)}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">End Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {contract.end_date ? (
                  formatIsoDateString(contract.end_date)
                ) : (
                  <span className="text-gray-500">No end date</span>
                )}
              </dd>
            </div>
            {contract.meta?.timestamps?.created_at && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatIsoDateString(contract.meta.timestamps.created_at)}
                  <div className="text-xs text-gray-500">
                    {formatIsoTimeString(contract.meta.timestamps.created_at)}
                  </div>
                </dd>
              </div>
            )}
          </dl>

          {/* Description section if available */}
          {contract.description && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900">Description</h3>
              <div className="mt-2 prose prose-sm text-gray-700">
                <p>{contract.description}</p>
              </div>
            </div>
          )}

          {/* Line Items section */}
          {contract.line_items?.data.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900">
                Contract Line Items
              </h3>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Product Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Product ID
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        SKU
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contract.line_items?.data.map(
                      (item: ContractLineItem, index: any) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {productLookup[item.product_id]?.attributes.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.product_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.sku}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Terms section if available */}
          {contract.terms && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900">
                Terms and Conditions
              </h3>
              <div className="mt-2 prose prose-sm text-gray-700 bg-gray-50 p-4 rounded-md border border-gray-200">
                <p>{contract.terms}</p>
              </div>
            </div>
          )}

          {/* Download button */}
          <div className="mt-8 border-t border-gray-200 pt-5">
            <button
              type="button"
              onClick={downloadContractPDF}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Download Contract PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
