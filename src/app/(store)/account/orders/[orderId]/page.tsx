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

export const dynamic = "force-dynamic";

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

  return (
    <div className="flex flex-col gap-5 items-start w-full">
      <div className="flex self-stretch">
        <Button variant="secondary" size="medium" asChild>
          <Link href="/account/orders">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to orders
          </Link>
        </Button>
      </div>
      <div className="w-full border-t border-zinc-300"></div>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl">Order # {shopperOrder.raw.id}</h1>
          <time dateTime={shopperOrder.raw.meta.timestamps.created_at}>
            {formatIsoDateString(shopperOrder.raw.meta.timestamps.created_at)}
          </time>
        </div>
      </div>

      {/* Shipping address, only if no shipping groups */}
      {shippingGroups.length === 0 && (
        <div className="flex py-4 self-stretch justify-between">
          <div className="flex flex-col gap-2.5">
            <span className="font-medium">Shipping address</span>
            <p translate="no">
              {shippingAddress.first_name} {shippingAddress.last_name}
              <br />
              {shippingAddress.line_1}
              <br />
              {shippingAddress.city ?? shippingAddress.county},{" "}
              {shippingAddress.postcode} {shippingAddress.country}
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="font-medium">Shipping status</span>
            <span>{shopperOrder.raw.shipping}</span>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="font-medium">Payment status</span>
            <span>{shopperOrder.raw.payment}</span>
          </div>
        </div>
      )}
      {shippingGroups.length > 0 && (
        <div className="flex py-4 self-stretch justify-between">
          <div className="flex flex-col gap-2.5">
            <span className="font-medium">Shipping status</span>
            <span>{shopperOrder.raw.shipping}</span>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="font-medium">Payment status</span>
            <span>{shopperOrder.raw.payment}</span>
          </div>
        </div>
      )}
      <Reorder orderId={params.orderId}></Reorder>
      <div className="flex self-stretch">
        <div className="flex flex-col gap-6 w-full">
          {/* Render items grouped by shipping group */}
          {Object.entries(itemsByShippingGroup).map(([groupId, items]) => {
            const group =
              groupId !== "__no_group__" ? getShippingGroupById(groupId) : null;
            // If there are no shipping groups at all, render ungrouped items plainly
            if (!group && shippingGroups.length === 0) {
              return items.map((item) => (
                <OrderLineItem key={item.id} orderItem={item} />
              ));
            }
            // Otherwise, render the group card (including 'No Shipping Group' if there are groups)
            return (
              <div
                key={groupId}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm mb-6"
              >
                <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex flex-col gap-1">
                  {group ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-brand-primary">
                          Shipping Group
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(group.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>
                          Type:{" "}
                          <span className="font-medium text-black">
                            {group.shipping_type}
                          </span>
                        </span>
                        {group.tracking_reference && (
                          <span>
                            Tracking:{" "}
                            <span className="font-medium text-black">
                              {group.tracking_reference}
                            </span>
                          </span>
                        )}
                        <span>
                          {group.address.first_name} {group.address.last_name},{" "}
                          {[
                            group.address.line_1,
                            group.address.line_2,
                            group.address.city,
                            group.address.region,
                            group.address.postcode,
                            group.address.country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-lg font-semibold text-gray-400">
                      No Shipping Group
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-0 divide-y divide-gray-100">
                  {items.map((item) => (
                    <OrderLineItem key={item.id} orderItem={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex self-stretch items-end flex-col gap-5">
        <div className="flex flex-col gap-2 w-[22.5rem]">
          <div className="flex justify-between items-baseline self-stretch">
            <span className="text-sm">Subtotal</span>
            <span className="font-medium">
              {shopperOrder.raw.meta.display_price?.without_tax?.formatted
                ? shopperOrder.raw.meta.display_price?.without_tax?.formatted
                : shopperOrder.raw.meta.display_price?.with_tax?.formatted}
            </span>
          </div>
          <div className="flex justify-between items-baseline self-stretch">
            <span className="text-sm">Shipping</span>
            <span className="font-medium">
              {shippingItem?.meta?.display_price?.with_tax?.value.formatted ??
                shopperOrder.raw.meta.display_price.shipping.formatted}
            </span>
          </div>
          {shopperOrder.raw.meta.display_price.discount.amount < 0 && (
            <div className="flex justify-between items-baseline self-stretch">
              <span className="text-sm">Discount</span>
              <span className="font-medium text-red-600">
                {shopperOrder.raw.meta.display_price.discount.formatted}
              </span>
            </div>
          )}
          <div className="flex justify-between items-baseline self-stretch">
            <span className="text-sm">Sales Tax</span>
            <span className="font-medium">
              {shopperOrder.raw.meta.display_price.tax.formatted}
            </span>
          </div>
        </div>
        <div className="w-[22.5rem] border-t border-zinc-300"></div>
        <div className="justify-between items-baseline flex w-[22.5rem]">
          <span>Total</span>
          <span className="font-medium">
            {shopperOrder.raw.meta.display_price.with_tax.formatted}
          </span>
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
