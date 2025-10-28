export interface ParsedItem {
  sku: string;
  quantity: number;
}

export type ParsedRow = { productName: string; sku: string; quantity: number };

const HEADER_MATCH = /Product Name/i;
const SKU_MATCH = /\bSKU\b/i;
const QTY_MATCH = /Quantity/i;
const STOP_SECTION = /^Notes?:/i;

// SKU: letters/digits/dashes (tweak if your format differs)
const ROW_REGEX = /(.+?)\s+([A-Z0-9-]+)\s+(\d+)\s*$/i;

function normalizeLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * Extracts Product rows (Product Name, SKU, Quantity) from raw PDF text.
 * Returns both full rows and (optionally) a simplified {sku, quantity} array.
 */
function extractRowsFromText(text: string): ParsedRow[] {
  const lines = normalizeLines(text);

  const headerIdx = lines.findIndex(
    (l) => HEADER_MATCH.test(l) && SKU_MATCH.test(l) && QTY_MATCH.test(l),
  );
  if (headerIdx === -1) {
    throw new Error(
      "Could not locate table header (expected 'Product Name', 'SKU', 'Quantity').",
    );
  }

  const rows: ParsedRow[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];

    if (STOP_SECTION.test(line)) break;

    const m = line.match(ROW_REGEX);
    if (m) {
      const productName = m[1].trim();
      const sku = m[2].trim().toUpperCase();
      const quantity = parseInt(m[3], 10);
      if (!Number.isNaN(quantity)) {
        rows.push({ productName, sku, quantity });
      }
    }
  }
  return rows;
}

export interface ParseResult {
  items: ParsedItem[];
  errors: string[];
  rawText: string;
}

/**
 * Parse PDF file and extract SKU and quantity pairs
 * Uses pdf-parse library to extract text, then looks for table headers
 * and extracts rows with Product Name, SKU, and Quantity
 * @param file - The PDF file to parse
 * @returns Promise<ParseResult> - Parsed items and any errors
 */
export async function parsePDF(file: File): Promise<ParseResult> {
  const items: ParsedItem[] = [];
  const errors: string[] = [];
  let rawText = "";

  try {
    // Convert file to Uint8Array for PDF.js
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Use PDF.js for text extraction (browser-compatible)
    const pdfjsLib = await import("pdfjs-dist");

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdfDocument = await loadingTask.promise;

    // Extract text from all pages
    let fullText = "";
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    rawText = fullText;

    // Use the table extraction logic
    try {
      const rows = extractRowsFromText(rawText);

      // Convert to ParsedItem format
      items.push(
        ...rows.map((row) => ({ sku: row.sku, quantity: row.quantity })),
      );

      if (items.length === 0) {
        errors.push(
          "No valid SKU and quantity pairs found in the PDF. Make sure the PDF has a table with 'Product Name', 'SKU', and 'Quantity' columns.",
        );
      }
    } catch (extractError) {
      // If table extraction fails, provide helpful error message
      errors.push(
        extractError instanceof Error
          ? extractError.message
          : "Error extracting table data from PDF",
      );

      // Also try basic fallback patterns in case the header is different
      const lines = normalizeLines(rawText);
      for (const line of lines) {
        const m = line.match(ROW_REGEX);
        if (m) {
          const sku = m[2].trim().toUpperCase();
          const quantity = parseInt(m[3], 10);
          if (!Number.isNaN(quantity) && quantity > 0) {
            items.push({ sku, quantity });
          }
        }
      }
    }
  } catch (error) {
    errors.push(
      `Error parsing PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  return {
    items,
    errors,
    rawText: rawText || "",
  };
}

/**
 * Parse PDF using OpenAI - sends to API route for processing
 * @param file - The PDF file to parse
 * @returns Promise<ParseResult> - Parsed items and any errors
 */
export async function parsePDFWithOpenAI(file: File): Promise<ParseResult> {
  const items: ParsedItem[] = [];
  const errors: string[] = [];
  let rawText = "";

  try {
    // Convert file to base64 for API
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Content = result.split(",")[1];
        resolve(base64Content);
      };
      reader.onerror = (error) => reject(error);
    });

    // Send to server-side API route
    const response = await fetch("/api/parse-pdf-openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file: base64,
        filename: file.name,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      if (
        response.status === 401 ||
        result.errors?.some((e: string) => e.includes("API key"))
      ) {
        errors.push(
          "Invalid OpenAI API key. Please check your API key configuration.",
        );
      } else {
        errors.push(result.error || `API error: ${response.statusText}`);
      }
      return { items, errors, rawText: "" };
    }

    if (result.items && Array.isArray(result.items)) {
      items.push(...result.items);
      rawText = JSON.stringify(result.items, null, 2);
    }

    if (result.errors && Array.isArray(result.errors)) {
      errors.push(...result.errors);
    }

    if (items.length === 0 && errors.length === 0) {
      errors.push("No SKU and quantity pairs found in the PDF");
    }
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }

  return {
    items,
    errors,
    rawText,
  };
}

/**
 * Extract SKU and quantity from complex patterns
 * @param line - The line to parse
 * @returns ParsedItem | null
 */
function extractFromComplexPattern(line: string): ParsedItem | null {
  // Look for patterns like "Product: ABC123 Qty: 5" or "Item ABC123 - 10 units"
  const complexPatterns = [
    /(?:product|item|sku|code)\s*:?\s*([A-Za-z0-9\-_]+).*?(?:qty|quantity|units?)\s*:?\s*(\d+)/i,
    /([A-Za-z0-9\-_]+).*?(?:qty|quantity|units?)\s*:?\s*(\d+)/i,
    /([A-Za-z0-9\-_]+).*?(\d+)\s*(?:units?|pcs?|pieces?)/i,
  ];

  for (const pattern of complexPatterns) {
    const match = line.match(pattern);
    if (match) {
      const sku = match[1].trim();
      const quantity = parseInt(match[2].trim(), 10);

      if (sku && !isNaN(quantity) && quantity > 0) {
        return { sku, quantity };
      }
    }
  }

  return null;
}

/**
 * Convert parsed items to text format for textarea
 * @param items - Array of parsed items
 * @returns string - Formatted text for textarea
 */
export function itemsToText(items: ParsedItem[]): string {
  return items.map((item) => `${item.sku},${item.quantity}`).join("\n");
}

/**
 * Validate parsed items
 * @param items - Array of parsed items
 * @returns string[] - Array of validation errors
 */
export function validateItems(items: ParsedItem[]): string[] {
  const errors: string[] = [];
  const seenSkus = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (!item.sku || item.sku.trim().length === 0) {
      errors.push(`Item ${i + 1}: SKU is required`);
    }

    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${i + 1}: Quantity must be greater than 0`);
    }

    if (seenSkus.has(item.sku)) {
      errors.push(`Item ${i + 1}: Duplicate SKU "${item.sku}"`);
    } else {
      seenSkus.add(item.sku);
    }
  }

  return errors;
}

