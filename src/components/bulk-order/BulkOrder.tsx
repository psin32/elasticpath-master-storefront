import { useState } from "react";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import ErrorOverlay from "./ErrorOverlay";
import {
  ArrowDownOnSquareIcon,
  ArrowUpOnSquareIcon,
} from "@heroicons/react/24/outline";
import { useCart } from "../../react-shopper-hooks";
import { StatusButton } from "../button/StatusButton";
import { toast } from "react-toastify";

const BulkOrder = () => {
  const [textareaValue, setTextareaValue] = useState("");
  const [errors, setErrors] = useState<any[]>([]);
  const { useScopedAddBulkProductToCart } = useCart();
  const { mutate, isPending } = useScopedAddBulkProductToCart();

  const handleTextareaChange = (e: any) => {
    setTextareaValue(e.target.value);
  };

  const handleClearAll = () => {
    setTextareaValue("");
  };

  const handleCloseOverlay = () => {
    setErrors([]);
  };

  const handleAddToCart = () => {
    const items = textareaValue.split("\n").map((line) => {
      const [sku, quantity] = line.split(",");
      return {
        type: "cart_item",
        sku: sku.trim(),
        quantity: Number(quantity?.trim()),
      };
    });

    mutate(
      items.filter((item: any) => item.sku && item.quantity),
      {
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
      },
    );
  };

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data
          .slice(1)
          .map((row: any) => row.join(","))
          .join("\n");
        setTextareaValue(rows);
      },
    });
  };

  const handleDownloadTemplate = () => {
    const template = "sku,quantity\nSKU001,10\nSKU002,20\n";
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "bulk_order_template.csv");
  };

  return (
    <div>
      {errors?.length > 0 && (
        <ErrorOverlay errors={errors} onClose={handleCloseOverlay} />
      )}
      <div className="flex justify-between items-center mb-4">
        <div className="text-left">
          <div>Add product by SKU</div>
          <div className="text-sm font-thin">
            Add each SKU on a separate line. Use format: SKU, quantity
          </div>
        </div>
        <div className="flex space-x-4">
          <label
            htmlFor="file-upload"
            className="flex items-center text-brand-primary cursor-pointer hover:text-brand-secondary"
          >
            <ArrowUpOnSquareIcon className="h-5 w-5 mr-2" />
            Import CSV File
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center text-brand-primary hover:text-brand-secondary"
          >
            <ArrowDownOnSquareIcon className="h-5 w-5 mr-2" />
            Download Template File
          </button>
        </div>
      </div>
      <textarea
        value={textareaValue}
        onChange={handleTextareaChange}
        placeholder={"Ex:\nSKU001,10\nSKU002,20\n..."}
        className="w-full h-72 border-gray-300 rounded-md shadow-sm p-2 mb-4 block border border-input border-black/40 focus-visible:ring-0 focus-visible:border-black "
      ></textarea>
      <div className="flex justify-between mb-4 mt-8">
        <StatusButton
          variant="secondary"
          onClick={handleClearAll}
          className="text-md hover:bg-gray-100"
        >
          Clear All
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

export default BulkOrder;
