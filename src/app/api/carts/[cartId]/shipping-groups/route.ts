import { NextRequest, NextResponse } from "next/server";
import { getServerSideCredentialsClientWihoutAccountToken } from "../../../../../lib/epcc-server-side-credentials-client";

export async function POST(
  request: NextRequest,
  { params }: { params: { cartId: string } },
) {
  try {
    const client = getServerSideCredentialsClientWihoutAccountToken();
    const body = await request.json();

    const response = await client.request.send(
      `carts/${params.cartId}/shipping-groups`,
      "POST",
      body,
      undefined,
      client,
      undefined,
      "v2",
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating shipping group:", error);
    return NextResponse.json(
      { error: "Failed to create shipping group" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { cartId: string } },
) {
  try {
    const client = getServerSideCredentialsClientWihoutAccountToken();
    const response = await client.request.send(
      `carts/${params.cartId}/shipping-groups`,
      "GET",
      undefined,
      undefined,
      client,
      undefined,
      "v2",
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching shipping groups:", error, request);
    return NextResponse.json(
      { error: "Failed to fetch shipping groups" },
      { status: 500 },
    );
  }
}
