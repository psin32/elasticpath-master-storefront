import { cookies } from "next/headers";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../../lib/cookie-constants";
import { redirect } from "next/navigation";
import { getServerSideImplicitClient } from "../../../../lib/epcc-server-side-implicit-client";
import {
  Order,
  OrderItem,
  RelationshipToMany,
  ResourcePage,
} from "@elasticpath/js-sdk";
import {
  getSelectedAccount,
  retrieveAccountMemberCredentials,
} from "../../../../lib/retrieve-account-member-credentials";
import { ResourcePagination } from "../../../../components/pagination/ResourcePagination";
import { DEFAULT_PAGINATION_LIMIT } from "../../../../lib/constants";
import { OrderItemWithDetails } from "./OrderItemWithDetails";

export const dynamic = "force-dynamic";

export default async function Orders({
  searchParams,
}: {
  searchParams?: {
    limit?: string;
    offset?: string;
    page?: string;
    tab?: string;
  };
}) {
  const currentPage = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || DEFAULT_PAGINATION_LIMIT;
  const offset = Number(searchParams?.offset) || 0;
  const activeTab = searchParams?.tab || "history";

  const cookieStore = cookies();

  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookieStore,
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  if (!accountMemberCookie) {
    return redirect("/login");
  }

  const selectedAccount = getSelectedAccount(accountMemberCookie);

  const client = getServerSideImplicitClient();

  // Fetch all orders for the account
  const result: Awaited<ReturnType<typeof client.Orders.All>> =
    await client.Orders.With("items").Limit(limit).Offset(offset).All();

  const mappedOrders = result.included
    ? resolveShopperOrder(result.data, result.included)
    : [];

  // Fetch current account member to get their role
  const accountMember = await client.AccountMembers.Get(
    accountMemberCookie.accountMemberId,
  );
  // member_role is a custom field, likely in extensions
  const memberRole = (accountMember.data as any)?.member_role;

  // Approval Queue filter
  const approvalOrders = mappedOrders.filter(({ raw: order }) => {
    const approvalTriggered = (order as any)?.approval_triggered;
    const approvalRole = (order as any)?.approval_role;
    const orderMemberId = order.relationships?.account_member?.data?.id;
    if (
      order.payment !== "authorized" ||
      approvalTriggered !== true ||
      !approvalRole ||
      !memberRole ||
      orderMemberId === accountMemberCookie.accountMemberId || // Exclude orders placed by logged-in user
      order.status === "cancelled" // Exclude cancelled orders
    ) {
      return false;
    }
    // approval_role can be a comma-separated list
    const roles = approvalRole
      .split(",")
      .map((r: string) => r.trim().toLowerCase());
    return roles.includes(memberRole.trim().toLowerCase());
  });

  const totalPages = Math.ceil(result.meta.results.total / limit);

  // Tab UI
  function getTabClass(tab: string) {
    return (
      "px-4 py-2 border-b-2 " +
      (activeTab === tab
        ? "border-brand-primary text-brand-primary font-semibold"
        : "border-transparent text-gray-500 hover:text-brand-primary hover:border-brand-primary")
    );
  }

  const displayedOrders =
    activeTab === "approval" ? approvalOrders : mappedOrders;

  return (
    <div className="flex flex-col gap-8 items-start w-full min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
      {/* Header Section */}
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Your Orders
            </h1>
            <p className="text-gray-600">View and manage your order history</p>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-xl shadow-md px-4 py-3 border border-gray-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5 text-brand-primary"
            >
              <path
                fillRule="evenodd"
                d="M6 5v1H4.667a1.75 1.75 0 00-1.743 1.598l-.826 9.5A1.75 1.75 0 003.84 19h12.32a1.75 1.75 0 001.742-1.902l-.826-9.5A1.75 1.75 0 0015.333 6H14V5a4 4 0 00-8 0zm4-2.5A2.5 2.5 0 007.5 5v1h5V5A2.5 2.5 0 0010 2.5zM7.5 10a2.5 2.5 0 005 0V8.75a.75.75 0 011.5 0V10a4 4 0 01-8 0V8.75a.75.75 0 011.5 0V10z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex flex-col">
              <span className="text-xs text-gray-600">Total Orders</span>
              <span className="text-xl font-bold text-gray-900">
                {result.meta.results.total}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
          <div className="flex">
            <a
              href="/account/orders?tab=history"
              className={
                "flex-1 text-center px-6 py-4 text-sm font-semibold transition-all " +
                (activeTab === "history"
                  ? "bg-brand-primary text-white border-b-4 border-brand-primary"
                  : "bg-white text-gray-600 hover:bg-gray-50 border-b-4 border-transparent hover:border-gray-300")
              }
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                    clipRule="evenodd"
                  />
                </svg>
                Order History
                <span
                  className={
                    "ml-2 px-2 py-0.5 rounded-full text-xs " +
                    (activeTab === "history"
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-600")
                  }
                >
                  {mappedOrders.length}
                </span>
              </div>
            </a>
            <a
              href="/account/orders?tab=approval"
              className={
                "flex-1 text-center px-6 py-4 text-sm font-semibold transition-all " +
                (activeTab === "approval"
                  ? "bg-brand-primary text-white border-b-4 border-brand-primary"
                  : "bg-white text-gray-600 hover:bg-gray-50 border-b-4 border-transparent hover:border-gray-300")
              }
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 5.29a1 1 0 010 1.415l-7.2 7.2a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.415l2.293 2.293 6.493-6.493a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Approval Queue
                {approvalOrders.length > 0 && (
                  <span
                    className={
                      "ml-2 px-2 py-0.5 rounded-full text-xs " +
                      (activeTab === "approval"
                        ? "bg-white/20 text-white"
                        : "bg-red-500 text-white animate-pulse")
                    }
                  >
                    {approvalOrders.length}
                  </span>
                )}
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="w-full max-w-6xl mx-auto">
        {displayedOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-16 w-16 text-gray-400 mx-auto mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {activeTab === "approval"
                ? "No orders in approval queue"
                : "No orders yet"}
            </h3>
            <p className="text-gray-500">
              {activeTab === "approval"
                ? "Orders requiring your approval will appear here."
                : "Start shopping to create your first order!"}
            </p>
          </div>
        ) : (
          <ul role="list" className="space-y-4">
            {displayedOrders.map(({ raw: order, items }) => (
              <li key={order.id}>
                <OrderItemWithDetails order={order} orderItems={items} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {displayedOrders.length > 0 && (
        <div className="w-full max-w-6xl mx-auto flex justify-center">
          <ResourcePagination totalPages={totalPages} />
        </div>
      )}
    </div>
  );
}

function resolveOrderItemsFromRelationship(
  itemRelationships: RelationshipToMany<"item">["data"],
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
  included: NonNullable<
    ResourcePage<Order, { items: OrderItem[] }>["included"]
  >,
): { raw: Order; items: OrderItem[] }[] {
  // Create a map of included items by their id
  const itemMap = included.items.reduce(
    (acc, item) => {
      return { ...acc, [item.id]: item };
    },
    {} as Record<string, OrderItem>,
  );

  // Map the items in the data array to their corresponding included items
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
