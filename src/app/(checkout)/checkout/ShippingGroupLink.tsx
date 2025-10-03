"use client";

import { setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import { useEffect, useState } from "react";

export function ShippingGroupLink() {
  const router = useRouter();
  const [isShippingGroupsEnabled, setIsShippingGroupsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if shipping groups are already enabled
    const shippingGroupsValue = getCookie("use_shipping_groups");
    setIsShippingGroupsEnabled(shippingGroupsValue === "true");
  }, []);

  const handleEnableShippingGroups = async () => {
    setIsLoading(true);

    try {
      // Set the shipping groups cookie to true
      setCookie("use_shipping_groups", "true", {
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: "lax",
      });

      // Redirect to delivery page
      router.push("/checkout/delivery");
    } catch (error) {
      console.error("Error enabling shipping groups:", error);
      setIsLoading(false);
    }
  };

  // Don't show the link if shipping groups are already enabled
  if (isShippingGroupsEnabled) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleEnableShippingGroups}
      disabled={isLoading}
      className="text-sm text-brand-primary hover:text-brand-primary/80 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading
        ? "Enabling..."
        : "(click here to enable multiple shipping groups)"}
    </button>
  );
}
