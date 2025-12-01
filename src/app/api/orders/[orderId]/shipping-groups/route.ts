import { NextRequest, NextResponse } from "next/server";
import { getServerSideCredentialsClientWihoutAccountToken } from "../../../../../lib/epcc-server-side-credentials-client";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } },
) {
  try {
    const client = getServerSideCredentialsClientWihoutAccountToken();
    const response = await client.request.send(
      `orders/${params.orderId}/shipping-groups`,
      "GET",
      undefined,
      undefined,
      client,
      undefined,
      "v2",
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching order shipping groups:", error, request);
    return NextResponse.json(
      { error: "Failed to fetch order shipping groups" },
      { status: 500 },
    );
  }
}
