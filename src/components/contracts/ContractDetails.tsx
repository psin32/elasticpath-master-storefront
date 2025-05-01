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
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  PlusIcon,
  MinusIcon,
  PlusCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { jsPDF } from "jspdf";
import {
  ProductResponse,
  ShopperCatalogResourcePage,
} from "@elasticpath/js-sdk";
import { toast } from "react-toastify";
import { useCart } from "../../react-shopper-hooks";
import {
  getContractOrders,
  getCurrentCartContract,
  updateCartWithContract,
} from "./actions";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

// Import the server action for price calculation
import { calculateContractItemPrice } from "../../services/contract-price-calculator";
import { ContractOrderHistoryClient } from "./ContractOrderHistoryClient";

export type ContractDetailsProps = {
  contractResponse: Awaited<ReturnType<typeof getContractById>>;
  account: AccountMemberCredential;
  orderHistoryResponse: Awaited<ReturnType<typeof getContractOrders>>;
  productLookup: Record<string, ProductResponse>;
};

export function ContractDetails({
  contractResponse,
  productLookup,
  orderHistoryResponse,
}: ContractDetailsProps) {
  const contract = contractResponse.data;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { useScopedAddProductToCart } = useCart();
  const { mutate: addToCart, isPending: isAddingToCart } =
    useScopedAddProductToCart();
  const [lineItemQuantities, setLineItemQuantities] = useState<
    Record<string, number>
  >({});
  const [pricesByProductId, setPricesByProductId] = useState<
    Record<
      string,
      {
        amount: number;
        currency: string;
        includes_tax?: boolean;
        breakdown?: any;
      }
    >
  >({});
  const [isLoadingPrices, setIsLoadingPrices] = useState<
    Record<string, boolean>
  >({});
  const [selectedContractId, setSelectedContractId] = useState<string | null>(
    null,
  );
  const [isSelectingContract, setIsSelectingContract] = useState(false);

  // Check if this contract is currently selected
  useEffect(() => {
    const checkSelectedContract = async () => {
      try {
        const cartContract = await getCurrentCartContract();
        if (cartContract.success) {
          setSelectedContractId(cartContract.contractId);
        }
      } catch (error) {
        console.error("Error checking selected contract:", error);
      }
    };

    checkSelectedContract();
  }, []);

  // Check if this is the currently selected contract
  const isCurrentContractSelected =
    selectedContractId === contract.contract_ref;

  // Initialize quantities for each line item
  useEffect(() => {
    if (contract?.line_items?.data) {
      const quantities: Record<string, number> = {};
      const loadingState: Record<string, boolean> = {};
      contract.line_items.data.forEach((item: ContractLineItem) => {
        quantities[item.product_id] = 1;
        loadingState[item.product_id] = true; // Start with loading state
      });
      setLineItemQuantities(quantities);
      setIsLoadingPrices(loadingState);

      // Initialize price data by calling the server action for each product
      const fetchInitialPrices = async () => {
        const initialPrices: Record<
          string,
          {
            amount: number;
            currency: string;
            includes_tax?: boolean;
            breakdown?: any;
          }
        > = {};

        // Fetch prices for all items in parallel
        await Promise.all(
          contract.line_items.data.map(async (item: ContractLineItem) => {
            try {
              const response = await calculateContractItemPrice(
                item.product_id,
                1,
              );
              if (response.success && response.data) {
                if (response.data.price) {
                  initialPrices[item.product_id] = {
                    ...response.data.price,
                    breakdown: response.data.breakdown || undefined,
                  };
                }
              } else {
                // Fallback to product data if dynamic pricing fails
                const product = productLookup[item.product_id];
                if (product?.meta?.display_price?.with_tax) {
                  const price = product.meta.display_price.with_tax;
                  initialPrices[item.product_id] = {
                    amount: price.amount || 0,
                    currency: price.currency || "USD",
                  };
                } else {
                  initialPrices[item.product_id] = {
                    amount: 0,
                    currency: "USD",
                  };
                }
              }
            } catch (error) {
              console.error(
                `Error fetching price for ${item.product_id}:`,
                error,
              );
              // Fallback to product data if available or set default
              const product = productLookup[item.product_id];
              if (product?.meta?.display_price?.with_tax) {
                const price = product.meta.display_price.with_tax;
                initialPrices[item.product_id] = {
                  amount: price.amount || 0,
                  currency: price.currency || "USD",
                };
              } else {
                initialPrices[item.product_id] = { amount: 0, currency: "USD" };
              }
            }
          }),
        );

        setPricesByProductId(initialPrices);

        // Update loading states to false after all prices are fetched
        const updatedLoadingState: Record<string, boolean> = {};
        contract.line_items.data.forEach((item: ContractLineItem) => {
          updatedLoadingState[item.product_id] = false;
        });
        setIsLoadingPrices(updatedLoadingState);
      };

      fetchInitialPrices();
    }
  }, [contract, productLookup]);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setLineItemQuantities((prev) => ({
      ...prev,
      [productId]: newQuantity,
    }));

    // Update loading state while we fetch new price
    setIsLoadingPrices((prev) => ({
      ...prev,
      [productId]: true,
    }));

    // Call the server action for price calculation
    const fetchUpdatedPrice = async () => {
      try {
        const response = await calculateContractItemPrice(
          productId,
          newQuantity,
        );

        if (response.success && response.data) {
          const priceData = response.data.price;
          const breakdownData = response.data.breakdown;

          if (priceData) {
            setPricesByProductId((prev) => ({
              ...prev,
              [productId]: {
                ...priceData,
                breakdown: breakdownData || undefined,
              },
            }));
          } else {
            // If price data is missing, fall back to scaling
            scaleBasePriceByQuantity(productId, newQuantity);
          }
        } else {
          // If dynamic pricing fails, scale the current price by quantity
          scaleBasePriceByQuantity(productId, newQuantity);
        }
      } catch (error) {
        console.error(`Error calculating price for ${productId}:`, error);
        toast.error("Could not calculate updated price", {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
        });
        // Attempt to scale the price as a fallback
        scaleBasePriceByQuantity(productId, newQuantity);
      } finally {
        // Set loading state back to false
        setIsLoadingPrices((prev) => ({
          ...prev,
          [productId]: false,
        }));
      }
    };

    fetchUpdatedPrice();
  };

  // Helper function to scale the base price by quantity (fallback method)
  const scaleBasePriceByQuantity = (productId: string, newQuantity: number) => {
    setPricesByProductId((prev) => {
      const basePrice = prev[productId]?.amount || 0;
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          amount: basePrice * newQuantity,
          breakdown: {
            ...prev[productId]?.breakdown,
            quantity: newQuantity,
            totalBeforeDiscount: basePrice * newQuantity,
            totalAfterDiscount: basePrice * newQuantity,
          },
        },
      };
    });
  };

  const handleAddToCart = (productId: string) => {
    const quantity = lineItemQuantities[productId] || 1;
    const data = {
      custom_inputs: {
        additional_information: [],
      },
    };

    addToCart(
      { productId, quantity, data },
      {
        onError: (response: any) => {
          if (response?.errors) {
            toast.error(response?.errors?.[0].detail, {
              position: "top-center",
              autoClose: 2000,
              hideProgressBar: false,
            });
          }
        },
      },
    );
  };

  // Helper function to format price
  const formatPrice = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100); // Assuming the amount is in cents
  };

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
      contract.display_name ||
        `Contract ${contract.contract_ref.substring(0, 8)}`,
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
    doc.text(`Contract Ref: ${contract.contract_ref}`, 25, 70);
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

    doc.save(`Contract_${contract.contract_ref.substring(0, 8)}.pdf`);
  };

  const handleSelectContract = async () => {
    setIsSelectingContract(true);
    try {
      const result = await updateCartWithContract(contract.contract_ref);
      if (result.success) {
        setSelectedContractId(contract.contract_ref);
        toast.success("Now shopping with contract successfully");
        queryClient.invalidateQueries({
          queryKey: ["contract", "active-contract"],
        });
        router.refresh();
      } else {
        toast.error(result.error || "Failed to shop with contract");
      }
    } catch (error) {
      console.error("Error selecting contract:", error);
      toast.error("Failed to shop with contract");
    } finally {
      setIsSelectingContract(false);
    }
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
                  `Contract ${contract.contract_ref.substring(0, 8)}`}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`${
                  statusColors[status as keyof typeof statusColors]
                } uppercase inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset`}
              >
                {status}
              </span>

              {!isCurrentContractSelected && (
                <button
                  type="button"
                  onClick={handleSelectContract}
                  disabled={isSelectingContract}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  {isSelectingContract ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Applying...
                    </>
                  ) : (
                    "Shop with Contract"
                  )}
                </button>
              )}

              {isCurrentContractSelected && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-md">
                  <CheckCircleIcon className="h-4 w-4" />
                  Currently Shopping With
                </span>
              )}
            </div>
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
              <dt className="text-sm font-medium text-gray-500">
                Contract Ref
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {contract.contract_ref}
              </dd>
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
          {contract.line_items?.data.length > 0 ? (
            <div className="mt-8">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Contract Line Items
                </h3>
                {isCurrentContractSelected ? (
                  <Link
                    href="/search"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusCircleIcon className="h-5 w-5 mr-1" />
                    Add New License
                  </Link>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    Shop with this contract to add new licenses
                  </div>
                )}
              </div>
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
                        Contract Quantity
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Price
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Add to Cart
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isLoadingPrices[item.product_id] ? (
                              <div className="flex items-center">
                                <svg
                                  className="animate-spin h-4 w-4 mr-2 text-blue-500"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Calculating...
                              </div>
                            ) : (
                              <div>
                                {pricesByProductId[item.product_id] ? (
                                  <div>
                                    <div className="font-medium">
                                      {formatPrice(
                                        pricesByProductId[item.product_id]
                                          .amount,
                                        pricesByProductId[item.product_id]
                                          .currency,
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      for{" "}
                                      {lineItemQuantities[item.product_id] || 1}{" "}
                                      units
                                    </div>
                                    {pricesByProductId[item.product_id]
                                      .breakdown?.discount > 0 && (
                                      <div className="text-xs text-green-600 mt-1">
                                        {
                                          pricesByProductId[item.product_id]
                                            .breakdown.discount
                                        }
                                        % volume discount applied
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  "N/A"
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isCurrentContractSelected ? (
                              <div className="flex items-center space-x-2">
                                <div className="flex items-start rounded-lg border border-black/10 w-32">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuantityChange(
                                        item.product_id,
                                        (lineItemQuantities[item.product_id] ||
                                          1) - 1,
                                      )
                                    }
                                    className="ease flex w-9 h-9 justify-center items-center transition-all duration-200"
                                  >
                                    <MinusIcon className="h-4 w-4 dark:text-neutral-500" />
                                  </button>
                                  <svg
                                    width="2"
                                    height="36"
                                    viewBox="0 0 2 36"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1 0V36"
                                      stroke="black"
                                      strokeOpacity="0.1"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>

                                  <input
                                    type="number"
                                    placeholder="Qty"
                                    className="border-none focus-visible:ring-0 focus-visible:border-black w-14 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    value={
                                      lineItemQuantities[item.product_id] || 1
                                    }
                                    onChange={(e) =>
                                      handleQuantityChange(
                                        item.product_id,
                                        parseInt(e.target.value) || 1,
                                      )
                                    }
                                    min="1"
                                  />

                                  <svg
                                    width="2"
                                    height="36"
                                    viewBox="0 0 2 36"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1 0V36"
                                      stroke="black"
                                      strokeOpacity="0.1"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuantityChange(
                                        item.product_id,
                                        (lineItemQuantities[item.product_id] ||
                                          1) + 1,
                                      )
                                    }
                                    className="ease flex w-9 h-9 justify-center items-center transition-all duration-200"
                                  >
                                    <PlusIcon className="h-4 w-4 dark:text-neutral-500" />
                                  </button>
                                </div>
                                <button
                                  onClick={() =>
                                    handleAddToCart(item.product_id)
                                  }
                                  disabled={isAddingToCart}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                                >
                                  Add to Cart
                                </button>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 italic">
                                Shop with contract first
                              </div>
                            )}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mt-8 border border-dashed border-gray-300 rounded-lg p-8">
              <div className="text-center">
                <PlusCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">
                  No licenses
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This contract doesn&apos;t have any licenses yet.
                </p>
                <div className="mt-6">
                  {isCurrentContractSelected ? (
                    <Link
                      href="/search"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PlusCircleIcon className="h-5 w-5 mr-1" />
                      Add a New License
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSelectContract}
                      disabled={isSelectingContract}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                    >
                      {isSelectingContract
                        ? "Applying..."
                        : "Shop with This Contract First"}
                    </button>
                  )}
                </div>
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

      {/* Order History Section */}
      {orderHistoryResponse && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Order History
          </h2>
          <ContractOrderHistoryClient ordersResult={orderHistoryResponse} />
        </div>
      )}
    </div>
  );
}
