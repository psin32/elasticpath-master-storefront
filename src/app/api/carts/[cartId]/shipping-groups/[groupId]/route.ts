import { NextRequest, NextResponse } from "next/server";
import { getServerSideCredentialsClientWihoutAccountToken } from "../../../../../../lib/epcc-server-side-credentials-client";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { cartId: string; groupId: string } },
) {
  try {
    const client = getServerSideCredentialsClientWihoutAccountToken();

    const response = await client.request.send(
      `carts/${params.cartId}/shipping-groups/${params.groupId}`,
      "DELETE",
      null,
      undefined,
      client,
      undefined,
      "v2",
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error deleting shipping group:", error, request);
    return NextResponse.json(
      { error: "Failed to delete shipping group" },
      { status: 500 },
    );
  }
}
