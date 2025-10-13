"use client";
import { useState, useEffect } from "react";
import { getCookie, setCookie } from "cookies-next";

export default function SettingsPage() {
  // Start with undefined, only set after reading cookie
  const [productSource, setProductSource] = useState<string | undefined>(
    undefined,
  );
  const [useShippingGroups, setUseShippingGroups] = useState<
    boolean | undefined
  >(true);
  const [paymentMode, setPaymentMode] = useState<string | undefined>(undefined);
  const [useMultiLocationInventory, setUseMultiLocationInventory] = useState<
    boolean | undefined
  >(undefined);
  const [saved, setSaved] = useState(false);

  // On mount, sync state with cookie
  useEffect(() => {
    const cookieValue =
      (getCookie("product_source") as string) || "elasticpath";
    setProductSource(cookieValue);

    const shippingGroupsValue = getCookie("use_shipping_groups");
    setUseShippingGroups(shippingGroupsValue === "true");

    const paymentModeValue =
      (getCookie("initial_payment_mode") as string) || "purchase";
    setPaymentMode(paymentModeValue);

    const multiLocationValue = getCookie("use_multi_location_inventory");
    // Default to true (enabled) if cookie doesn't exist
    setUseMultiLocationInventory(multiLocationValue !== "false");
  }, []);

  useEffect(() => {
    if (productSource === undefined) return;
    setCookie("product_source", productSource, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
    setSaved(true);
    const timeout = setTimeout(() => setSaved(false), 1200);
    return () => clearTimeout(timeout);
  }, [productSource]);

  useEffect(() => {
    if (useShippingGroups === undefined) return;
    setCookie("use_shipping_groups", useShippingGroups.toString(), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
    setSaved(true);
    const timeout = setTimeout(() => setSaved(false), 1200);
    return () => clearTimeout(timeout);
  }, [useShippingGroups]);

  useEffect(() => {
    if (paymentMode === undefined) return;
    setCookie("initial_payment_mode", paymentMode, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
    setSaved(true);
    const timeout = setTimeout(() => setSaved(false), 1200);
    return () => clearTimeout(timeout);
  }, [paymentMode]);

  useEffect(() => {
    if (useMultiLocationInventory === undefined) return;
    setCookie(
      "use_multi_location_inventory",
      useMultiLocationInventory.toString(),
      {
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: "lax",
      },
    );
    setSaved(true);
    const timeout = setTimeout(() => setSaved(false), 1200);
    return () => clearTimeout(timeout);
  }, [useMultiLocationInventory]);

  if (
    productSource === undefined ||
    useShippingGroups === undefined ||
    paymentMode === undefined ||
    useMultiLocationInventory === undefined
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="py-12 flex justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <svg
            className="w-8 h-8 text-brand-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.75V6.25M12 17.75V19.25M19.25 12H17.75M6.25 12H4.75M16.95 7.05L15.88 8.12M8.12 15.88L7.05 16.95M16.95 16.95L15.88 15.88M8.12 8.12L7.05 7.05"
            />
            <circle
              cx="12"
              cy="12"
              r="7.25"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        </div>
        {/* Product Source Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">Product Source</span>
            {saved && (
              <span className="text-brand-primary text-xs font-semibold">
                Saved!
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Choose which product source to use for browsing and shopping.
          </p>
          <div className="flex items-center gap-4">
            <span
              className={
                productSource === "elasticpath"
                  ? "font-semibold text-brand-primary"
                  : "text-gray-500"
              }
            >
              Elastic Path PXM
            </span>
            <button
              type="button"
              aria-label="Toggle product source"
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary
                ${productSource === "elasticpath" ? "bg-brand-primary" : "bg-gray-300"}`}
              onClick={() => {
                setProductSource(
                  productSource === "elasticpath" ? "external" : "elasticpath",
                );
                setTimeout(() => window.location.reload(), 100); // allow state/cookie to update
              }}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full shadow transition-transform duration-200
                  ${
                    productSource === "elasticpath"
                      ? "translate-x-1 bg-white border border-brand-primary"
                      : "translate-x-7 bg-white border border-gray-400"
                  }
                `}
              />
            </button>
            <span
              className={
                productSource === "external"
                  ? "font-semibold text-brand-primary"
                  : "text-gray-500"
              }
            >
              External Product
            </span>
          </div>
        </div>
        {/* Shipping Groups Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">
              Use Shipping Groups
            </span>
            {saved && (
              <span className="text-brand-primary text-xs font-semibold">
                Saved!
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Enable shipping groups to organize items into different shipping
            destinations.
          </p>
          <div className="flex items-center gap-4">
            <span
              className={
                !useShippingGroups
                  ? "font-semibold text-brand-primary"
                  : "text-gray-500"
              }
            >
              Disabled
            </span>
            <button
              type="button"
              aria-label="Toggle shipping groups"
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary
                ${useShippingGroups ? "bg-brand-primary" : "bg-gray-300"}`}
              onClick={() => {
                setUseShippingGroups(!useShippingGroups);
                setTimeout(() => window.location.reload(), 100); // allow state/cookie to update
              }}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full shadow transition-transform duration-200
                  ${
                    useShippingGroups
                      ? "translate-x-7 bg-white border border-brand-primary"
                      : "translate-x-1 bg-white border border-gray-400"
                  }
                `}
              />
            </button>
            <span
              className={
                useShippingGroups
                  ? "font-semibold text-brand-primary"
                  : "text-gray-500"
              }
            >
              Enabled
            </span>
          </div>
        </div>
        {/* Initial Payment Mode Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">
              Initial Payment Mode
            </span>
            {saved && (
              <span className="text-brand-primary text-xs font-semibold">
                Saved!
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Choose how payments are processed by default: Capture (immediate
            payment) or Authorize (hold funds, capture later).
          </p>
          <div className="flex items-center gap-4">
            <span
              className={
                paymentMode === "purchase"
                  ? "font-semibold text-brand-primary"
                  : "text-gray-500"
              }
            >
              Capture
            </span>
            <button
              type="button"
              aria-label="Toggle payment mode"
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary
                ${paymentMode === "purchase" ? "bg-brand-primary" : "bg-gray-300"}`}
              onClick={() => {
                setPaymentMode(
                  paymentMode === "purchase" ? "authorize" : "purchase",
                );
                setTimeout(() => window.location.reload(), 100); // allow state/cookie to update
              }}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full shadow transition-transform duration-200
                  ${
                    paymentMode === "purchase"
                      ? "translate-x-1 bg-white border border-brand-primary"
                      : "translate-x-7 bg-white border border-gray-400"
                  }
                `}
              />
            </button>
            <span
              className={
                paymentMode === "authorize"
                  ? "font-semibold text-brand-primary"
                  : "text-gray-500"
              }
            >
              Authorize
            </span>
          </div>
        </div>
        {/* Multi Location Inventory Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">
              Multi Location Inventory
            </span>
            {saved && (
              <span className="text-brand-primary text-xs font-semibold">
                Saved!
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Enable multi-location inventory to track stock across different
            store locations and show inventory by location on product pages.
          </p>
          <div className="flex items-center gap-4">
            <span
              className={
                !useMultiLocationInventory
                  ? "font-semibold text-brand-primary"
                  : "text-gray-500"
              }
            >
              Disabled
            </span>
            <button
              type="button"
              aria-label="Toggle multi location inventory"
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary
                ${useMultiLocationInventory ? "bg-brand-primary" : "bg-gray-300"}`}
              onClick={() => {
                setUseMultiLocationInventory(!useMultiLocationInventory);
                setTimeout(() => window.location.reload(), 100); // allow state/cookie to update
              }}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full shadow transition-transform duration-200
                  ${
                    useMultiLocationInventory
                      ? "translate-x-7 bg-white border border-brand-primary"
                      : "translate-x-1 bg-white border border-gray-400"
                  }
                `}
              />
            </button>
            <span
              className={
                useMultiLocationInventory
                  ? "font-semibold text-brand-primary"
                  : "text-gray-500"
              }
            >
              Enabled
            </span>
          </div>
        </div>
        <div className="text-gray-400 text-xs text-center mt-6">
          Your selection is saved in a cookie and will persist across sessions.
        </div>
      </div>
    </div>
  );
}
