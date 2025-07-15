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
      orderMemberId === accountMemberCookie.accountMemberId // Exclude orders placed by logged-in user
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

  return (
    <div className="flex flex-col gap-5 items-start w-full">
      <div className="flex self-stretch border-b border-gray-200 mb-2">
        <a
          href="/account/orders?tab=history"
          className={getTabClass("history")}
        >
          Order History
        </a>
        <a
          href="/account/orders?tab=approval"
          className={getTabClass("approval")}
        >
          Approval Queue
        </a>
      </div>
      <div className="w-full">
        {activeTab === "approval" ? (
          approvalOrders.length === 0 ? (
            <div className="text-gray-500 py-8 text-center">
              No orders in approval queue.
            </div>
          ) : (
            <ul role="list">
              {approvalOrders.map(({ raw: order, items }) => (
                <li key={order.id}>
                  <OrderItemWithDetails order={order} orderItems={items} />
                </li>
              ))}
            </ul>
          )
        ) : (
          <ul role="list">
            {mappedOrders.map(({ raw: order, items }) => (
              <li key={order.id}>
                <OrderItemWithDetails order={order} orderItems={items} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex self-stretch">
        <ResourcePagination totalPages={totalPages} />
      </div>
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
