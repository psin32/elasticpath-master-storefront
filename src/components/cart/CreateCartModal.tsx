"use client";

import { useState } from "react";
import { XMarkIcon, TrashIcon } from "@heroicons/react/24/outline";
import { StatusButton } from "../button/StatusButton";
import { setCookie } from "cookies-next";
import { CART_COOKIE_NAME } from "../../lib/cookie-constants";
import { useRouter } from "next/navigation";
import { upsertCart } from "./actions";

interface CreateCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCartCreated?: (cartId: string, cartName: string) => void;
  selectedAccountToken?: any;
}

export function CreateCartModal({
  isOpen,
  onClose,
  onCartCreated,
  selectedAccountToken,
}: CreateCartModalProps) {
  const [cartRequest, setCartRequest] = useState({
    name: "",
    description: "",
  });
  const [customFields, setCustomFields] = useState([
    {
      fieldName: "",
      fieldType: "string",
      fieldValue: "",
    },
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCartRequest = (field: string, value: string) => {
    setCartRequest((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInputChange = (
    index: number,
    field: string,
    value: string | boolean,
  ) => {
    const newCustomFields = [...customFields];
    newCustomFields[index] = {
      ...newCustomFields[index],
      [field]: value,
    };
    setCustomFields(newCustomFields);
  };

  const addNewFieldRow = () => {
    setCustomFields([
      ...customFields,
      {
        fieldName: "",
        fieldType: "string",
        fieldValue: "",
      },
    ]);
  };

  const handleDeleteRow = (index: number) => {
    const newCustomFields = customFields.slice();
    newCustomFields.splice(index, 1);
    setCustomFields(newCustomFields);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    await createCart();
  };

  const handleButtonClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    await createCart();
  };

  const createCart = async () => {
    if (!selectedAccountToken) {
      console.error("No account token available");
      return;
    }

    if (!cartRequest.name.trim()) {
      console.error("Cart name is required");
      return;
    }

    setIsCreating(true);
    try {
      const customFieldRequest: any = { custom_attributes: {} };

      customFields?.forEach(({ fieldName, fieldType, fieldValue }) => {
        if (fieldName) {
          customFieldRequest.custom_attributes[fieldName] = {
            type: fieldType,
            value: fieldType === "integer" ? Number(fieldValue) : fieldValue,
          };
        }
      });
      const updatedCartRequest = { ...cartRequest, ...customFieldRequest };
      const response = (await upsertCart(true, updatedCartRequest, "")) as any;

      if (response?.data?.id) {
        // Set the new cart as the current cart
        setCookie(CART_COOKIE_NAME, response.data.id);

        // Call the callback if provided
        if (onCartCreated) {
          onCartCreated(response.data.id, response.data.name);
        }

        // Close the modal
        onClose();

        // Reset form
        setCartRequest({ name: "", description: "" });
        setCustomFields([
          { fieldName: "", fieldType: "string", fieldValue: "" },
        ]);

        // Refresh the page to update cart state
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating cart:", error);
      alert("Failed to create cart. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
        >
          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
        </button>
        <h1 className="text-2xl font-semibold mb-4">Create New Cart</h1>
        <form onSubmit={handleFormSubmit}>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={cartRequest?.name}
              onChange={(e) => handleCartRequest("name", e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="Enter cart name"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={cartRequest?.description}
              onChange={(e) => handleCartRequest("description", e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="Enter cart description (optional)"
              rows={3}
            />
          </div>

          {/* Custom Fields Section */}
          <div>
            {customFields?.length > 0 && (
              <span className="text-sm font-medium text-gray-700">
                Custom Attributes:
              </span>
            )}
            <div className="grid grid-cols-1 gap-4">
              {customFields?.map((field, index) => (
                <div key={index}>
                  <div className="flex space-x-4 mt-1">
                    <input
                      type="text"
                      placeholder="Field Name"
                      name="fieldName"
                      className="basis-1/3 block w-full border-gray-300 rounded-md shadow-sm p-2 border border-input focus:ring-brand-primary focus:border-brand-primary"
                      value={field.fieldName}
                      onChange={(e) =>
                        handleInputChange(index, "fieldName", e.target.value)
                      }
                    />
                    <select
                      id={`fieldType-${index}`}
                      name="fieldType"
                      value={field.fieldType}
                      onChange={(e) =>
                        handleInputChange(index, "fieldType", e.target.value)
                      }
                      className="basis-1/3 block w-full border-gray-300 rounded-md shadow-sm p-2 border border-input focus:ring-brand-primary focus:border-brand-primary"
                    >
                      <option value="string">String</option>
                      <option value="integer">Integer</option>
                      <option value="boolean">Boolean</option>
                    </select>
                    {(field.fieldType === "integer" ||
                      field.fieldType === "string") && (
                      <input
                        placeholder="Field Value"
                        type={field.fieldType === "integer" ? "number" : "text"}
                        id={`fieldValue-${index}`}
                        name="fieldValue"
                        value={field.fieldValue}
                        onChange={(e) =>
                          handleInputChange(index, "fieldValue", e.target.value)
                        }
                        className="block w-full border-gray-300 rounded-md shadow-sm p-2 border border-input focus:ring-brand-primary focus:border-brand-primary"
                      />
                    )}

                    {field.fieldType === "boolean" && (
                      <div
                        onClick={() =>
                          handleInputChange(
                            index,
                            "fieldValue",
                            !field.fieldValue,
                          )
                        }
                        className={`${
                          field.fieldValue ? "bg-green-500" : "bg-gray-300"
                        } mt-1 relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer transition-all`}
                      >
                        <span
                          className={`${
                            field.fieldValue ? "translate-x-6" : "translate-x-1"
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </div>
                    )}
                    <div className="flex items-start">
                      <TrashIcon
                        className="h-6 w-6 mt-2 cursor-pointer text-gray-400 hover:text-red-500"
                        onClick={() => handleDeleteRow(index)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <b>Note:</b> Adding custom fields in this storefront is only for
            demo perspective. Customers won&apos;t be able to add/edit custom
            fields as this requires{" "}
            <a
              className="text-blue-800 hover:underline"
              href="https://elasticpath.dev/docs/authentication/Tokens/client-credential-token"
              target="_blank"
              rel="noopener noreferrer"
            >
              client credentials token.
            </a>
          </div>

          <div className="mt-6 flex justify-between">
            <StatusButton
              variant="secondary"
              type="button"
              onClick={addNewFieldRow}
              className="text-md hover:bg-gray-100"
            >
              Add Custom Fields
            </StatusButton>
            <div className="flex space-x-3">
              <StatusButton
                variant="secondary"
                type="button"
                onClick={onClose}
                disabled={isCreating}
              >
                Cancel
              </StatusButton>
              <StatusButton
                variant="primary"
                type="button"
                status={isCreating ? "loading" : "idle"}
                disabled={isCreating}
                onClick={handleButtonClick}
              >
                {isCreating ? "Creating..." : "Create Cart"}
              </StatusButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
