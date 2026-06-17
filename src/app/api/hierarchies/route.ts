import { NextResponse } from "next/server";
import { getServerSideCredentialsClient } from "../../../lib/epcc-server-side-credentials-client";

export async function GET() {
  try {
    const client = getServerSideCredentialsClient();
    const response = await (client as any).request.send(
      `/hierarchies?page[limit]=100`,
      "GET",
      undefined,
      undefined,
      client,
      false,
      "pcm",
    );

    const hierarchies = (response?.data ?? []).map((h: any) => ({
      id: h.id,
      name: h.attributes?.name ?? h.id,
    }));

    return NextResponse.json({ data: hierarchies });
  } catch (err) {
    console.error("Hierarchies fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch hierarchies" },
      { status: 500 },
    );
  }
}
