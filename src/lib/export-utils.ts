import { ProductResponse } from "@elasticpath/js-sdk";

export interface ProductInventoryData {
  product: ProductResponse;
  inventories: Record<string, number>;
}

export interface LocationData {
  id: string;
  name: string;
  slug: string;
}

// Generate CSV export
export function generateCSV(
  products: ProductInventoryData[],
  locations: LocationData[],
): string {
  const headers = [
    "Product Name",
    "SKU",
    "Price",
    ...locations.map((loc) => `${loc.name} Inventory`),
    "Export Time",
  ];

  const timestamp = new Date().toISOString();

  const rows = products.map((item) => {
    const { product, inventories } = item;
    const price =
      product.meta?.display_price?.without_tax?.formatted ||
      product.meta?.display_price?.with_tax?.formatted ||
      "N/A";

    return [
      `"${product.attributes.name}"`,
      product.attributes.sku || "N/A",
      price,
      ...locations.map((loc) => {
        const inventory = inventories[loc.slug];
        return inventory !== undefined ? inventory : "N/A";
      }),
      timestamp,
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

// Generate PDF export (returns HTML that can be converted to PDF)
export function generatePDFHTML(
  products: ProductInventoryData[],
  locations: LocationData[],
): string {
  const timestamp = new Date().toLocaleString();

  const locationHeaders = locations
    .map(
      (loc) => `<th class="border border-gray-300 px-4 py-2">${loc.name}</th>`,
    )
    .join("");

  const productRows = products
    .map((item) => {
      const { product, inventories } = item;
      const price =
        product.meta?.display_price?.without_tax?.formatted ||
        product.meta?.display_price?.with_tax?.formatted ||
        "N/A";

      const inventoryCells = locations
        .map((loc) => {
          const inventory = inventories[loc.slug];
          const value = inventory !== undefined ? inventory : "N/A";
          const cellClass =
            inventory === undefined || inventory === 0
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700";
          return `<td class="border border-gray-300 px-4 py-2 ${cellClass} font-semibold">${value}</td>`;
        })
        .join("");

      return `
        <tr>
          <td class="border border-gray-300 px-4 py-2">${product.attributes.name}</td>
          <td class="border border-gray-300 px-4 py-2">${product.attributes.sku || "N/A"}</td>
          <td class="border border-gray-300 px-4 py-2 font-semibold">${price}</td>
          ${inventoryCells}
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Product Inventory Export</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          .header {
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0 0 10px 0;
            color: #1f2937;
          }
          .header p {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background-color: #f3f4f6;
            font-weight: 600;
            text-align: left;
            padding: 12px 16px;
            border: 1px solid #d1d5db;
          }
          td {
            padding: 12px 16px;
            border: 1px solid #d1d5db;
          }
          .bg-red-50 {
            background-color: #fef2f2;
          }
          .text-red-700 {
            color: #b91c1c;
          }
          .bg-green-50 {
            background-color: #f0fdf4;
          }
          .text-green-700 {
            color: #15803d;
          }
          .font-semibold {
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Product Inventory Report</h1>
          <p><strong>Export Time:</strong> ${timestamp}</p>
          <p><strong>Total Products:</strong> ${products.length}</p>
        </div>
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
            ${productRows}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

// Download CSV file
export function downloadCSV(
  csvContent: string,
  filename: string = "products-export.csv",
) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Download PDF file (by opening HTML in new window and printing)
export function downloadPDF(htmlContent: string) {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
