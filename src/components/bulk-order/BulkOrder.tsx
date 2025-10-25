import { useState } from "react";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import ErrorOverlay from "./ErrorOverlay";
import {
  ArrowDownOnSquareIcon,
  ArrowUpOnSquareIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import { useCart } from "../../react-shopper-hooks";
import { StatusButton } from "../button/StatusButton";
import { toast } from "react-toastify";
import {
  parsePDF,
  parseTextFile,
  itemsToText,
  validateItems,
  ParsedItem,
} from "../../lib/pdf-parser";

const BulkOrder = () => {
  const [textareaValue, setTextareaValue] = useState("");
  const [errors, setErrors] = useState<any[]>([]);
  const [isParsingPDF, setIsParsingPDF] = useState(false);
  const [pdfParseErrors, setPdfParseErrors] = useState<string[]>([]);
  const { useScopedAddBulkProductToCart } = useCart();
  const { mutate, isPending } = useScopedAddBulkProductToCart();

  const handleTextareaChange = (e: any) => {
    setTextareaValue(e.target.value);
  };

  const handleClearAll = () => {
    setTextareaValue("");
    setPdfParseErrors([]);
  };

  const handleCloseOverlay = () => {
    setErrors([]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const isPDF = file.type === "application/pdf";
    const isText = file.type === "text/plain" || file.name.endsWith(".txt");

    if (!isPDF && !isText) {
      toast.error("Please select a PDF or text file", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
      });
      return;
    }

    setIsParsingPDF(true);
    setPdfParseErrors([]);

    try {
      const result = isPDF ? await parsePDF(file) : await parseTextFile(file);

      if (result.errors.length > 0) {
        setPdfParseErrors(result.errors);
        toast.warning(`File parsed with ${result.errors.length} warnings`, {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
        });
      }

      if (result.items.length > 0) {
        // Validate the parsed items
        const validationErrors = validateItems(result.items);
        if (validationErrors.length > 0) {
          setPdfParseErrors((prev) => [...prev, ...validationErrors]);
        }

        // Convert to text format and update textarea
        const textFormat = itemsToText(result.items);
        setTextareaValue(textFormat);

        toast.success(
          `Successfully parsed ${result.items.length} items from ${isPDF ? "PDF" : "text file"}`,
          {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
          },
        );
      } else {
        toast.error(`No valid items found in the ${isPDF ? "PDF" : "file"}`, {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setPdfParseErrors([errorMessage]);
      toast.error(`Error parsing ${isPDF ? "PDF" : "file"}: ${errorMessage}`, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
      });
    } finally {
      setIsParsingPDF(false);
      // Reset the file input
      e.target.value = "";
    }
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

  const handleCSVUpload = (e: any) => {
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
            htmlFor="csv-file-upload"
            className="flex items-center text-brand-primary cursor-pointer hover:text-brand-secondary"
          >
            <ArrowUpOnSquareIcon className="h-5 w-5 mr-2" />
            Import CSV File
          </label>
          <input
            id="csv-file-upload"
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className="flex items-center text-brand-primary cursor-pointer hover:text-brand-secondary"
          >
            <DocumentIcon className="h-5 w-5 mr-2" />
            {isParsingPDF ? "Parsing File..." : "Import PDF/TXT File"}
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileUpload}
            disabled={isParsingPDF}
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
      {pdfParseErrors.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">
            PDF Parsing Warnings:
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {pdfParseErrors.map((error, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
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
