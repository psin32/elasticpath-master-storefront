import { NextRequest, NextResponse } from "next/server";
import { getServerSideCredentialsClient } from "../../../../../lib/epcc-server-side-credentials-client";

export async function GET(
  _request: NextRequest,
  { params }: { params: { hierarchyId: string } },
) {
  const { hierarchyId } = params;

  if (!hierarchyId) {
    return NextResponse.json({ data: [] });
  }

  try {
    const client = getServerSideCredentialsClient();
    const response = await (client as any).request.send(
      `/hierarchies/${hierarchyId}/nodes?page[limit]=100`,
      "GET",
      undefined,
      undefined,
      client,
      false,
      "pcm",
    );

    const nodes = (response?.data ?? []).map((n: any) => ({
      id: n.id,
      name: n.attributes?.name ?? n.id,
    }));

    return NextResponse.json({ data: nodes });
  } catch (err) {
    console.error("Nodes fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch nodes" },
      { status: 500 },
    );
  }
}
