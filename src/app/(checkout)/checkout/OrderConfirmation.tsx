"use client";

import { useCheckout } from "./checkout-provider";
import { ConfirmationSidebar } from "./ConfirmationSidebar";
import Link from "next/link";
import EpIcon from "../../../components/icons/ep-icon";
import * as React from "react";
import { Separator } from "../../../components/separator/Separator";
import { CheckoutFooter } from "./CheckoutFooter";
import { Button } from "../../../components/button/Button";
import { cmsConfig } from "../../../lib/resolve-cms-env";
import { Content as BuilderContent } from "@builder.io/sdk-react";
import { builder } from "@builder.io/sdk";
import { getLogo } from "../../../services/storyblok";
import Content from "../../../components/storyblok/Content";
import { builderComponent } from "../../../components/builder-io/BuilderComponents";
import Cookies from "js-cookie";
import { useEffect, useMemo, useState } from "react";

builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

export function OrderConfirmation({ order: orderProp }: { order?: any } = {}) {
  const { confirmationData } = useCheckout();
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shippingGroups, setShippingGroups] = useState<any[]>([]);

  // Use the prop if provided, otherwise use context
  const order = orderProp || confirmationData?.order;

  // Derive core order values safely so hooks can always run
  const orderId: string | undefined = order?.data?.id;
  const shipping_address = order?.data?.shipping_address;

  useEffect(() => {
    const loadContent = async () => {
      const { enableBuilderIO, enabledStoryblok } = cmsConfig;
      const locale = Cookies.get("locale") || "en";

      try {
        if (enableBuilderIO) {
          const builderContent = await builder
            .get("logo", {
              prerender: false,
            })
            .toPromise();
          setContent(builderContent);
        } else if (enabledStoryblok) {
          const storyblokContent = await getLogo(locale);
          setContent(storyblokContent);
        }
      } catch (error) {
        console.error("Error loading logo content:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, []);

  const { enableBuilderIO, enabledStoryblok } = cmsConfig;

  const customerName = order
    ? (order.data.contact?.name ?? order.data.customer?.name ?? "").split(
        " ",
      )[0]
    : "";

  // Order items (used for shipping groups display)
  const orderItems = useMemo(
    () => ((order as any)?.included?.items as any[]) || [],
    [order],
  );

  const productItems = useMemo(
    () =>
      orderItems.filter(
        (item: any) =>
          !item.sku?.startsWith("__shipping_") &&
          (item.unit_price?.amount ?? 0) >= 0,
      ),
    [orderItems],
  );

  const itemsByShippingGroup = useMemo(() => {
    const groups: Record<string, any[]> = {};
    productItems.forEach((item: any) => {
      const groupId = item.shipping_group_id
        ? String(item.shipping_group_id)
        : "__no_group__";
      if (!groups[groupId]) groups[groupId] = [];
      groups[groupId].push(item);
    });
    return groups;
  }, [productItems]);

  const hasShippingGroups = useMemo(
    () => Object.keys(itemsByShippingGroup).some((id) => id !== "__no_group__"),
    [itemsByShippingGroup],
  );

  // Fetch shipping groups for this order
  useEffect(() => {
    if (!orderId) {
      setShippingGroups([]);
      return;
    }

    let isMounted = true;

    async function fetchShippingGroups() {
      try {
        const res = await fetch(`/api/orders/${orderId}/shipping-groups`);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch order shipping groups (${res.status})`,
          );
        }
        const json = await res.json();
        if (isMounted) {
          setShippingGroups((json as any)?.data || []);
        }
      } catch (error) {
        console.error(
          "Error fetching shipping groups for confirmation:",
          error,
        );
        if (isMounted) {
          setShippingGroups([]);
        }
      }
    }

    void fetchShippingGroups();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (!order) {
    return null;
  }

  return (
    <div className="lg:flex lg:min-h-full">
      <div className="flex justify-center items-center lg:hidden py-5">
        <Link href="/" aria-label="Go to home page">
          {enabledStoryblok && content && <Content content={content}></Content>}
          {enableBuilderIO && content && (
            <BuilderContent
              model="logo"
              content={content}
              apiKey={process.env.NEXT_PUBLIC_BUILDER_IO_KEY || ""}
              customComponents={builderComponent}
            />
          )}
          {(!enabledStoryblok && !enableBuilderIO) ||
          (!content && !isLoading) ? (
            <EpIcon className="h-8 w-auto relative" />
          ) : null}
        </Link>
      </div>
      <div className="flex flex-col lg:flex-row items-start flex-only-grow">
        {/* Confirmation Content */}
        <div className="flex flex-col self-stretch px-5 lg:px-20 lg:w-[37.5rem] flex-1 lg:py-20 gap-10">
          <div className="justify-center items-center hidden lg:flex py-5">
            <Link href="/" aria-label="Go to home page">
              {enabledStoryblok && content && (
                <Content content={content}></Content>
              )}
              {enableBuilderIO && content && (
                <BuilderContent
                  model="logo"
                  content={content}
                  apiKey={process.env.NEXT_PUBLIC_BUILDER_IO_KEY || ""}
                  customComponents={builderComponent}
                />
              )}
              {(!enabledStoryblok && !enableBuilderIO) ||
              (!content && !isLoading) ? (
                <EpIcon className="h-12 w-auto relative" />
              ) : null}
            </Link>
          </div>
          <Separator />
          <span className="text-4xl font-medium">
            Thanks{customerName ? ` ${customerName}` : ""}!
          </span>
          <div>
            <Button variant="secondary" size="small" asChild>
              <Link href="/">Continue shopping</Link>
            </Button>
          </div>
          <span className="text-black/60">
            Order <span className="text-black">#{orderId}</span> is confirmed.
          </span>
          {/* Shipping */}
          <section className="flex flex-col gap-5 ">
            <h2 className="text-2xl font-medium">Ship to</h2>
            {!hasShippingGroups ? (
              <div>
                <span className="text-base font-medium">{`${shipping_address.first_name} ${shipping_address.last_name}`}</span>
                <p className="text-sm text-black/60">
                  {shipping_address.line_1}
                </p>
                <span className="text-sm text-black/60">{`${shipping_address.region}, ${shipping_address.postcode}`}</span>
                {shipping_address.phone_number && (
                  <span>{shipping_address.phone_number}</span>
                )}
              </div>
            ) : (
              <p className="text-sm text-black/60">
                There are multiple shipments for this order. Each shipment and
                its address are shown below.
              </p>
            )}
          </section>
          {/* Shipping Groups (if any) */}
          {hasShippingGroups && (
            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-medium">Shipping Groups</h2>
              <div className="flex flex-col gap-4">
                {Object.entries(itemsByShippingGroup)
                  .filter(([groupId]) => groupId !== "__no_group__")
                  .map(([groupId, items]) => {
                    const group = shippingGroups.find(
                      (g) => String(g.id) === groupId,
                    );
                    return (
                      <div
                        key={groupId}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col">
                            <span className="text-base font-semibold text-brand-primary">
                              Shipping Group
                            </span>
                            {group?.created_at && (
                              <span className="text-xs text-gray-400">
                                {new Date(
                                  group.created_at as string,
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {group?.meta?.shipping_display_price?.total
                            ?.formatted && (
                            <span className="text-sm font-medium text-gray-900">
                              {
                                group.meta!.shipping_display_price.total
                                  .formatted
                              }
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-700">
                          {group?.shipping_type && (
                            <span>
                              Type:{" "}
                              <span className="font-medium text-black">
                                {group.shipping_type}
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
                          {group?.address && (
                            <span>
                              {group.address.first_name}{" "}
                              {group.address.last_name},{" "}
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
                          )}
                        </div>
                        {items.length > 0 && (
                          <div className="mt-2 border-t border-gray-100 pt-2">
                            <span className="text-sm font-semibold text-gray-800">
                              Items in this shipment
                            </span>
                            <ul className="mt-1 space-y-1">
                              {(items as any[]).map((item) => (
                                <li
                                  key={item.id}
                                  className="text-sm text-gray-700 flex justify-between"
                                >
                                  <span className="truncate mr-2">
                                    {item.name}
                                  </span>
                                  <span className="text-gray-500">
                                    × {item.quantity}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </section>
          )}
          {/* Contact us */}
          <section>
            <h2 className="text-2xl font-medium">Need to make changes?</h2>
            <p className="text-black/60">
              Email us or call. Remember to reference order #{orderId}
            </p>
          </section>
          <CheckoutFooter />
        </div>
        {/* Confirmation Sidebar */}
        <div className="order-first lg:order-last lg:px-16 lg:pt-36  w-full lg:w-auto lg:bg-[#F9F9F9] lg:h-full">
          <div className="lg:flex lg:flex-col lg:gap-5 w-full lg:w-auto lg:max-w-[24.375rem]">
            <span className="hidden lg:inline-block text-2xl font-medium truncate">{`Order #${orderId}`}</span>
            <Separator />
            <ConfirmationSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
