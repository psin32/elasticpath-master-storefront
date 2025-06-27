"use client";
import { YourBag } from "./YourBag";
import { CartSidebar } from "./CartSidebar";
import { Button } from "../../../components/button/Button";
import Link from "next/link";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { useCart } from "../../../react-shopper-hooks";
import { getCookie } from "cookies-next";
import { useState, useEffect } from "react";

export function CartView() {
  const { state } = useCart() as any;
  const [useShippingGroups, setUseShippingGroups] = useState<boolean>(false);

  // Check the use_shipping_groups setting on component mount
  useEffect(() => {
    const shippingGroupsValue = getCookie("use_shipping_groups");
    setUseShippingGroups(shippingGroupsValue === "true");
  }, []);

  // Determine the checkout URL based on shipping groups setting
  const checkoutUrl = useShippingGroups ? "/checkout/delivery" : "/checkout";

  return (
    <>
      {state?.items.length && state.items.length > 0 ? (
        <div className="flex flex-col lg:flex-row flex-1 self-stretch">
          {/* Main Content */}
          <div className="flex justify-center self-stretch items-start gap-2 flex-only-grow">
            <div className="flex flex-col gap-10 p-5 lg:p-24 w-full">
              <h1 className="text-4xl font-medium">{state.name}</h1>
              {/* Cart Items */}
              <YourBag />
            </div>
          </div>
          {/* Sidebar */}
          <div className="flex flex-col items-start gap-5 self-stretch px-5 py-5 lg:px-16 lg:py-40 bg-[#F9F9F9] flex-none">
            <CartSidebar />
            <Button type="button" asChild className="self-stretch">
              <Link href={checkoutUrl}>
                <LockClosedIcon className="w-5 h-5 mr-2" />
                Checkout
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Empty Cart */}
          <div className="mt-12 lg:mt-32 text-center min-h-[30rem]">
            <h3 className="mt-4 text-2xl font-semibold text-gray-900">
              Empty Cart
            </h3>
            <p className="mt-1 text-gray-500">Your cart is empty</p>
            <div className="mt-6">
              <Button variant="primary" asChild>
                <Link href="/">Start shopping</Link>
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
