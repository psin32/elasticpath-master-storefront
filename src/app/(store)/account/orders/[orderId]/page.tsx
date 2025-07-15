import { cookies } from "next/headers";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../../../lib/cookie-constants";
import { notFound, redirect } from "next/navigation";
import { getServerSideImplicitClient } from "../../../../../lib/epcc-server-side-implicit-client";
import { getServerSideCredentialsClientWihoutAccountToken } from "../../../../../lib/epcc-server-side-credentials-client";
import {
  Order,
  OrderIncluded,
  OrderItem,
  RelationshipToMany,
} from "@elasticpath/js-sdk";
import { retrieveAccountMemberCredentials } from "../../../../../lib/retrieve-account-member-credentials";
import { Button } from "../../../../../components/button/Button";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { formatIsoDateString } from "../../../../../lib/format-iso-date-string";
import { OrderLineItem } from "./OrderLineItem";
import { Reorder } from "../Reorder";
import React from "react";
import {
  approveOrder,
  rejectOrder,
  escalateOrder,
  getAccountMemberDetails,
} from "../actions";
import dynamic from "next/dynamic";
const ApprovalActions = dynamic(() => import("./ApprovalActions"), {
  ssr: false,
});

export default async function Orders({
  params,
}: {
  params: { orderId: string };
}) {
  const cookieStore = cookies();

  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookieStore,
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  if (!accountMemberCookie) {
    return redirect("/login");
  }

  const client = getServerSideImplicitClient();

  let result: Awaited<ReturnType<typeof client.Orders.Get>> | undefined =
    undefined;
  try {
    result = await client.Orders.With("items").Get(params.orderId);
  } catch (e: any) {
    if (
      "errors" in e &&
      (e.errors as any)[0].detail === "The order does not exist"
    ) {
      notFound();
    }
    throw e;
  }

  const shopperOrder = result!.included
    ? resolveShopperOrder(result!.data, result!.included)
    : { raw: result!.data, items: [] };

  const shippingAddress = shopperOrder.raw.shipping_address;

  const productItems = shopperOrder.items.filter(
    (item) =>
      item.unit_price.amount >= 0 && !item.sku.startsWith("__shipping_"),
  );
  const shippingItem = shopperOrder.items.find((item) =>
    item.sku.startsWith("__shipping_"),
  );

  // Fetch shipping groups for this order (cart)
  let shippingGroups: any[] = [];
  try {
    const shippingGroupsClient =
      getServerSideCredentialsClientWihoutAccountToken();
    const shippingGroupsResponse = await shippingGroupsClient.request.send(
      `orders/${params.orderId}/shipping-groups`,
      "GET",
      undefined,
      undefined,
      shippingGroupsClient,
      undefined,
      "v2",
    );
    shippingGroups = shippingGroupsResponse.data || [];
  } catch (e) {
    // ignore error, just don't show shipping groups
    shippingGroups = [];
  }

  // Group productItems by shipping_group_id
  const itemsByShippingGroup: Record<string, OrderItem[]> = {};
  productItems.forEach((item) => {
    const groupId = item.shipping_group_id || "__no_group__";
    if (!itemsByShippingGroup[groupId]) itemsByShippingGroup[groupId] = [];
    itemsByShippingGroup[groupId].push(item);
  });

  // Helper to get group details by id
  const getShippingGroupById = (id: string) =>
    shippingGroups.find((g) => g.id === id);

  // Fetch current account member to get their role
  const accountMember = await client.AccountMembers.Get(
    accountMemberCookie.accountMemberId,
  );
  // member_role is a custom field
  const memberRole = (accountMember.data as any)?.member_role;

  // approval_role is a custom field on the order
  const approvalRole = (shopperOrder.raw as any)?.approval_role;

  // approval_role can be a comma-separated list
  let showApprovalActions = false;
  if (approvalRole && memberRole) {
    const roles = approvalRole
      .split(",")
      .map((r: string) => r.trim().toLowerCase());
    showApprovalActions = roles.includes(memberRole.trim().toLowerCase());
  }

  // approval_member_id may be on the order (top-level or in extensions)
  const approvalMemberId = (shopperOrder.raw as any)?.approval_member_id;
  let approvalMember: any = null;
  if (approvalMemberId) {
    approvalMember = await getAccountMemberDetails(approvalMemberId);
  }
  console.log("approvalMember", approvalMember);

  // approval_status may be on the order (top-level or in extensions)
  const approvalStatus =
    (shopperOrder.raw as any)?.approval_status ||
    (shopperOrder.raw as any)?.extensions?.approval_status;

  // rejection_notes may be on the order (top-level or in extensions)
  const rejectionNotes =
    (shopperOrder.raw as any)?.rejection_notes ||
    (shopperOrder.raw as any)?.extensions?.rejection_notes;
  const isCancelled =
    (shopperOrder.raw as any)?.status === "cancelled" ||
    (shopperOrder.raw as any)?.payment === "cancelled";

  // Helper for badge color
  function getApprovalStatusColor(status: string) {
    switch ((status || "").toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "escalated":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }

  return (
    <div className="relative flex flex-col gap-10 items-center w-full min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Back to Orders Button (section top) */}
      <div className="mt-4 mb-2 w-full max-w-6xl flex">
        <Button
          variant="secondary"
          size="medium"
          asChild
          className="shadow-lg rounded-full px-5 py-2 text-base font-semibold hover:bg-gray-200 transition"
        >
          <Link href="/account/orders">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Orders
          </Link>
        </Button>
      </div>

      {/* Order Summary Card */}
      <div className="w-full max-w-6xl bg-white/90 rounded-3xl shadow-2xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-8 border border-gray-100 mt-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Order #{shopperOrder.raw.id}
            </h1>
            {approvalStatus && (
              <span
                className={`inline-block px-4 py-1 rounded-full border text-sm font-bold uppercase tracking-wide ${getApprovalStatusColor(approvalStatus)}`}
              >
                {approvalStatus}
              </span>
            )}
          </div>
          <time
            className="text-gray-500 text-base"
            dateTime={shopperOrder.raw.meta.timestamps.created_at}
          >
            {formatIsoDateString(shopperOrder.raw.meta.timestamps.created_at)}
          </time>
          {(shopperOrder.raw.relationships?.account_member?.data?.id ??
            null) !== accountMemberCookie.accountMemberId && (
            <div className="w-full flex flex-col md:flex-row md:justify-start mt-4 mb-2">
              <ApprovalActions
                orderId={params.orderId}
                approvalRole={approvalRole}
                memberRole={memberRole}
                accountMemberId={accountMemberCookie.accountMemberId}
                paymentStatus={shopperOrder.raw.payment}
                orderStatus={shopperOrder.raw.status}
              />
            </div>
          )}
          {approvalMember && (
            <div className="flex items-center gap-4 mt-3 p-3 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl w-fit shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-xl font-bold text-gray-600">
                {approvalMember.name
                  ? approvalMember.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "?"}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">
                  {approvalMember.name}
                </span>
                <span className="text-sm text-gray-500">
                  {approvalMember.email}
                </span>
                <span className="text-xs text-gray-400">Approval Member</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Notes Card */}
      {isCancelled && rejectionNotes && (
        <div className="w-full max-w-6xl bg-red-50 border border-red-200 rounded-2xl shadow p-6 flex flex-col gap-2">
          <span className="text-lg font-bold text-red-700 flex items-center gap-2">
            <svg
              className="w-6 h-6 text-red-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
              />
            </svg>
            Rejection Notes
          </span>
          <span className="text-base text-red-800 whitespace-pre-line">
            {rejectionNotes}
          </span>
        </div>
      )}

      {/* Shipping & Payment Card */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/90 rounded-2xl shadow-lg p-6 flex flex-col gap-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-gray-700 text-lg">
              Shipping Address
            </span>
          </div>
          {shippingGroups.length === 0 ? (
            <div className="text-gray-700 text-base">
              {shippingAddress.first_name} {shippingAddress.last_name}
              <br />
              {shippingAddress.line_1}
              <br />
              {shippingAddress.city ?? shippingAddress.county},{" "}
              {shippingAddress.postcode} {shippingAddress.country}
            </div>
          ) : (
            <span className="text-sm text-gray-700">
              There are multiple shipments for this order. Each shipment and its
              address are shown below.
            </span>
          )}
        </div>

        <div className="bg-white/90 rounded-2xl shadow-lg p-6 flex flex-col gap-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-gray-700 text-lg">
              Order Status
            </span>
          </div>
          <div className="flex flex-col gap-2 text-base">
            <span className="flex items-center gap-2">
              <span className="text-gray-700">Status:</span>
              <span
                className={`inline-block uppercase px-3 py-1 rounded-full border text-xs font-semibold ${getApprovalStatusColor(shopperOrder.raw.status)}`}
              >
                {shopperOrder.raw.status}
              </span>
            </span>
            <span className="text-gray-700">
              Shipping:{" "}
              <span className="font-semibold">{shopperOrder.raw.shipping}</span>
            </span>
            <span className="text-gray-700">
              Payment:{" "}
              <span className="font-semibold">{shopperOrder.raw.payment}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content: Items + Summary Side-by-Side */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8 items-start">
        {/* Items Card Grid */}
        <div className="flex-1 grid grid-cols-1 gap-8">
          {Object.entries(itemsByShippingGroup).map(([groupId, items]) => (
            <div
              key={groupId}
              className="bg-white/90 rounded-2xl shadow-lg p-6 flex flex-col gap-4 border border-gray-100 hover:shadow-2xl transition-shadow"
            >
              {groupId !== "__no_group__" &&
                (() => {
                  const group = shippingGroups.find((g) => g.id === groupId);
                  return (
                    <div className="flex flex-col gap-1 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-brand-primary">
                          Shipping Group
                        </span>
                        <span className="text-xs text-gray-400">
                          {group?.created_at
                            ? new Date(group.created_at).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>
                          Type:{" "}
                          <span className="font-medium text-black">
                            {group?.shipping_type}
                          </span>
                        </span>
                        {group?.meta?.shipping_display_price?.total
                          ?.formatted && (
                          <span>
                            Shipping:{" "}
                            <span className="font-medium text-black">
                              {
                                group.meta.shipping_display_price.total
                                  .formatted
                              }
                            </span>
                          </span>
                        )}
                        {group?.tracking_reference && (
                          <span>
                            Tracking:{" "}
                            <span className="font-medium text-black">
                              {group.tracking_reference}
                            </span>
                          </span>
                        )}
                        <span>
                          {group?.address?.first_name}{" "}
                          {group?.address?.last_name},{" "}
                          {[
                            group?.address?.line_1,
                            group?.address?.line_2,
                            group?.address?.city,
                            group?.address?.region,
                            group?.address?.postcode,
                            group?.address?.country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              {items.map((item) => (
                <OrderLineItem key={item.id} orderItem={item} />
              ))}
            </div>
          ))}
        </div>
        {/* Order Totals Card */}
        <div className="w-full md:w-80 lg:w-96 bg-white/90 rounded-2xl shadow-lg p-6 flex flex-col gap-4 border border-gray-100 mt-8 md:mt-0 md:sticky md:top-32">
          <div className="flex justify-between items-baseline">
            <span className="text-base">Subtotal</span>
            <span className="font-semibold">
              {shopperOrder.raw.meta.display_price?.without_tax?.formatted
                ? shopperOrder.raw.meta.display_price?.without_tax?.formatted
                : shopperOrder.raw.meta.display_price?.with_tax?.formatted}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-base">Shipping</span>
            <span className="font-semibold">
              {shippingItem?.meta?.display_price?.with_tax?.value.formatted ??
                shopperOrder.raw.meta.display_price.shipping.formatted}
            </span>
          </div>
          {shopperOrder.raw.meta.display_price.discount.amount < 0 && (
            <div className="flex justify-between items-baseline">
              <span className="text-base">Discount</span>
              <span className="font-semibold text-red-600">
                {shopperOrder.raw.meta.display_price.discount.formatted}
              </span>
            </div>
          )}
          <div className="flex justify-between items-baseline">
            <span className="text-base">Sales Tax</span>
            <span className="font-semibold">
              {shopperOrder.raw.meta.display_price.tax.formatted}
            </span>
          </div>
          <div className="w-full border-t border-zinc-300 my-2"></div>
          <div className="flex justify-between items-baseline text-xl font-extrabold">
            <span>Total</span>
            <span>
              {shopperOrder.raw.meta.display_price.with_tax.formatted}
            </span>
          </div>
        </div>
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
  order: Order,
  included: NonNullable<OrderIncluded>,
): { raw: Order; items: OrderItem[] } {
  // Create a map of included items by their id
  const itemMap = included.items
    ? included.items.reduce(
        (acc, item) => {
          return { ...acc, [item.id]: item };
        },
        {} as Record<string, OrderItem>,
      )
    : {};

  // Map the items in the data array to their corresponding included items
  const orderItems = order.relationships?.items?.data
    ? resolveOrderItemsFromRelationship(order.relationships.items.data, itemMap)
    : [];

  return {
    raw: order,
    items: orderItems,
  };
}
