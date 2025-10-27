import { cookies } from "next/headers";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../../lib/cookie-constants";
import { redirect } from "next/navigation";
import { getServerSideImplicitClient } from "../../../../lib/epcc-server-side-implicit-client";
import { Order, OrderItem } from "@elasticpath/js-sdk";
import { PurchaseAnalytics } from "./PurchaseAnalytics";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const cookieStore = cookies();

  const {
    retrieveAccountMemberCredentials,
  } = require("../../../../lib/retrieve-account-member-credentials");

  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookieStore,
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  if (!accountMemberCookie) {
    return redirect("/login");
  }

  const client = getServerSideImplicitClient();

  // Fetch at least 500 orders in a loop
  const allOrders: Order[] = [];
  const allIncludedItems: Map<string, OrderItem> = new Map();
  let offset = 0;
  const limit = 100;
  const targetOrders = 500;

  while (allOrders.length < targetOrders) {
    const result = await client.Orders.With("items")
      .Limit(limit)
      .Offset(offset)
      .All();

    if (result.data.length === 0) {
      break; // No more orders
    }

    // Collect orders
    allOrders.push(...result.data);

    // Collect items from included data
    if (result.included && "items" in result.included) {
      const items = (result.included as any).items as OrderItem[];
      items.forEach((item: OrderItem) => {
        allIncludedItems.set(item.id, item);
      });
    }

    // Check if we've fetched enough
    if (result.data.length < limit) {
      break; // Last page reached
    }

    offset += limit;

    // Safety break to prevent infinite loops
    if (offset > 10000) {
      break;
    }
  }

  // Create included object structure for resolveShopperOrder
  const included = {
    items: Array.from(allIncludedItems.values()),
  };

  const mappedOrders = resolveShopperOrder(allOrders, included);

  return (
    <div className="flex flex-col gap-8 items-start w-full min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Purchase Analytics
          </h1>
          <p className="text-gray-600">
            Analyze your purchase trends over time
          </p>
        </div>

        {/* Analytics Component */}
        <PurchaseAnalytics ordersData={mappedOrders} />
      </div>
    </div>
  );
}

function resolveOrderItemsFromRelationship(
  itemRelationships: any[],
  itemMap: Record<string, OrderItem>,
): OrderItem[] {
  return itemRelationships
    .filter((itemRel) => itemRel.type === "item")
    .reduce((orderItems, itemRel) => {
      const includedItem: OrderItem | undefined = itemMap[itemRel.id];
      return [...orderItems, ...(includedItem && [includedItem])];
    }, [] as OrderItem[]);
}

function resolveShopperOrder(
  data: Order[],
  included: { items: OrderItem[] },
): { raw: Order; items: OrderItem[] }[] {
  const itemMap = included.items.reduce(
    (acc: Record<string, OrderItem>, item: OrderItem) => {
      return { ...acc, [item.id]: item };
    },
    {} as Record<string, OrderItem>,
  );

  return data.map((order) => {
    const orderItems = order.relationships?.items?.data
      ? resolveOrderItemsFromRelationship(
          order.relationships.items.data,
          itemMap,
        )
      : [];

    return {
      raw: order,
      items: orderItems,
    };
  });
}
