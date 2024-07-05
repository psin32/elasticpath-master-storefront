import { MinusIcon, PlusIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useState } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { useCart } from "../../react-shopper-hooks";
import { CartItemObject } from "@moltin/sdk";
import { StatusButton } from "../button/StatusButton";

const QuickOrder = () => {
  const { useScopedAddBulkProductToCart } = useCart();
  const { mutate, isPending } = useScopedAddBulkProductToCart();

  const [items, setItems] = useState([
    { sku: "", quantity: 1 },
    { sku: "", quantity: 1 },
    { sku: "", quantity: 1 },
    { sku: "", quantity: 1 },
    { sku: "", quantity: 1 },
    { sku: "", quantity: 1 },
  ]);
  const [errors, setErrors] = useState<any[]>([]);

  const handleAddRow = () => {
    setItems([...items, { sku: "", quantity: 1 }]);
  };

  const handleDeleteRow = (index: number) => {
    if (items.length === 1) {
      toast.error("Atleast one row is required!", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
      });
      return;
    }
    const newItems = items.slice();
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleInputChange = (index: number, field: any, value: any) => {
    if (field === "quantity" && value === 0) return;
    if (field === "quantity" && value === "") value = 1;
    const newItems: any = items.slice();
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleAddToCart = async () => {
    setErrors([]);
    const cartItems: CartItemObject[] = items
      .filter((item) => item.sku)
      .map((item) => {
        return {
          type: "cart_item",
          sku: item.sku,
          quantity: item.quantity,
        };
      });
    mutate(cartItems, {
      onSuccess: (response: any) => {
        if (response?.errors) {
          setErrors(response.errors);
        }

        if (response?.data?.length > 0) {
          toast("Items added successfully in your cart", {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
          });
        }
      },
    });
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 bg-white">
      <span className="text-md font-light">
        Enter product SKU’s and Quantity in inputs. The quick add form accepts
        up to 100 items at a time.
      </span>
      <div className="mt-6 grid grid-cols-2 gap-4">
        {items.map((item, index) => (
          <div key={index}>
            <div className="flex space-x-4 mt-6">
              <input
                type="text"
                placeholder="SKU"
                className="block w-full border-gray-300 rounded-md shadow-sm p-2 border border-input border-black/40 focus-visible:ring-0 focus-visible:border-black "
                value={item.sku}
                onChange={(e) =>
                  handleInputChange(index, "sku", e.target.value)
                }
              />

              <div className="flex items-start rounded-lg border border-black/10">
                <button
                  type="submit"
                  onClick={() =>
                    handleInputChange(
                      index,
                      "quantity",
                      parseInt(items[index].quantity as any) - 1,
                    )
                  }
                  className={clsx(
                    "ease flex w-9 h-full p-2 justify-center items-center transition-all duration-200",
                    {
                      "ml-auto": true,
                    },
                  )}
                >
                  <MinusIcon className="h-4 w-4 dark:text-neutral-500" />
                </button>
                <svg
                  width="2"
                  height="42"
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
                  placeholder="Quantity"
                  className="border-none focus-visible:ring-0 focus-visible:border-black  w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={item.quantity}
                  onChange={(e) =>
                    handleInputChange(
                      index,
                      "quantity",
                      parseInt(e.target.value),
                    )
                  }
                />
                <svg
                  width="2"
                  height="42"
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
                  type="submit"
                  onClick={() =>
                    handleInputChange(
                      index,
                      "quantity",
                      parseInt(items[index].quantity as any) + 1,
                    )
                  }
                  className={clsx(
                    "ease flex w-9 h-full p-2 justify-center items-center transition-all duration-200",
                    {
                      "ml-auto": false,
                    },
                  )}
                >
                  <PlusIcon className="h-4 w-4 dark:text-neutral-500" />
                </button>
              </div>
              <div className="flex items-start">
                <TrashIcon
                  className="h-6 w-6 mt-2"
                  onClick={() => handleDeleteRow(index)}
                />
              </div>
            </div>
            {errors.length > 0 &&
              errors.find((error) => error.meta.sku === item.sku) && (
                <div className="text-red-700 mt-2 p-2">
                  {item.sku} -{" "}
                  {errors.find((error) => error.meta.sku === item.sku)?.title}
                </div>
              )}
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-between">
        <StatusButton
          variant="secondary"
          onClick={handleAddRow}
          className="text-md hover:bg-gray-100"
        >
          Add More
        </StatusButton>
        <StatusButton
          variant="primary"
          onClick={handleAddToCart}
          status={isPending ? "loading" : "idle"}
        >
          Add to Cart
        </StatusButton>
      </div>
    </div>
  );
};

export default QuickOrder;
