"use client";

import { setCookie, getCookie } from "cookies-next";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function ToggleShippingGroupsLink() {
  const router = useRouter();
  const [isShippingGroupsEnabled, setIsShippingGroupsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if shipping groups are enabled
    const shippingGroupsValue = getCookie("use_shipping_groups");
    setIsShippingGroupsEnabled(shippingGroupsValue === "true");
  }, []);

  const handleToggleShippingGroups = async () => {
    setIsLoading(true);

    try {
      // Toggle the shipping groups cookie
      const newValue = !isShippingGroupsEnabled;
      setCookie("use_shipping_groups", newValue.toString(), {
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: "lax",
      });

      // Refresh the page to apply the new setting
      router.refresh();
      setIsShippingGroupsEnabled(newValue);
    } catch (error) {
      console.error("Error toggling shipping groups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleShippingGroups}
      disabled={isLoading}
      className="text-sm text-brand-primary hover:text-brand-primary/80 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed underline"
    >
      {isLoading
        ? "Loading..."
        : isShippingGroupsEnabled
          ? "Disable Multiple Shipping Groups"
          : "Enable Multiple Shipping Groups"}
    </button>
  );
}
