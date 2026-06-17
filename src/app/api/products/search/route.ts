import { NextRequest, NextResponse } from "next/server";
import { getServerSideCredentialsClient } from "../../../../lib/epcc-server-side-credentials-client";

type SearchField = "name" | "sku" | "slug";

function buildFilter(field: SearchField, value: string): string {
  // sku uses exact match; name and slug use wildcard partial match
  if (field === "sku") {
    return `eq(sku,${value})`;
  }
  return `like(${field},*${value}*)`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("name")?.trim();
  const rawField = searchParams.get("field")?.trim() ?? "name";
  const field: SearchField = ["name", "sku", "slug"].includes(rawField)
    ? (rawField as SearchField)
    : "name";

  if (!query) {
    return NextResponse.json({ data: [] });
  }

  try {
    const client = getServerSideCredentialsClient();
    const sanitized = query.replace(/[*()]/g, "");
    const filter = buildFilter(field, sanitized);

    const response = await (client as any).request.send(
      `/products?filter=${filter}&page[limit]=20`,
      "GET",
      undefined,
      undefined,
      client,
      false,
      "pcm",
    );

    const products = (response?.data ?? []).map((p: any) => ({
      id: p.id,
      name: p.attributes?.name ?? p.id,
    }));

    return NextResponse.json({ data: products });
  } catch (err) {
    console.error("Product search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
