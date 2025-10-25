export interface ParsedItem {
  sku: string;
  quantity: number;
}

/**
 * Simple PDF text extraction for our test PDFs
 * This is a basic implementation that extracts text from PDFs we generated
 * @param buffer - PDF file buffer
 * @returns string - Extracted text
 */
function extractTextFromPDF(buffer: Buffer): string {
  try {
    // Convert buffer to string and look for text content
    const pdfString = buffer.toString("utf8");

    // Look for text content in the PDF stream
    // This is a simplified approach for our test PDFs
    const textMatches = pdfString.match(/\(([^)]+)\)/g);

    if (textMatches) {
      // Extract text from PDF string literals
      const extractedText = textMatches
        .map((match) => match.slice(1, -1)) // Remove parentheses
        .join("\n") // Join with newlines to preserve line structure
        .replace(/\\n/g, "\n") // Convert \n to actual newlines
        .replace(/\\t/g, "\t") // Convert \t to actual tabs
        .replace(/\\r/g, "\r"); // Convert \r to actual carriage returns

      return extractedText;
    }

    // Fallback: try to extract readable text from the PDF
    const readableText = pdfString
      .replace(/[^\x20-\x7E\n\r\t]/g, "") // Keep only printable ASCII and whitespace
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    return readableText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    return "";
  }
}

export interface ParseResult {
  items: ParsedItem[];
  errors: string[];
  rawText: string;
}

/**
 * Parse PDF file and extract SKU and quantity pairs
 * Note: This is a simplified implementation that works with our test PDFs
 * For production use, consider using a proper PDF parsing library
 * @param file - The PDF file to parse
 * @returns Promise<ParseResult> - Parsed items and any errors
 */
export async function parsePDF(file: File): Promise<ParseResult> {
  const items: ParsedItem[] = [];
  const errors: string[] = [];
  let rawText = "";

  try {
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Simple PDF text extraction for our test PDFs
    // This is a basic implementation that works with the PDFs we generated
    rawText = extractTextFromPDF(buffer);

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
      errors.push("No valid SKU and quantity pairs found in the PDF");
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
