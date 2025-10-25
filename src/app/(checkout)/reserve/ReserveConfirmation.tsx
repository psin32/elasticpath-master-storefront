"use client";

import { useReserve } from "./reserve-provider";
import Link from "next/link";
import EpIcon from "../../../components/icons/ep-icon";
import * as React from "react";
import { useEffect, useState } from "react";
import { Separator } from "../../../components/separator/Separator";
import { Button } from "../../../components/button/Button";
import { cmsConfig } from "../../../lib/resolve-cms-env";
import { Content as BuilderContent } from "@builder.io/sdk-react";
import { builder } from "@builder.io/sdk";
import { getLogo } from "../../../services/storyblok";
import Content from "../../../components/storyblok/Content";
import { builderComponent } from "../../../components/builder-io/BuilderComponents";
import Cookies from "js-cookie";
import {
  ItemSidebarHideable,
  ItemSidebarItems,
  ItemSidebarPromotions,
  ItemSidebarTotals,
  ItemSidebarTotalsDiscount,
  ItemSidebarTotalsSubTotal,
  ItemSidebarTotalsTax,
} from "../../../components/checkout-sidebar/ItemSidebar";

builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

export function ReserveConfirmation({
  order: orderProp,
}: { order?: any } = {}) {
  const { confirmationData } = useReserve();
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const order = orderProp || confirmationData?.order;
  if (!order) {
    return null;
  }

  const { enableBuilderIO, enabledStoryblok } = cmsConfig;

  const customerName = (
    order.data.contact?.name ??
    order.data.customer?.name ??
    ""
  ).split(" ")[0];

  const { shipping_address, id: orderId, meta } = order.data;

  const items = (confirmationData?.cart as any)?.included?.items || [];

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
          <div className="flex flex-col gap-4">
            <span className="text-4xl font-medium">
              Order Reserved{customerName ? `, ${customerName}` : ""}!
            </span>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                <strong>Success!</strong> Your order has been reserved
                successfully.
              </p>
              <p className="text-sm text-green-700 mt-2">
                Order <span className="font-semibold">#{orderId}</span> is
                confirmed as a reservation. No payment has been processed.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="primary" size="medium" asChild>
              <Link href="/">Continue shopping</Link>
            </Button>
            <Button variant="secondary" size="medium" asChild>
              <Link href="/account/orders">View Orders</Link>
            </Button>
          </div>
          {/* Shipping */}
          <section className="flex flex-col gap-5">
            <h2 className="text-2xl font-medium">Ship to</h2>
            <div>
              <span className="text-base font-medium">{`${shipping_address.first_name} ${shipping_address.last_name}`}</span>
              <p className="text-sm text-black/60">{shipping_address.line_1}</p>
              <span className="text-sm text-black/60">{`${shipping_address.region || shipping_address.city}, ${shipping_address.postcode}`}</span>
              {shipping_address.phone_number && (
                <p className="text-sm text-black/60">
                  {shipping_address.phone_number}
                </p>
              )}
            </div>
          </section>
          {/* Contact us */}
          <section>
            <h2 className="text-2xl font-medium">Need to make changes?</h2>
            <p className="text-black/60">
              Email us or call. Remember to reference order #{orderId}
            </p>
          </section>
        </div>
        {/* Confirmation Sidebar */}
        <div className="order-first lg:order-last lg:px-16 lg:pt-36 w-full lg:w-auto lg:bg-[#F9F9F9] lg:h-full">
          <div className="lg:flex lg:flex-col lg:gap-5 w-full lg:w-auto lg:max-w-[24.375rem]">
            <span className="hidden lg:inline-block text-2xl font-medium truncate">{`Order #${orderId}`}</span>
            <Separator />
            <ItemSidebarHideable meta={meta}>
              <div className="inline-flex flex-col items-start gap-5 w-full px-5 lg:px-0">
                <ItemSidebarItems items={items} />
                <ItemSidebarPromotions />
                <Separator />
                <ItemSidebarTotals>
                  <ItemSidebarTotalsSubTotal meta={meta} />
                  <ItemSidebarTotalsDiscount meta={meta} />
                  <ItemSidebarTotalsTax meta={meta} />
                </ItemSidebarTotals>
                <Separator />
                <div className="flex justify-between items-baseline self-stretch">
                  <span>Total</span>
                  <div className="flex items-center gap-2.5">
                    <span className="font-medium text-2xl">
                      {meta.display_price.with_tax.formatted}
                    </span>
                  </div>
                </div>
              </div>
            </ItemSidebarHideable>
          </div>
        </div>
      </div>
    </div>
  );
}
