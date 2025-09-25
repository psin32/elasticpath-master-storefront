"use client";

import { useState, useEffect } from "react";
import { useAuthedAccountMember, useCart } from "../../react-shopper-hooks";
import { StatusButton } from "../button/StatusButton";
import LoginToSeePriceButton from "./LoginToSeePriceButton";
import { getEpccImplicitClient } from "../../lib/epcc-implicit-client";
import { setCookie } from "cookies-next";
import { CART_COOKIE_NAME } from "../../lib/cookie-constants";
import { useRouter } from "next/navigation";
import { ChevronDownIcon, PlusIcon } from "@heroicons/react/24/outline";
import { CreateCartModal } from "../cart/CreateCartModal";

interface AddToCartButtonProps {
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  status?: "idle" | "loading";
  className?: string;
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  showPrice?: boolean; // Whether to show price (if false, shows LoginToSeePriceButton)
}

interface Cart {
  id: string;
  name: string;
  meta: {
    display_price: {
      with_tax: {
        amount: number;
        formatted: string;
      };
    };
  };
}

export function AddToCartButton({
  type = "submit",
  disabled = false,
  status = "idle",
  className = "w-full",
  children = "ADD TO CART",
  onClick,
  showPrice = true,
}: AddToCartButtonProps) {
  const { data: accountMember, selectedAccountToken } =
    useAuthedAccountMember();
  const [carts, setCarts] = useState<Cart[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentCartId, setCurrentCartId] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { state } = useCart();
  const router = useRouter();

  // Get current cart ID from cookie
  useEffect(() => {
    setCurrentCartId(state?.id || "");
  }, []);

  // Fetch user's carts when component mounts or when user changes
  useEffect(() => {
    if (accountMember && selectedAccountToken) {
      fetchUserCarts();
    }
  }, [accountMember, selectedAccountToken]);

  const fetchUserCarts = async () => {
    if (!selectedAccountToken) return;

    setLoading(true);
    try {
      const client = getEpccImplicitClient();
      const response = await client.request
        .send(`/carts`, "GET", null, undefined, client, undefined, "v2", {
          "EP-Account-Management-Authentication-Token":
            selectedAccountToken.token,
        })
        .catch((err) => {
          console.error("Error while getting account carts", err);
          return { data: [] };
        });

      // Filter out quotes and only show actual carts
      const validCarts = response.data.filter((cart: any) => !cart.is_quote);
      setCarts(validCarts);
    } catch (error) {
      console.error("Error fetching carts:", error);
      setCarts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCartSelect = async (cartId: string, cartName: string) => {
    if (!selectedAccountToken) return;

    try {
      const client = getEpccImplicitClient();

      // Update cart name if needed
      await client.Cart(cartId).UpdateCart({
        name: cartName,
      });

      // Set the selected cart as the current cart
      setCookie(CART_COOKIE_NAME, cartId);
      setCurrentCartId(cartId);

      // Close dropdown
      setIsDropdownOpen(false);

      // Refresh the page to update cart state
      router.refresh();
    } catch (error) {
      console.error("Error selecting cart:", error);
    }
  };

  const currentCart = carts.find((cart) => cart.id === currentCartId);
  const isAuthenticated = !!accountMember;

  // If user is not authenticated or price is not available, show login button
  if (!showPrice) {
    return (
      <LoginToSeePriceButton
        type={type}
        disabled={disabled}
        className={className}
      />
    );
  }

  // If user is not authenticated, show regular add to cart button
  if (!isAuthenticated) {
    return (
      <StatusButton
        type={type}
        disabled={disabled}
        status={status}
        className={className}
        onClick={onClick}
      >
        {children}
      </StatusButton>
    );
  }

  // If user is authenticated and has carts, show split button with dropdown
  return (
    <div className="relative flex">
      {/* Left side - Add to Cart button */}
      <StatusButton
        type={type}
        disabled={disabled}
        status={status}
        className={`${className} rounded-r-none border-r-0`}
        onClick={onClick}
      >
        <span className="truncate">
          {carts.length > 1 && currentCart
            ? `${children} (${currentCart.name})`
            : children}
        </span>
      </StatusButton>

      {/* Right side - Dropdown button (only if multiple carts) */}
      {carts.length > 1 && (
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.preventDefault();
            setIsDropdownOpen(!isDropdownOpen);
          }}
          className={`px-2 py-2 text-sm font-medium bg-brand-primary text-white border border-l-0 border-transparent rounded-r-3xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            status === "loading" ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <ChevronDownIcon className="w-4 h-4" />
        </button>
      )}

      {isDropdownOpen && carts.length > 1 && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsDropdownOpen(false)}
          />

          {/* Modern Dropdown */}
          <div className="absolute z-20 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-hidden min-w-64 animate-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-semibold text-gray-900">
                Select Cart
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Choose which cart to add this item to
              </p>
            </div>

            {/* Cart List */}
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-6 text-center">
                  <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    <span>Loading carts...</span>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  {carts
                    ?.filter((cart: any) => !cart.is_quote)
                    .map((cart, index) => (
                      <button
                        key={cart.id}
                        onClick={() => handleCartSelect(cart.id, cart.name)}
                        className={`w-full px-4 py-3 text-left transition-all duration-150 hover:bg-gray-50 group ${
                          cart.id === currentCartId
                            ? "bg-blue-50 border-r-2 border-r-blue-600"
                            : "hover:bg-gray-50"
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {/* Cart Info */}
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium truncate ${
                                  cart.id === currentCartId
                                    ? "text-blue-900"
                                    : "text-gray-900"
                                }`}
                              >
                                {cart.name}
                              </p>
                            </div>
                          </div>

                          {/* Selection Indicator */}
                          {cart.id === currentCartId && (
                            <div className="flex-shrink-0">
                              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}

                  {/* Create New Cart Option */}
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsCreateModalOpen(true);
                      }}
                      className="w-full px-4 py-3 text-left transition-all duration-150 hover:bg-gray-50 group text-blue-600 hover:text-blue-700"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600 group-hover:bg-blue-200">
                          <PlusIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">Create New Cart</p>
                          <p className="text-xs text-blue-500">
                            Add a new shopping cart
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500 text-center">
                {carts?.filter((cart: any) => !cart.is_quote).length || 0} cart
                {carts?.filter((cart: any) => !cart.is_quote).length !== 1
                  ? "s"
                  : ""}{" "}
                available
              </p>
            </div>
          </div>
        </>
      )}

      {/* Create Cart Modal */}
      <CreateCartModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCartCreated={(cartId) => {
          setCurrentCartId(cartId);
          // Refresh the carts list
          if (accountMember) {
            fetchUserCarts();
          }
        }}
        selectedAccountToken={selectedAccountToken}
      />
    </div>
  );
}
