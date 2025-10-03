"use client";

import { setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import { useEffect, useState } from "react";

export function DisableShippingGroupsLink() {
  const router = useRouter();
  const [isShippingGroupsEnabled, setIsShippingGroupsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if shipping groups are enabled
    const shippingGroupsValue = getCookie("use_shipping_groups");
    setIsShippingGroupsEnabled(shippingGroupsValue === "true");
  }, []);

  const handleDisableShippingGroups = async () => {
    setIsLoading(true);

    try {
      // Set the shipping groups cookie to false
      setCookie("use_shipping_groups", "false", {
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: "lax",
      });

      // Redirect to regular checkout page
      router.push("/checkout");
    } catch (error) {
      console.error("Error disabling shipping groups:", error);
      setIsLoading(false);
    }
  };

  // Only show the link if shipping groups are enabled
  if (!isShippingGroupsEnabled) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleDisableShippingGroups}
      disabled={isLoading}
      className="text-sm text-brand-primary hover:text-brand-primary/80 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading
        ? "Disabling..."
        : "(click here to disable multiple shipping groups)"}
    </button>
  );
}
