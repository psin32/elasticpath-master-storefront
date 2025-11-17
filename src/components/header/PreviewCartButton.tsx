"use client";

import { useState, useEffect } from "react";
import { getCookie, deleteCookie } from "cookies-next";
import { useCart } from "../../react-shopper-hooks";
import { updateCartSnapshotDate } from "../cart/actions";
import { toast } from "react-toastify";
import * as Dialog from "@radix-ui/react-dialog";
import { XMarkIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { CART_COOKIE_NAME } from "../../lib/cookie-constants";

export default function PreviewCartButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { cartId, state } = useCart();

  // Check if preview is enabled
  const [previewEnabled, setPreviewEnabled] = useState(false);

  // Get snapshot_date from cart state
  const snapshotDate = (state as any)?.snapshot_date;

  useEffect(() => {
    const previewValue = getCookie("preview_enabled");
    setPreviewEnabled(previewValue === "true");
  }, []);

  // Parse snapshot_date to local date and time for display/editing
  useEffect(() => {
    if (snapshotDate && isOpen) {
      try {
        const date = new Date(snapshotDate);
        // Convert UTC to local time
        const localDate = new Date(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          date.getUTCHours(),
          date.getUTCMinutes(),
        );
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, "0");
        const day = String(localDate.getDate()).padStart(2, "0");
        const hours = String(localDate.getHours()).padStart(2, "0");
        const minutes = String(localDate.getMinutes()).padStart(2, "0");

        setSelectedDate(`${year}-${month}-${day}`);
        setSelectedTime(`${hours}:${minutes}`);
      } catch (error) {
        console.error("Error parsing snapshot_date:", error);
      }
    } else if (!snapshotDate && isOpen) {
      // Reset when opening dialog without existing snapshot_date
      setSelectedDate("");
      setSelectedTime("");
    }
  }, [snapshotDate, isOpen]);

  // Set minimum date to today (allow current date and future dates)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Set minimum time - if selected date is today, use current time + 1 hour, otherwise use 00:00
  const getMinTime = () => {
    if (!selectedDate) return "00:00";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setHours(0, 0, 0, 0);

    // If selected date is today, set min time to current time + 1 hour
    if (selectedDateObj.getTime() === today.getTime()) {
      const oneHourLater = new Date();
      oneHourLater.setHours(oneHourLater.getHours() + 1);
      const hours = String(oneHourLater.getHours()).padStart(2, "0");
      const minutes = String(oneHourLater.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    }
    return "00:00";
  };

  // Format date and time to ISO 8601 with Z timezone: 2021-02-21T15:07:25Z
  const formatSnapshotDate = (date: string, time: string): string => {
    if (!date || !time) return "";

    // Combine date and time (interpreted as local time)
    const dateTimeString = `${date}T${time}:00`;
    const dateTime = new Date(dateTimeString);

    // Convert to UTC and format as ISO 8601 with Z (format: YYYY-MM-DDTHH:mm:ssZ)
    // Remove milliseconds from ISO string
    return dateTime.toISOString().replace(/\.\d{3}Z$/, "Z");
  };

  const handleDateSelect = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select both date and time", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    // Validate that the selected datetime is in the future
    const formattedSnapshotDate = formatSnapshotDate(
      selectedDate,
      selectedTime,
    );
    const selectedDateTime = new Date(formattedSnapshotDate);
    const now = new Date();

    if (selectedDateTime <= now) {
      toast.error("Please select a future date and time", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    // Get cart ID from cookie if not available from context
    const currentCartId =
      cartId || (getCookie(CART_COOKIE_NAME) as string | undefined);

    if (!currentCartId) {
      toast.error("No cart found. Please add items to your cart first.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateCartSnapshotDate(
        currentCartId,
        "Cart",
        formattedSnapshotDate,
      );
      toast.success(
        `Cart snapshot date set to ${selectedDate} at ${selectedTime}`,
        {
          position: "top-center",
          autoClose: 3000,
        },
      );
      setIsOpen(false);
      setSelectedDate("");
      setSelectedTime("");
      window.location.reload();
    } catch (error) {
      toast.error(
        `Failed to update cart snapshot date: ${error instanceof Error ? error.message : "Unknown error"}`,
        {
          position: "top-center",
          autoClose: 3000,
        },
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Format snapshot_date for display
  const formatDisplayDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      // Convert UTC to local time for display
      const localDate = new Date(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
      );
      return localDate.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleCreateNewCart = () => {
    try {
      // Delete the cart cookie
      deleteCookie(CART_COOKIE_NAME, { path: "/" });

      toast.success("New cart will be created automatically", {
        position: "top-center",
        autoClose: 2000,
      });

      setIsOpen(false);

      // Reload page to trigger middleware to create new cart
      window.location.reload();
    } catch (error) {
      toast.error(
        `Failed to create new cart: ${error instanceof Error ? error.message : "Unknown error"}`,
        {
          position: "top-center",
          autoClose: 3000,
        },
      );
    }
  };

  // Don't render if preview is not enabled
  if (!previewEnabled) {
    return null;
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          className="px-4 py-2 bg-white text-black rounded-md hover:text-brand-primary border border-input border-black/40 hover:border-brand-primary focus-visible:ring-0 focus-visible:border-black flex items-center gap-2 whitespace-nowrap text-sm"
          aria-label="Preview Cart"
          title={
            snapshotDate
              ? `Preview: ${formatDisplayDate(snapshotDate)}`
              : "Preview Cart"
          }
        >
          <CalendarIcon className="h-5 w-5 flex-shrink-0" />
          {snapshotDate ? (
            <span className="text-xs truncate max-w-[200px]">
              {formatDisplayDate(snapshotDate)}
            </span>
          ) : (
            <span>Preview Cart</span>
          )}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 z-50 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              Select Preview Date
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Close"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="text-sm text-gray-600 mb-4">
            {snapshotDate ? (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Current Preview Date:
                </p>
                <p className="text-sm text-blue-700 mb-2">
                  {formatDisplayDate(snapshotDate)}
                </p>
                <button
                  onClick={handleCreateNewCart}
                  className="text-xs text-blue-600 hover:text-blue-800 underline focus:outline-none"
                >
                  Create new cart (removes preview date)
                </button>
              </div>
            ) : null}
            Select a future date and time to preview your cart as it will appear
            at that moment. Prices and availability will be based on the
            selected date and time.
          </Dialog.Description>
          <div className="mb-4">
            <label
              htmlFor="preview-date"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Preview Date
            </label>
            <input
              id="preview-date"
              type="date"
              min={getMinDate()}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                // Reset time when date changes to ensure future datetime
                if (e.target.value) {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  const selectedDateObj = new Date(e.target.value);
                  selectedDateObj.setHours(0, 0, 0, 0);

                  // If selected date is today, set min time to current time + 1 hour
                  if (selectedDateObj.getTime() === today.getTime()) {
                    const oneHourLater = new Date();
                    oneHourLater.setHours(oneHourLater.getHours() + 1);
                    const hours = String(oneHourLater.getHours()).padStart(
                      2,
                      "0",
                    );
                    const minutes = String(oneHourLater.getMinutes()).padStart(
                      2,
                      "0",
                    );
                    setSelectedTime(`${hours}:${minutes}`);
                  } else {
                    setSelectedTime("00:00");
                  }
                } else {
                  setSelectedTime("");
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="preview-time"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Preview Time
            </label>
            <input
              id="preview-time"
              type="time"
              min={getMinTime()}
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                disabled={isUpdating}
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleDateSelect}
              disabled={!selectedDate || !selectedTime || isUpdating}
              className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? "Updating..." : "Set Preview Date & Time"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