/**
 * Parse text file and extract SKU and quantity pairs
 * Alternative to PDF parsing for better compatibility
 * @param file - The text file to parse
 * @returns Promise<ParseResult> - Parsed items and any errors
 */
export async function parseTextFile(file: File): Promise<ParseResult> {
  const items: ParsedItem[] = [];
  const errors: string[] = [];
  let rawText = "";

  try {
    // Read file as text
    rawText = await file.text();

    // Split text into lines and process each line
    const lines = rawText
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip empty lines
      if (!line) continue;

      // Try different patterns to extract SKU and quantity
      const patterns = [
        // Pattern 1: SKU, quantity (comma separated)
        /^([A-Za-z0-9\-_]+)\s*,\s*(\d+)$/,
        // Pattern 2: SKU quantity (space separated)
        /^([A-Za-z0-9\-_]+)\s+(\d+)$/,
        // Pattern 3: SKU: quantity (colon separated)
        /^([A-Za-z0-9\-_]+)\s*:\s*(\d+)$/,
        // Pattern 4: SKU\tquantity (tab separated)
        /^([A-Za-z0-9\-_]+)\s*\t\s*(\d+)$/,
        // Pattern 5: More flexible pattern for various formats
        /^([A-Za-z0-9\-_]{3,})\s*[,\s:]\s*(\d+)$/,
        // Pattern 6: Table format - SKU, quantity | additional text
        /^([A-Za-z0-9\-_]+)\s*,\s*(\d+)\s*\|/,
        // Pattern 7: Table format - SKU quantity | additional text
        /^([A-Za-z0-9\-_]+)\s+(\d+)\s*\|/,
        // Pattern 8: Table format - SKU: quantity | additional text
        /^([A-Za-z0-9\-_]+)\s*:\s*(\d+)\s*\|/,
      ];

      let match = null;
      for (const pattern of patterns) {
        match = line.match(pattern);
        if (match) break;
      }

      if (match) {
        const sku = match[1].trim();
        const quantity = parseInt(match[2].trim(), 10);

        if (sku && !isNaN(quantity) && quantity > 0) {
          items.push({ sku, quantity });
        } else {
          errors.push(`Line ${i + 1}: Invalid SKU or quantity - "${line}"`);
        }
      } else {
        // Try to extract SKU and quantity from more complex patterns
        const complexMatch = extractFromComplexPattern(line);
        if (complexMatch) {
          items.push(complexMatch);
        } else {
          // Only add as error if line looks like it might contain SKU/quantity data
          if (
            line.length > 2 &&
            (line.includes(",") || line.includes(":") || /\d/.test(line))
          ) {
            errors.push(`Line ${i + 1}: Could not parse - "${line}"`);
          }
        }
      }
    }

    if (items.length === 0) {
      errors.push("No valid SKU and quantity pairs found in the file");
    }
  } catch (error) {
    errors.push(
      `Error parsing file: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  return {
    items,
    errors,
    rawText: rawText || "",
  };
}
