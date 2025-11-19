import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import os from "os";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { file, filename } = await req.json();

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 },
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Save uploaded file temporarily to disk
    const buffer = Buffer.from(file, "base64");
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `pdf_${Date.now()}.pdf`);
    fs.writeFileSync(tempFilePath, new Uint8Array(buffer));

    // 1) Upload the PDF file to OpenAI
    const uploadedFile = await openai.files.create({
      file: fs.createReadStream(tempFilePath),
      purpose: "user_data",
    });

    // 2) Use the Responses API with structured outputs
    const response = await openai.responses.create({
      model: "gpt-4o",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Read the attached purchase order PDF. " +
                "Extract every line item as {sku, quantity}. " +
                "Ignore headers/footers/notes. " +
                "Return ONLY what's in the schema.",
            },
            {
              type: "input_file",
              file_id: uploadedFile.id,
            },
          ],
        },
      ],
    });

    // Extract the parsed JSON from the response
    let allItems: Array<{ sku: string; quantity: number }> = [];

    // Check if we got output_text type
    const outputItem = response.output?.[0];
    const outputText =
      outputItem && "content" in outputItem ? outputItem.content?.[0] : null;

    if (outputText && (outputText as any).type === "output_text") {
      const text = (outputText as any).text;

      // Try to extract JSON from markdown code blocks first
      const jsonMatch =
        text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          const parsed = JSON.parse(jsonStr);

          // Handle both direct array and wrapped in items
          if (Array.isArray(parsed)) {
            allItems = parsed;
          } else if (parsed.items && Array.isArray(parsed.items)) {
            allItems = parsed.items;
          } else {
            console.error("Unexpected JSON structure:", parsed);
          }
        } catch (parseError) {
          console.error("Error parsing JSON:", parseError);
        }
      } else {
        // Handle plain text format: {sku: "...", quantity: ...}
        // Split by newlines and parse each line
        try {
          const lines = text.split("\n").filter((line: string) => line.trim());
          const parsedItems: Array<{ sku: string; quantity: number }> = [];

          for (const line of lines) {
            // Match pattern like: {sku: "WM-1023", quantity: 25}
            const match = line.match(
              /sku:\s*"([^"]+)"|sku:\s*(\S+).*quantity:\s*(\d+)/,
            );
            if (match) {
              const sku = match[1] || match[2];
              const quantityMatch = line.match(/quantity:\s*(\d+)/);
              const quantity = quantityMatch
                ? parseInt(quantityMatch[1], 10)
                : 0;

              if (sku && quantity > 0) {
                parsedItems.push({ sku, quantity });
              }
            }
          }

          if (parsedItems.length > 0) {
            allItems = parsedItems;
          }
        } catch (parseError) {
          console.error("Error parsing plain text format:", parseError);
        }
      }
    } else if (outputText && (outputText as any).type === "output_json") {
      // Handle structured JSON output
      allItems = (outputText as any).parsed.items;
    }

    // Clean up temp file
    fs.unlinkSync(tempFilePath);

    return NextResponse.json({
      items: allItems,
      errors: allItems.length === 0 ? ["No items found in PDF"] : [],
    });
  } catch (error) {
    // Try to clean up temp file if it exists
    const tempFilePath = path.join(os.tmpdir(), `pdf_${Date.now()}.pdf`);
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        items: [],
        errors: [error instanceof Error ? error.message : "Unknown error"],
      },
      { status: 500 },
    );
  }
}
