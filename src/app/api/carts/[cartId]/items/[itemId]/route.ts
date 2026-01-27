import { NextRequest, NextResponse } from "next/server";
import { getEpccImplicitClient } from "../../../../../../lib/epcc-implicit-client";
import { getServerSideCredentialsClientWihoutAccountToken } from "../../../../../../lib/epcc-server-side-credentials-client";

export async function PUT(
  request: NextRequest,
  { params }: { params: { cartId: string; itemId: string } },
) {
  try {
    const client = getServerSideCredentialsClientWihoutAccountToken();
    const body = await request.json();

    const response = await client.request.send(
      `carts/${params.cartId}/items/${params.itemId}`,
      "PUT",
      body,
      undefined,
      client,
      undefined,
      "v2",
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating cart item:", error);
    return NextResponse.json(
      { error: "Failed to update cart item" },
      { status: 500 },
    );
  }
}
