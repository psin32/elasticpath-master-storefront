import { MinusIcon, PlusIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useState } from "react";
import { Button } from "../button/Button";
import { TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { useCart } from "../../react-shopper-hooks";
import { CartItemObject } from "@moltin/sdk";

const QuickOrder = () => {
  const { state, useScopedAddBulkProductToCart } = useCart();
  const { mutate, isPending } = useScopedAddBulkProductToCart();

  const [items, setItems] = useState([{ sku: "", quantity: 1 }]);
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
      onSuccess: (data: any) => {
        if (data.errors) {
          setErrors(data.errors);
        }
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white p-6">
      <h1 className="text-3xl font-medium mb-6">Quick Order</h1>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index}>
            <div className="flex space-x-4">
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
        <Button
          variant={"secondary"}
          onClick={handleAddRow}
          className="text-md hover:bg-brand-primary hover:text-white"
        >
          Add More
        </Button>
        <Button variant={"primary"} onClick={handleAddToCart}>
          Add to Cart
        </Button>
      </div>
    </div>
  );
};

export default QuickOrder;
