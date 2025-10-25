import Link from "next/link";
import { Separator } from "../../../components/separator/Separator";
import { DeliveryForm } from "../checkout/DeliveryForm";
import { BillingForm } from "../checkout/BillingForm";
import { NotesForm } from "../checkout/NotesForm";
import { SubmitReserveButton } from "./SubmitReserveButton";
import { ReserveSidebar } from "./ReserveSidebar";
import { AccountDisplay } from "../checkout/AccountDisplay";
import { ShippingGroupManager } from "../checkout/ShippingGroupManager";
import { ToggleShippingGroupsLink } from "./ToggleShippingGroupsLink";
import { cookies } from "next/headers";
import { cmsConfig } from "../../../lib/resolve-cms-env";
import { Content as BuilderContent } from "@builder.io/sdk-react";
import { builder } from "@builder.io/sdk";
import { getLogo } from "../../../services/storyblok";
import Content from "../../../components/storyblok/Content";
import { builderComponent } from "../../../components/builder-io/BuilderComponents";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

type AccountReserveProps = {
  cart?: any;
};

export async function AccountReserve({ cart }: AccountReserveProps) {
  const { enableBuilderIO, enabledStoryblok } = cmsConfig;
  const cookieStore = cookies();
  const locale = cookieStore.get("locale")?.value || "en";

  // Check if shipping groups are enabled
  const useShippingGroups =
    cookieStore.get("use_shipping_groups")?.value === "true";

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
          <div className="flex flex-col flex-1 gap-5 self-stretch">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-medium">Your Info</span>
              <ToggleShippingGroupsLink />
            </div>
            <AccountDisplay />
          </div>
          {useShippingGroups ? (
            <div className="w-full">
              <ShippingGroupManager hideDisableLink={true} />
            </div>
          ) : (
            <>
              <div className="w-full">
                <DeliveryForm />
              </div>
              <div className="flex flex-1 self-stretch w-full">
                <BillingForm />
              </div>
            </>
          )}
          <div className="flex flex-1 self-stretch w-full">
            <NotesForm />
          </div>
          <div className="flex flex-1 self-stretch">
            <SubmitReserveButton cart={cart} />
          </div>
        </div>
        <div className="order-first lg:order-last lg:px-16 w-full lg:w-auto lg:pt-36 lg:bg-[#F9F9F9] lg:h-full lg:shadow-[0_0_0_100vmax_#F9F9F9] lg:clip-path-sidebar">
          {/* Sidebar */}
          <ReserveSidebar cart={cart} />
        </div>
      </div>
    </div>
  );
}
