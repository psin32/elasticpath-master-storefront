"use client";
import { Popover } from "@headlessui/react";
import {
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  MapPinIcon,
  UserCircleIcon,
  UserIcon,
  UserPlusIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  ArrowPathRoundedSquareIcon,
  PencilSquareIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { logout } from "../../../app/(auth)/actions";
import { useAuthedAccountMember } from "../../../react-shopper-hooks";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { useFloating } from "@floating-ui/react";
import { useSession } from "next-auth/react";

export function AccountMenu() {
  const router = useRouter();
  const { data } = useAuthedAccountMember();
  const { data: session, status } = useSession();

  const pathname = usePathname();

  const isAccountAuthed = !!data;

  const { refs, floatingStyles } = useFloating({
    placement: "bottom-end",
  });

  return (
    <Popover className="relative">
      {({ close }) => {
        async function logoutAction() {
          await logout();
          session?.user &&
            status == "authenticated" &&
            router.push("/admin/dashboard");
          close();
        }

        return (
          <>
            <Popover.Button
              ref={refs.setReference}
              className="nav-button-container inline-flex w-full justify-center rounded-md px-4 py-2 text-sm font-medium text-black"
            >
              <UserIcon
                className={clsx(
                  "h-6 w-6",
                  isAccountAuthed && "fill-brand-primary/20",
                )}
                aria-hidden="true"
              />
            </Popover.Button>
            <Popover.Panel
              className="mt-3"
              ref={refs.setFloating}
              style={floatingStyles}
            >
              <div className="w-52 rounded-xl bg-white text-sm leading-6 divide-y divide-gray-100 text-gray-900 shadow-lg ring-1 ring-gray-900/5">
                <div className="px-1 py-1">
                  {!isAccountAuthed && (
                    <>
                      <div>
                        <Popover.Button
                          as={Link}
                          href={`/login?returnUrl=${pathname}`}
                          className={`${
                            pathname.startsWith("/login")
                              ? "font-semibold"
                              : "text-gray-900"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-brand-primary hover:text-white transition-color ease-in-out duration-100`}
                        >
                          <ArrowRightOnRectangleIcon
                            className="mr-2 h-5 w-5"
                            aria-hidden="true"
                          />
                          Login
                        </Popover.Button>
                      </div>
                      <div>
                        <Popover.Button
                          as={Link}
                          href="/register"
                          className={`${
                            pathname.startsWith("/register")
                              ? "font-semibold"
                              : "text-gray-900"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-brand-primary hover:text-white transition-color ease-in-out duration-100`}
                        >
                          <UserPlusIcon
                            className="mr-2 h-5 w-5"
                            aria-hidden="true"
                          />
                          Register
                        </Popover.Button>
                      </div>
                    </>
                  )}
                  {isAccountAuthed && (
                    <>
                      <div>
                        <Popover.Button
                          as={Link}
                          href="/account/summary"
                          className={`${
                            pathname.startsWith("/account/summary")
                              ? "font-semibold"
                              : "text-gray-900"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-brand-primary hover:text-white transition-color ease-in-out duration-100`}
                        >
                          <UserCircleIcon
                            className="mr-2 h-5 w-5"
                            aria-hidden="true"
                          />
                          My Account
                        </Popover.Button>
                      </div>
                      <div>
                        <Popover.Button
                          as={Link}
                          href="/manage-carts"
                          className={`${
                            pathname.startsWith("/manage-carts")
                              ? "font-semibold"
                              : "text-gray-900"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-brand-primary hover:text-white transition-color ease-in-out duration-100`}
                        >
                          <ShoppingBagIcon
                            className="mr-2 h-5 w-5"
                            aria-hidden="true"
                          />
                          Manage Carts
                        </Popover.Button>
                      </div>
                      <div>
                        <Popover.Button
                          as={Link}
                          href="/shared-lists"
                          className={`${
                            pathname.startsWith("/shared-lists")
                              ? "font-semibold"
                              : "text-gray-900"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-brand-primary hover:text-white transition-color ease-in-out duration-100`}
                        >
                          <RectangleStackIcon
                            className="mr-2 h-5 w-5"
                            aria-hidden="true"
                          />
                          Shared Lists
                        </Popover.Button>
                      </div>
                      <div>
                        <Popover.Button
                          as={Link}
                          href="/account/orders"
                          className={`${
                            pathname.startsWith("/account/orders")
                              ? "font-semibold"
                              : "text-gray-900"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-brand-primary hover:text-white transition-color ease-in-out duration-100`}
                        >
                          <ClipboardDocumentListIcon
                            className="mr-2 h-5 w-5"
                            aria-hidden="true"
                          />
                          Orders
                        </Popover.Button>
                      </div>
                      <div>
                        <Popover.Button
                          as={Link}
                          href="/quotes"
                          className={`${
                            pathname.startsWith("/quotes")
                              ? "font-semibold"
                              : "text-gray-900"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-brand-primary hover:text-white transition-color ease-in-out duration-100`}
                        >
                          <PencilSquareIcon
                            className="mr-2 h-5 w-5"
                            aria-hidden="true"
                          />
                          Quotes
                        </Popover.Button>
                      </div>
                      <div>
                        <Popover.Button
                          as={Link}
                          href="/account/subscriptions"
                          className={`${
                            pathname.startsWith("/account/subscriptions")
                              ? "font-semibold"
                              : "text-gray-900"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-brand-primary hover:text-white transition-color ease-in-out duration-100`}
                        >
                          <ArrowPathRoundedSquareIcon
                            className="mr-2 h-5 w-5"
                            aria-hidden="true"
                          />
                          Subscription
                        </Popover.Button>
                      </div>
                      <div>
                        <Popover.Button
                          as={Link}
                          href="/account/cards"
                          className={`${
                            pathname.startsWith("/account/cards")
                              ? "font-semibold"
                              : "text-gray-900"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-brand-primary hover:text-white transition-color ease-in-out duration-100`}
                        >
                          <CreditCardIcon
                            className="mr-2 h-5 w-5"
                            aria-hidden="true"
                          />
                          Cards
                        </Popover.Button>
                      </div>
                      <div>
                        <Popover.Button
                          as={Link}
                          href="/account/addresses"
                          className={`${
                            pathname.startsWith("/account/addresses")
                              ? "font-semibold"
                              : "text-gray-900"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-brand-primary hover:text-white transition-color ease-in-out duration-100`}
                        >
                          <MapPinIcon
                            className="mr-2 h-5 w-5"
                            aria-hidden="true"
                          />
                          Addresses
                        </Popover.Button>
                      </div>
                      <div>
                        <form action={logoutAction}>
                          <button
                            type="submit"
                            className={`${
                              pathname.startsWith("/logout")
                                ? "font-semibold"
                                : "text-gray-900"
                            } group flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-brand-primary hover:text-white transition-color ease-in-out duration-100`}
                          >
                            <ArrowLeftOnRectangleIcon
                              className="mr-2 h-5 w-5"
                              aria-hidden="true"
                            />
                            {session?.user && status == "authenticated"
                              ? "Back To Admin"
                              : "Logout"}
                          </button>
                        </form>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Popover.Panel>
          </>
        );
      }}
    </Popover>
  );
}
