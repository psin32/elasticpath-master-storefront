import { NextRequest, NextResponse } from "next/server";
import { getShippingDataByCurrency } from "../../../../services/custom-api";

// Mock shipping details - fallback when API doesn't return data
const mockShippingDetails = {
  standard: {
    shipping_method: "Standard Delivery",
    shipping_cost: 0,
    shipping_message: "Free standard shipping (3-5 business days)",
    delivery_estimate: {
      start: "3",
      end: "5",
      unit: "business days",
    },
  },
  express: {
    shipping_method: "Express Delivery",
    shipping_cost: 1200, // $12.00 in cents
    shipping_message: "Express shipping (1-2 business days)",
    delivery_estimate: {
      start: "1",
      end: "2",
      unit: "business days",
    },
  },
  overnight: {
    shipping_method: "Overnight Delivery",
    shipping_cost: 2500, // $25.00 in cents
    shipping_message: "Overnight shipping (next business day)",
    delivery_estimate: {
      start: "1",
      end: "1",
      unit: "business day",
    },
  },
  economy: {
    shipping_method: "Economy Delivery",
    shipping_cost: 500, // $5.00 in cents
    shipping_message: "Economy shipping (5-7 business days)",
    delivery_estimate: {
      start: "5",
      end: "7",
      unit: "business days",
    },
  },
};

export async function GET(request: NextRequest) {
  try {
    // Try to fetch shipping data from Custom API
    const apiResponse = await getShippingDataByCurrency();
    let shippingDetails = apiResponse.success ? apiResponse.data : null;

    // If no data from API, fall back to mock data
    if (!shippingDetails) {
      shippingDetails = mockShippingDetails;
    }

    return NextResponse.json({
      success: true,
      data: shippingDetails,
      source: apiResponse.success ? "api" : "mock",
    });
  } catch (error) {
    console.error("Error fetching shipping details:", error, request);
    return NextResponse.json(
      { error: "Failed to fetch shipping details" },
      { status: 500 },
    );
  }
}

// POST method for more complex shipping calculations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shippingType, address, items, cartId } = body;

    // Try to fetch shipping data from Custom API
    const apiResponse = await getShippingDataByCurrency();
    let shippingDetails = apiResponse.success ? apiResponse.data : null;

    // If no data from API, fall back to mock data
    if (!shippingDetails) {
      shippingDetails = mockShippingDetails;
    }

    // Return specific shipping type details
    const specificShippingDetails =
      shippingDetails[shippingType as keyof typeof shippingDetails];

    if (!specificShippingDetails) {
      return NextResponse.json(
        { error: "Invalid shipping type" },
        { status: 400 },
      );
    }

    // You could add additional logic here for:
    // - Address validation
    // - Weight-based calculations
    // - Distance-based calculations
    // - Special handling for certain items

    return NextResponse.json({
      success: true,
      data: specificShippingDetails,
      source: apiResponse.success ? "api" : "mock",
    });
  } catch (error) {
    console.error("Error calculating shipping details:", error);
    return NextResponse.json(
      { error: "Failed to calculate shipping details" },
      { status: 500 },
    );
  }
}
