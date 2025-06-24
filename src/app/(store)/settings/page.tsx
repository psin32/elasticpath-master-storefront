"use client";
import { useState, useEffect } from "react";
import { getCookie, setCookie } from "cookies-next";

export default function SettingsPage() {
  // Start with undefined, only set after reading cookie
  const [productSource, setProductSource] = useState<string | undefined>(
    undefined,
  );
  const [saved, setSaved] = useState(false);

  // On mount, sync state with cookie
  useEffect(() => {
    const cookieValue =
      (getCookie("product_source") as string) || "elasticpath";
    setProductSource(cookieValue);
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

  if (productSource === undefined) {
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
              onClick={() =>
                setProductSource(
                  productSource === "elasticpath" ? "external" : "elasticpath",
                )
              }
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
        <div className="text-gray-400 text-xs text-center mt-6">
          Your selection is saved in a cookie and will persist across sessions.
        </div>
      </div>
    </div>
  );
}
