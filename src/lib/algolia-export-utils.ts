import { SearchHit } from "../components/search/SearchHit";
import { ProductResponse } from "@elasticpath/js-sdk";

export interface AlgoliaProductData {
  product: ProductResponse;
  hit: SearchHit;
  inventories: Record<string, number>;
}

export interface AlgoliaLocationData {
  slug: string;
  name: string;
}

// Helper function to format file sizes
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Extract inventory data from Algolia hit _qty fields
export function extractInventoryFromHit(
  hit: SearchHit,
): Record<string, number> {
  const inventories: Record<string, number> = {};

  // Look for _qty fields in the hit object
  Object.keys(hit).forEach((key) => {
    if (key.endsWith("_qty") && !key.startsWith("replenish")) {
      // Extract location slug from field name (e.g., '_qty_warehouse-1' -> 'warehouse-1')
      const locationSlug = key.replace("_qty", "");
      const quantity = hit[key];

      // Only include if it's a valid number
      if (typeof quantity === "number" && !isNaN(quantity)) {
        inventories[locationSlug] = quantity;
      }
    }
  });

  return inventories;
}

// Generate CSV content from Algolia data
export function generateAlgoliaCSV(
  productData: AlgoliaProductData[],
  locationData: AlgoliaLocationData[],
): string {
  const timestamp = new Date().toLocaleString();

  // Create header row
  const headers = [
    "Product Name",
    "SKU",
    "Price",
    ...locationData.map((loc) => loc.name),
    "Export Time",
  ];

  // Create data rows
  const rows = productData.map(({ product, hit, inventories }) => {
    const price =
      product.meta?.display_price?.without_tax?.formatted ||
      product.meta?.display_price?.with_tax?.formatted ||
      "N/A";

    const locationValues = locationData.map((loc) => {
      const inventory = inventories[loc.slug];
      return inventory !== undefined ? inventory.toString() : "0";
    });

    return [
      `"${product.attributes?.name || hit.ep_name || "N/A"}"`,
      `"${product.attributes?.sku || hit.ep_sku || "N/A"}"`,
      `"${price}"`,
      ...locationValues,
      `"${timestamp}"`,
    ];
  });

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

// Generate PDF HTML content from Algolia data
export function generateAlgoliaPDFHTML(
  productData: AlgoliaProductData[],
  locationData: AlgoliaLocationData[],
): string {
  const timestamp = new Date().toLocaleString();

  const locationHeaders = locationData
    .map(
      (loc) => `<th class="border border-gray-300 px-4 py-2">${loc.name}</th>`,
    )
    .join("");

  const rows = productData
    .map(({ product, hit, inventories }) => {
      const productName = product.attributes?.name || hit.ep_name || "N/A";
      const sku = product.attributes?.sku || hit.ep_sku || "N/A";
      const price =
        product.meta?.display_price?.without_tax?.formatted ||
        product.meta?.display_price?.with_tax?.formatted ||
        "N/A";

      const locationCells = locationData
        .map((loc) => {
          const inventory = inventories[loc.slug];
          const quantity = inventory !== undefined ? inventory : 0;
          const cellClass = quantity > 0 ? "text-green-600" : "text-red-600";

          return `<td class="border border-gray-300 px-4 py-2 text-center ${cellClass} font-semibold">${quantity}</td>`;
        })
        .join("");

      return `
      <tr>
        <td class="border border-gray-300 px-4 py-2 font-medium">${productName}</td>
        <td class="border border-gray-300 px-4 py-2">${sku}</td>
        <td class="border border-gray-300 px-4 py-2">${price}</td>
        ${locationCells}
      </tr>
    `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Product Inventory Export</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f9fafb;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 0;
          opacity: 0.9;
          font-size: 14px;
        }
        .content {
          padding: 24px;
        }
        .table-container {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }
        th {
          background: #f8fafc;
          font-weight: 600;
          text-align: left;
          color: #374151;
        }
        th.text-center {
          text-align: center;
        }
        td {
          color: #6b7280;
        }
        .summary {
          margin-top: 24px;
          padding: 16px;
          background: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 8px;
        }
        .summary h3 {
          margin: 0 0 8px 0;
          color: #0369a1;
          font-size: 16px;
        }
        .summary p {
          margin: 4px 0;
          color: #075985;
          font-size: 14px;
        }
        @media print {
          body { background: white; }
          .container { box-shadow: none; }
          .header { background: #667eea !important; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Product Inventory Report</h1>
          <p>Generated on ${timestamp}</p>
        </div>
        <div class="content">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th class="border border-gray-300 px-4 py-2">Product Name</th>
                  <th class="border border-gray-300 px-4 py-2">SKU</th>
                  <th class="border border-gray-300 px-4 py-2">Price</th>
                  ${locationHeaders}
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
          <div class="summary">
            <h3>Export Summary</h3>
            <p><strong>Total Products:</strong> ${productData.length}</p>
            <p><strong>Locations:</strong> ${locationData.length}</p>
            <p><strong>Export Time:</strong> ${timestamp}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Download CSV file
export function downloadAlgoliaCSV(
  csvContent: string,
  filename: string = "algolia-products-export.csv",
) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Download PDF file
export function downloadAlgoliaPDF(htmlContent: string) {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
}
