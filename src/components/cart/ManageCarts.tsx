"use client";

import { Menu, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { EllipsisVerticalIcon, XMarkIcon } from "@heroicons/react/20/solid";
import {
  formatIsoDateString,
  formatIsoTimeString,
} from "../../lib/format-iso-date-string";
import { getCookie, setCookie } from "cookies-next";
import { CART_COOKIE_NAME } from "../../lib/cookie-constants";
import { useRouter } from "next/navigation";
import { getEpccImplicitClient } from "../../lib/epcc-implicit-client";
import { useCart } from "../../react-shopper-hooks";
import { StatusButton } from "../button/StatusButton";
import { TrashIcon } from "@heroicons/react/24/outline";
import { upsertCart } from "./actions";

export type ManageCartsProps = {
  token: string;
};

export function ManageCarts({ token }: ManageCartsProps) {
  const router = useRouter();
  const { useClearCart } = useCart();
  const { mutateAsync: mutateClearCart } = useClearCart();

  const cartIdInCookie = getCookie(CART_COOKIE_NAME);
  const client = getEpccImplicitClient();
  const [accountCarts, setAccountCarts] = useState<any>();
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [newCart, setNewCart] = useState<boolean>(false);
  const [cartId, setCartId] = useState<string | undefined>(undefined);
  const [cartRequest, setCartRequest] = useState<any>();
  const [customFields, setCustomFields] = useState([
    {
      fieldName: "",
      fieldType: "string",
      fieldValue: "",
    },
  ]);

  const handleDeleteRow = (index: number) => {
    const newCustomFields = customFields.slice();
    newCustomFields.splice(index, 1);
    setCustomFields(newCustomFields);
  };

  useEffect(() => {
    const init = async () => {
      await refreshCart();
    };
    init();
  }, []);

  const refreshCart = async () => {
    const accountCarts = await client.request
      .send(`/carts`, "GET", null, undefined, client, undefined, "v2", {
        "EP-Account-Management-Authentication-Token": token,
      })
      .catch((err) => {
        console.error("Error while getting account carts", err);
      });
    setAccountCarts(accountCarts);
    return accountCarts;
  };

  const handleCartSelection = async (cartId: string, name: string) => {
    await client.Cart(cartId).UpdateCart({
      name,
    });
    await refreshCart();
    setCookie(CART_COOKIE_NAME, cartId);
    router.refresh();
  };

  const handleDeleteCart = async (cartId: string) => {
    await client.Cart(cartId).Delete();
    const accountCarts = await refreshCart();
    await handleCartSelection(
      accountCarts.data[0].id,
      accountCarts.data[0].name,
    );
  };

  const handleDeleteAllItems = async (cartId: string) => {
    await mutateClearCart({ cartId });
    await refreshCart();
    router.refresh();
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
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
    await upsertCart(newCart, updatedCartRequest, cartId);

    setIsOverlayOpen(false);
    await refreshCart();
    router.refresh();
  };

  const handleOpenOverlay = (newCart: boolean, cartId?: string) => {
    setCartRequest({});
    setNewCart(newCart);
    setCartId(cartId);
    if (cartId) {
      const cart = accountCarts.data.find((cart: any) => cart.id == cartId);
      setCartRequest(cart);
      const fields =
        cart?.custom_attributes &&
        Object.keys(cart?.custom_attributes).map((fieldName) => {
          return {
            fieldName,
            fieldType: cart.custom_attributes[fieldName].type,
            fieldValue: cart.custom_attributes[fieldName].value,
          };
        });
      setCustomFields(fields);
    }
    setIsOverlayOpen(true);
  };

  const handleCloseOverlay = () => {
    setIsOverlayOpen(false);
  };

  const handleCartRequest = (field: string, value: any) => {
    const request = { ...cartRequest };
    request[field] = value;
    setCartRequest(request);
  };

  const addNewFieldRow = () => {
    if (customFields) {
      setCustomFields([
        ...customFields,
        { fieldName: "", fieldType: "string", fieldValue: "" },
      ]);
    } else {
      setCustomFields([{ fieldName: "", fieldType: "string", fieldValue: "" }]);
    }
  };

  const handleInputChange = (index: number, field: any, value: any) => {
    const newItems: any = customFields.slice();
    newItems[index][field] = value;
    setCustomFields(newItems);
  };

  return (
    <div className="flex flex-col lg:flex-row flex-1 self-stretch">
      <div className="flex justify-center self-stretch items-start gap-2 flex-only-grow">
        <div className="flex flex-col gap-10 p-5 lg:p-24 w-full">
          <h1 className="text-4xl font-medium">Manage Carts</h1>
          <div>
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto"></div>
              <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button
                  type="button"
                  className="block rounded-md bg-brand-primary px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
                  onClick={() => handleOpenOverlay(true)}
                >
                  Create New Cart
                </button>
              </div>
            </div>
            <div className="mt-8 flow-root">
              <div className="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <div className="shadow ring-1 ring-black ring-opacity-5">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                          >
                            Name
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Items
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Total
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Created
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Updated
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-28"
                          ></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {accountCarts?.data.map((cart: any) => (
                          <tr
                            key={cart.id}
                            className={
                              cartIdInCookie === cart.id ? "bg-green-50" : ""
                            }
                          >
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-800 sm:pl-6 w-1/4">
                              {cartIdInCookie === cart.id && (
                                <span className="inline-flex items-center rounded-md bg-green-300 px-2 text-[10px] text-green-900 ring-1 ring-inset ring-green-600/20 mb-2">
                                  Selected Cart
                                </span>
                              )}

                              <div>{cart.name}</div>
                              <div className="mt-1 text-sm leading-5 text-gray-500">
                                {cart.description}
                              </div>
                              <div className="mt-1 text-xs leading-5 text-gray-500">
                                {cart.id}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-800">
                              {cart.relationships.items.data?.length || 0}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-800">
                              {cart.meta.display_price.with_tax.formatted}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-800">
                              <div>
                                {formatIsoDateString(
                                  cart.meta.timestamps.created_at,
                                )}
                              </div>
                              <div className="mt-1 text-xs leading-5 text-gray-500">
                                {formatIsoTimeString(
                                  cart.meta.timestamps.created_at,
                                )}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-800">
                              <div>
                                <div>
                                  {formatIsoDateString(
                                    cart.meta.timestamps.updated_at,
                                  )}
                                </div>
                                <div className="mt-1 text-xs leading-5 text-gray-500">
                                  {formatIsoTimeString(
                                    cart.meta.timestamps.updated_at,
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 w-28">
                              <div className="text-right">
                                <Menu
                                  as="div"
                                  className="relative inline-block text-left"
                                >
                                  <div>
                                    <Menu.Button className="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900">
                                      <EllipsisVerticalIcon
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                      />
                                    </Menu.Button>
                                  </div>
                                  <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95"
                                  >
                                    <Menu.Items className="absolute right-0 z-20 mt-2 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 transition focus:outline-none">
                                      <div className="px-1 py-1 ">
                                        <Menu.Item>
                                          {({ active }) => (
                                            <button
                                              className={`${
                                                active
                                                  ? "bg-brand-primary text-white"
                                                  : "text-gray-900"
                                              } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                              onClick={() =>
                                                handleOpenOverlay(
                                                  false,
                                                  cart.id,
                                                )
                                              }
                                            >
                                              Edit
                                            </button>
                                          )}
                                        </Menu.Item>
                                        <Menu.Item>
                                          {({ active }) => (
                                            <button
                                              className={`${
                                                active
                                                  ? "bg-brand-primary text-white"
                                                  : "text-gray-900"
                                              } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                              onClick={() =>
                                                handleCartSelection(
                                                  cart.id,
                                                  cart.name,
                                                )
                                              }
                                            >
                                              Select this cart
                                            </button>
                                          )}
                                        </Menu.Item>
                                        {accountCarts.data.length > 1 && (
                                          <Menu.Item>
                                            {({ active }) => (
                                              <button
                                                className={`${
                                                  active
                                                    ? "bg-brand-primary text-white"
                                                    : "text-gray-900"
                                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                onClick={() =>
                                                  handleDeleteCart(cart.id)
                                                }
                                              >
                                                Delete Cart
                                              </button>
                                            )}
                                          </Menu.Item>
                                        )}
                                        <Menu.Item>
                                          {({ active }) => (
                                            <button
                                              className={`${
                                                active
                                                  ? "bg-brand-primary text-white"
                                                  : "text-gray-900"
                                              } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                              onClick={() =>
                                                handleDeleteAllItems(cart.id)
                                              }
                                            >
                                              Delete All Items
                                            </button>
                                          )}
                                        </Menu.Item>
                                      </div>
                                    </Menu.Items>
                                  </Transition>
                                </Menu>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isOverlayOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl relative">
            <button
              onClick={handleCloseOverlay}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
            <h1 className="text-2xl font-semibold mb-4">
              {newCart ? "Create New Cart" : "Edit Cart"}
            </h1>
            <form onSubmit={handleSubmit}>
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
                  onChange={(e) =>
                    handleCartRequest("description", e.target.value)
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                />
              </div>
              {/* New Field Section */}
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
                            handleInputChange(
                              index,
                              "fieldName",
                              e.target.value,
                            )
                          }
                        />
                        <select
                          id={`fieldType-${index}`}
                          name="fieldType"
                          value={field.fieldType}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "fieldType",
                              e.target.value,
                            )
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
                            type={
                              field.fieldType === "integer" ? "number" : "text"
                            }
                            id={`fieldValue-${index}`}
                            name="fieldValue"
                            value={field.fieldValue}
                            onChange={(e) =>
                              handleInputChange(
                                index,
                                "fieldValue",
                                e.target.value,
                              )
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
                                field.fieldValue
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                          </div>
                        )}
                        <div className="flex items-start">
                          <TrashIcon
                            className="h-6 w-6 mt-2"
                            onClick={() => handleDeleteRow(index)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mt-4 text-sm">
                  <b>Note:</b> Adding custom fields in this storefront is only
                  for demo perspective. Customers won&apos;t able to add/edit
                  custom fields as this require{" "}
                  <a
                    className="text-blue-800"
                    href="https://elasticpath.dev/docs/authentication/Tokens/client-credential-token"
                    target="_blank"
                  >
                    client credentials token.
                  </a>
                </div>
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
                <StatusButton variant="primary" type="submit">
                  {newCart ? "Create Cart" : "Update Cart"}
                </StatusButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
