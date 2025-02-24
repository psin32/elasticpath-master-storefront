import { GuestInformation } from "./GuestInformation";
import { ShippingForm } from "./ShippingForm";
import Link from "next/link";
import EpIcon from "../../../components/icons/ep-icon";
import { DeliveryForm } from "./DeliveryForm";
import { PaymentForm } from "./PaymentForm";
import { BillingForm } from "./BillingForm";
import { SubmitCheckoutButton } from "./SubmitCheckoutButton";
import { Separator } from "../../../components/separator/Separator";
import * as React from "react";
import { CheckoutSidebar } from "./CheckoutSidebar";
import { ExpressCheckoutPaymentForm } from "./ExpressCheckoutPaymentForm";
import { cookies } from "next/headers";
import { cmsConfig } from "../../../lib/resolve-cms-env";
import { Content as BuilderContent } from "@builder.io/sdk-react";
import { builder } from "@builder.io/sdk";
import { getLogo } from "../../../services/storyblok";
import Content from "../../../components/storyblok/Content";
import { builderComponent } from "../../../components/builder-io/BuilderComponents";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

type GuestCheckoutProps = {
  cart?: any;
};

export async function GuestCheckout({ cart }: GuestCheckoutProps) {
  const { enableBuilderIO, enabledStoryblok } = cmsConfig;
  const cookieStore = cookies();
  const locale = cookieStore.get("locale")?.value || "en";
  const contentData = async () => {
    if (enableBuilderIO) {
      const content = await builder
        .get("logo", {
          prerender: false,
        })
        .toPromise();
      return content;
    }

    if (enabledStoryblok) {
      return await getLogo(locale);
    }
  };
  const content = await contentData();
  const enableExpressCheckout: boolean =
    process.env.NEXT_PUBLIC_ENABLE_EXPRESS_CHECKOUT === "true" || false;

  return (
    <div className="flex flex-col lg:flex-row justify-center">
      <div className="flex justify-center items-center lg:hidden py-5">
        <Link href="/" aria-label="Go to home page">
          {enabledStoryblok && <Content content={content}></Content>}
          {enableBuilderIO && (
            <BuilderContent
              model="logo"
              content={content}
              apiKey={process.env.NEXT_PUBLIC_BUILDER_IO_KEY || ""}
              customComponents={builderComponent}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col lg:flex-row items-start flex-only-grow max-w-[90rem]">
        <div className="flex flex-col self-stretch px-5 lg:px-20 lg:w-[37.5rem] flex-1 lg:py-20 items-center gap-10">
          <div className="justify-center items-center hidden lg:flex py-5">
            <Link href="/" aria-label="Go to home page">
              {enabledStoryblok && <Content content={content}></Content>}
              {enableBuilderIO && (
                <BuilderContent
                  model="logo"
                  content={content}
                  apiKey={process.env.NEXT_PUBLIC_BUILDER_IO_KEY || ""}
                  customComponents={builderComponent}
                />
              )}
            </Link>
          </div>
          <Separator />
          {!enableExpressCheckout && (
            <>
              <div className="flex flex-1 self-stretch">
                <GuestInformation />
              </div>
              <div className="flex flex-1 self-stretch">
                <ShippingForm />
              </div>
              <DeliveryForm />
              <PaymentForm />
            </>
          )}
          {enableExpressCheckout && (
            <ExpressCheckoutPaymentForm isAnonymous={true} />
          )}
          {!enableExpressCheckout && (
            <div className="flex flex-1 self-stretch">
              <BillingForm />
            </div>
          )}
          <div className="flex flex-1 self-stretch">
            <SubmitCheckoutButton cart={cart} />
          </div>
        </div>
        <div className="order-first lg:order-last lg:px-16 w-full lg:w-auto lg:pt-36 lg:bg-[#F9F9F9] lg:h-full lg:shadow-[0_0_0_100vmax_#F9F9F9] lg:clip-path-sidebar">
          {/* Sidebar */}
          <CheckoutSidebar cart={cart} />
        </div>
      </div>
    </div>
  );
}
