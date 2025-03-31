"use client";

import { Fragment, useEffect, useState } from "react";
import { deleteCartCustomDiscount } from "../actions";
import {
  ChevronUpIcon,
  PlusIcon,
  ShoppingBagIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { StatusButton } from "../../../../../components/button/StatusButton";
import { useCart } from "../../../../../react-shopper-hooks";
import { AddPromotion } from "../../../../../components/checkout-sidebar/AddPromotion";
import { CartItem } from "../../../../(store)/cart/CartItem";
import { LoadingDots } from "../../../../../components/LoadingDots";
import { Separator } from "../../../../../components/separator/Separator";
import { TextButton } from "../../../../../components/button/TextButton";
import { Disclosure } from "@headlessui/react";
import { getEpccImplicitClient } from "../../../../../lib/epcc-implicit-client";
import ProductSelectionArea from "./ProductSelectionArea";

export default function CartArea({
  setOpenDiscount,
  enableCustomDiscount,
  selectedAccount,
  createQuote,
  loadingCreateQuote,
  error,
}: {
  setOpenDiscount: any;
  enableCustomDiscount: boolean;
  selectedAccount: string;
  createQuote: any;
  loadingCreateQuote: boolean;
  error: string;
}) {
  const { state, useScopedRemoveCartItem } = useCart() as any;
  const { useScopedUpdateCartItem } = useCart();
  const { mutate: mutateUpdate } = useScopedUpdateCartItem();
  const { items, __extended } = state ?? {};
  const { mutate, isPending } = useScopedRemoveCartItem();
  const [products, setProduct] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const client = getEpccImplicitClient();
      const products = await client.ShopperCatalog.Products.With(["main_image"])
        .Filter({
          in: {
            product_types: "standard,parent",
          },
        })
        .All();
      setProduct(products);
    };
    init();
  }, [state]);

  const discountedValues = (
    state?.meta?.display_price as
      | { discount: { amount: number; formatted: string } }
      | undefined
  )?.discount;

  const removeCustomDiscount = async (customDiscountId: string) => {
    await deleteCartCustomDiscount(state.id, customDiscountId);
    if (state?.items?.length > 0) {
      mutateUpdate({
        itemId: state?.items?.[0]?.id,
        quantity: state?.items?.[0]?.quantity,
      });
    }
  };

  return (
    <div className="flex min-h-screen mt-10">
      <div className="w-[70%]">
        <ProductSelectionArea products={products} />
      </div>
      <div className="w-px bg-black/10 mx-10" />

      <div className="w-[30%]">
        <div className="bg-white p-0 flex flex-col w-full">
          <div className="flex justify-between items-center px-6 pb-10">
            <div></div>
            <h2 className="uppercase text-sm font-medium">Your Cart</h2>
            <div></div>
          </div>

          {items && items.length > 0 ? (
            <>
              <div className="grid gap-4 flex-1 overflow-auto">
                <ul className="flex flex-col items-start gap-5 w-full">
                  {items.map((item: any) => (
                    <Fragment key={item.id}>
                      <li className="self-stretch">
                        <Separator className="mb-6" />
                        <CartItem
                          item={item}
                          adminDisplay={true}
                          enableCustomDiscount={enableCustomDiscount}
                          selectedAccount={selectedAccount}
                          itemCustomDiscount={
                            __extended?.groupedItems?.itemCustomDiscounts
                          }
                          cartId={state?.id}
                        />
                      </li>
                      <hr className="Separator" />
                    </Fragment>
                  ))}
                </ul>
              </div>

              <div className="SheetFooter flex flex-col items-center gap-5">
                {!enableCustomDiscount && (
                  <div className="flex flex-col w-full">
                    <AddPromotion />
                  </div>
                )}

                {enableCustomDiscount && (
                  <div className="flex flex-col w-full">
                    <TextButton onClick={() => setOpenDiscount(true)}>
                      <PlusIcon className="w-5 h-5" /> Add Custom Discount
                    </TextButton>
                  </div>
                )}

                {__extended &&
                  __extended.groupedItems.promotion.length > 0 &&
                  __extended.groupedItems.promotion.map((promotion: any) => (
                    <Fragment key={promotion.id}>
                      <hr className="Separator" />
                      <div className="flex flex-col items-start gap-2 self-stretch">
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
                              <span>&#x2715;</span>
                            )}
                          </button>
                          <span>{promotion.name}</span>
                        </div>
                      </div>
                    </Fragment>
                  ))}

                {__extended &&
                  __extended.groupedItems.customDiscounts.length > 0 && (
                    <Disclosure as="div" className="w-full" defaultOpen>
                      {({ open }) => (
                        <>
                          <div className="flex justify-between">
                            <dt>
                              <Disclosure.Button
                                className={`${
                                  state?.included?.custom_discounts
                                    ? "cursor-pointer"
                                    : "cursor-auto"
                                } flex`}
                              >
                                {__extended.groupedItems.customDiscounts && (
                                  <ChevronUpIcon
                                    className={`${
                                      open
                                        ? "rotate-180 transform"
                                        : "rotate-90 transform"
                                    } h-3 w-3 text-black mr-1 mt-1`}
                                  />
                                )}
                                Custom Discount
                              </Disclosure.Button>
                            </dt>
                            <dd className="text-gray-900">
                              {state?.meta?.display_price?.discount?.formatted}
                            </dd>
                          </div>
                          <Disclosure.Panel className="text-sm">
                            {__extended.groupedItems.customDiscounts?.map(
                              (discount: any) => {
                                return (
                                  <div
                                    className="flex justify-between mt-4"
                                    key={discount.id}
                                  >
                                    <div className="flex justify-between gap-4">
                                      <span>
                                        <TrashIcon
                                          className="h-5 w-5 text-red-600 hover:text-red-400 cursor-pointer"
                                          onClick={() =>
                                            removeCustomDiscount(discount.id)
                                          }
                                        />
                                      </span>
                                      {discount.description}
                                    </div>
                                    <div>{discount.amount.formatted}</div>
                                  </div>
                                );
                              },
                            )}
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  )}

                <Separator />

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

                <StatusButton
                  className="w-full"
                  onClick={createQuote}
                  status={loadingCreateQuote ? "loading" : "idle"}
                >
                  Create Quote
                </StatusButton>
                {error && (
                  <div className="p-4 mb-4 text-red-600 bg-red-100 border border-red-200 rounded-lg">
                    {error}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-5 py-20">
              <ShoppingBagIcon className="h-20 w-20" />
              <p className="font-medium text-lg">Your bag is empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
