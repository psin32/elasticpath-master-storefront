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
import { useEffect, useState } from "react";

builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

export function OrderConfirmation() {
  const { confirmationData } = useCheckout();
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

  if (!confirmationData) {
    return null;
  }

  const { order } = confirmationData;
  const { enableBuilderIO, enabledStoryblok } = cmsConfig;

  const customerName = (
    order.data.contact?.name ??
    order.data.customer.name ??
    ""
  ).split(" ")[0];

  const { shipping_address, id: orderId } = order.data;

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
            <div>
              <span className="text-base font-medium">{`${shipping_address.first_name} ${shipping_address.last_name}`}</span>
              <p className="text-sm text-black/60">{shipping_address.line_1}</p>
              <span className="text-sm text-black/60">{`${shipping_address.region}, ${shipping_address.postcode}`}</span>
              {shipping_address.phone_number && (
                <span>{shipping_address.phone_number}</span>
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
