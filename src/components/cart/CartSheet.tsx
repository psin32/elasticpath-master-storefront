"use client";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../sheet/Sheet";
import { Button } from "../button/Button";
import { LockClosedIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { CartItem } from "../../app/(store)/cart/CartItem";
import { useCart } from "../../react-shopper-hooks";
import { Separator } from "../separator/Separator";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import { Fragment } from "react";
import { AddPromotion } from "../checkout-sidebar/AddPromotion";
import Link from "next/link";
import { LoadingDots } from "../LoadingDots";
import { CartItemsGrouped } from "./CartItemsGrouped";
import Cookies from "js-cookie";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../lib/cookie-constants";
import { useState, useEffect } from "react";
import { createOrUpdateSharedListEntry } from "../../services/custom-api";
import { useRouter } from "next/navigation";
import { getEpccImplicitClient } from "../../lib/epcc-implicit-client";
import { toast } from "react-toastify";
import { createNewCart } from "./actions";

export function Cart() {
  const { state, useScopedRemoveCartItem, useScopedAddBulkProductToCart } =
    useCart() as any;
  const isRegisteredUser = !!Cookies.get(ACCOUNT_MEMBER_TOKEN_COOKIE_NAME);
  const router = useRouter();

  const { items, __extended } = state ?? {};

  const { mutate, isPending } = useScopedRemoveCartItem();
  const { mutate: mutateBulkProduct } = useScopedAddBulkProductToCart();

  const discountedValues = (
    state?.meta?.display_price as
      | { discount: { amount: number; formatted: string } }
      | undefined
  )?.discount;

  const enableClickAndCollect =
    process.env.NEXT_PUBLIC_ENABLE_CLICK_AND_COLLECT === "true";

  // Add state for useShippingGroups
  const [useShippingGroups, setUseShippingGroups] = useState(false);
  useEffect(() => {
    const shippingGroupsValue = Cookies.get("use_shipping_groups");
    setUseShippingGroups(shippingGroupsValue === "true");
  }, []);
  const checkoutUrl = useShippingGroups ? "/checkout/delivery" : "/checkout";

  // Overlay state
  const [showCreateList, setShowCreateList] = useState(false);
  const [listName, setListName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleCreateList(name: string, isPublic: boolean) {
    // 1. Create new cart
    const newCartResp = await createNewCart(name);
    const newCartId = newCartResp?.data?.id;
    if (!newCartId) throw new Error("Failed to create new cart");
    // 2. Bulk add all items from current cart
    const items =
      state?.items?.map((item: any) => ({
        type: "cart_item",
        ...(item.sku ? { sku: item.sku } : { id: item.id }),
        quantity: item.quantity,
      })) || [];
    if (items.length > 0) {
      const client = getEpccImplicitClient();
      await client
        .Cart(newCartId)
        .BulkAdd(items, { add_all_or_nothing: false });
    }
    // 3. Create entry in lists Custom API
    const accountMemberCookie = Cookies.get(ACCOUNT_MEMBER_TOKEN_COOKIE_NAME);
    let account_member_id = "";
    if (accountMemberCookie) {
      const selectedAccount = JSON.parse(accountMemberCookie);
      account_member_id = selectedAccount?.accountMemberId;
    }
    await createOrUpdateSharedListEntry({
      account_member_id,
      name,
      cart_id: newCartId,
      is_public: isPublic,
      total_items: items.length,
    });
    return newCartId;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="rounded-md px-4 py-2 transition-all duration-200 hover:bg-slate-200/70 relative text-sm font-medium text-black hover:underline focus:text-brand-primary active:text-brand-primary">
          <span>
            {state?.items && state.items.length > 0 && (
              <span
                className={`${
                  state?.items ? "flex" : "hidden"
                } absolute right-0 top-0 h-5 w-5 items-center justify-center rounded-full bg-brand-primary p-[0.1rem] text-[0.6rem] text-white`}
              >
                {state?.items?.length}
              </span>
            )}
            <ShoppingBagIcon className="h-6 w-6" />
          </span>
        </button>
      </SheetTrigger>
      <SheetContent className="bg-white p-0 flex flex-col w-full">
        <SheetHeader className="border-b border-black/10">
          <div></div>
          <div className="flex items-center justify-between w-full">
            <SheetTitle tabIndex={0} className="uppercase text-sm font-medium">
              {state?.name}
            </SheetTitle>
            <SheetClose asChild>
              <Link
                href="/collections"
                className="text-sm text-brand-primary hover:underline mr-8"
              >
                See all collections
              </Link>
            </SheetClose>
          </div>
          <SheetClose className="ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
            <XMarkIcon className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </SheetHeader>
        {items && items.length > 0 ? (
          <>
            {/* Items */}
            <div className="grid gap-4 p-5 flex-1 overflow-auto">
              <ul
                role="list"
                className="flex flex-col items-start gap-5 self-stretch"
              >
                {enableClickAndCollect && (
                  <CartItemsGrouped items={items} isFullCart={false} />
                )}
                {!enableClickAndCollect &&
                  items.map((item: any) => {
                    return (
                      <Fragment key={item.id}>
                        <li key={item.id} className="self-stretch">
                          <CartItem item={item} />
                        </li>
                        <Separator />
                      </Fragment>
                    );
                  })}
              </ul>
            </div>
            {/* Bottom */}
            <SheetFooter className="flex flex-col sm:flex-col items-center gap-5 px-5 pb-5">
              <div className="flex flex-col self-stretch">
                <AddPromotion />
              </div>
              {__extended &&
                __extended.groupedItems.promotion.length > 0 &&
                __extended.groupedItems.promotion.map((promotion: any) => {
                  return (
                    <Fragment key={promotion.id}>
                      <Separator />
                      <div
                        key={promotion.id}
                        className="flex flex-col items-start gap-2 self-stretch"
                      >
                        <div className="flex flex-row gap-2">
                          <button
                            type="button"
                            disabled={isPending}
                            className="flex items-center"
                            onClick={() => mutate({ itemId: promotion.id })}
                          >
                            {isPending ? (
                              <LoadingDots className="bg-black" />
                            ) : (
                              <XMarkIcon className="h-3 w-3" />
                            )}
                          </button>
                          <span>{promotion.name}</span>
                        </div>
                      </div>
                    </Fragment>
                  );
                })}
              <Separator />
              {/* Totals */}
              <div className="flex flex-col items-start gap-2 w-full">
                {state?.meta?.display_price?.tax && (
                  <div className="flex justify-between items-baseline self-stretch">
                    <span>Tax</span>
                    <span className="font-medium text-lg">
                      {state.meta.display_price.tax.formatted}
                    </span>
                  </div>
                )}
                {discountedValues && discountedValues.amount !== 0 && (
                  <div className="flex justify-between items-baseline self-stretch">
                    <span>Discount</span>
                    <span className="font-medium text-lg text-red-600">
                      {discountedValues.formatted}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-baseline self-stretch">
                  <span>Total</span>
                  <span className="font-medium text-lg">
                    {state?.meta?.display_price?.with_tax?.formatted}
                  </span>
                </div>
              </div>
              <Separator />

              <div className="flex w-full gap-2">
                {isRegisteredUser && (
                  <SheetClose asChild className="flex-1">
                    <Button
                      type="button"
                      asChild
                      className="self-stretch py-2 text-sm"
                      variant="secondary"
                    >
                      <Link href="/create-quote">Create Quote</Link>
                    </Button>
                  </SheetClose>
                )}
                <SheetClose asChild className="flex-1">
                  <Button
                    type="button"
                    asChild
                    className="self-stretch py-2 text-sm"
                  >
                    <Link href={checkoutUrl}>
                      <LockClosedIcon className="w-5 h-5 mr-2" />
                      Checkout
                    </Link>
                  </Button>
                </SheetClose>
              </div>

              <div className="flex w-full gap-2">
                {isRegisteredUser && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="self-stretch py-2 text-sm flex-1"
                    onClick={() => setShowCreateList(true)}
                  >
                    Create List
                  </Button>
                )}
                <SheetClose asChild className="flex-1">
                  <Button
                    type="button"
                    variant="secondary"
                    asChild
                    className="self-stretch py-2 text-sm"
                  >
                    <Link href="/cart">Go to bag</Link>
                  </Button>
                </SheetClose>
              </div>

              {/* Create List Overlay */}
              {showCreateList && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
                    <button
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowCreateList(false)}
                      aria-label="Close"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                    <h2 className="text-xl font-bold mb-4">Create List</h2>
                    <form
                      onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                        e.preventDefault();
                        setFormError("");
                        if (!listName.trim()) {
                          setFormError("Name is required");
                          return;
                        }
                        setCreating(true);
                        try {
                          const newCartId = await handleCreateList(
                            listName,
                            isPublic,
                          );
                          setCreating(false);
                          setShowCreateList(false);
                          setListName("");
                          setIsPublic(false);
                          router.push(`/collections/${newCartId}`);
                        } catch (err: any) {
                          setFormError(
                            err.message || "Failed to create shared list",
                          );
                          setCreating(false);
                        }
                      }}
                    >
                      <label className="block mb-2 font-medium">
                        Name<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="border rounded px-3 py-2 w-full mb-4 focus:ring-brand-primary focus:border-brand-primary"
                        value={listName}
                        onChange={(e) => setListName(e.target.value)}
                        required
                        disabled={creating}
                      />
                      <div className="flex items-center mb-4">
                        <span className="mr-2">Private</span>
                        <button
                          type="button"
                          className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${isPublic ? "bg-brand-primary" : "bg-gray-300"}`}
                          onClick={() => setIsPublic((v) => !v)}
                          disabled={creating}
                        >
                          <span
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isPublic ? "translate-x-4" : ""}`}
                          />
                        </button>
                        <span className="ml-2">Public</span>
                      </div>
                      {formError && (
                        <div className="text-red-600 mb-2">{formError}</div>
                      )}
                      <div className="flex gap-2 mt-6">
                        <Button
                          type="submit"
                          disabled={creating}
                          className="py-2 text-sm"
                        >
                          {creating ? "Creating..." : "Create"}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setShowCreateList(false)}
                          disabled={creating}
                          className="py-2 text-sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-col items-center gap-5 py-20">
            <ShoppingBagIcon className="h-20 w-20" />
            <p className="font-medium text-lg">Your bag is empty.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
