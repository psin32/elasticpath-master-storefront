import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { question, productContext } = await req.json();

    if (!question || !productContext) {
      return NextResponse.json(
        { error: "Missing question or product context" },
        { status: 400 },
      );
    }

    const result = streamText({
      model: openai("gpt-3.5-turbo"),
      messages: [
        {
          role: "system",
          content:
            "You are sMartie, a helpful product assistant. Answer questions about the product based on the provided context. Keep responses concise and friendly.",
        },
        {
          role: "user",
          content: `Product context: ${productContext}\n\nQuestion: ${question}`,
        },
      ],
      maxTokens: 150,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("SmartieAPI Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
