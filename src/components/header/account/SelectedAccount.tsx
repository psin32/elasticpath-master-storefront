"use client";

import { Popover } from "@headlessui/react";
import { logout } from "../../../app/(auth)/actions";
import { useAuthedAccountMember } from "../../../react-shopper-hooks";
import { useFloating } from "@floating-ui/react";
import { ReactNode } from "react";
import { SwitchButton } from "./switch-button";

export function SelectedAccount({
  accountSwitcher,
  accountName,
}: {
  accountSwitcher: ReactNode;
  accountName: string;
}) {
  const { accountMemberTokens } = useAuthedAccountMember();

  const { refs, floatingStyles } = useFloating({
    placement: "bottom-end",
  });

  return (
    <>
      <Popover className="relative">
        {({ close }) => {
          async function logoutAction() {
            await logout();
            close();
          }

          return (
            <>
              <Popover.Button ref={refs.setReference}>
                <SwitchButton className="group w-full items-center rounded-md px-2 py-2 text-sm hover:bg-brand-primary hover:text-white transition-color ease-in-out duration-100 mt-1 bg-brand-highlight/10 min-w-44">
                  {accountName}
                </SwitchButton>
              </Popover.Button>
              <Popover.Panel
                className="mt-3"
                ref={refs.setFloating}
                style={floatingStyles}
              >
                <div className="w-52 rounded-xl bg-white text-sm leading-6 divide-y divide-gray-100 text-gray-900 shadow-lg ring-1 ring-gray-900/5">
                  {accountMemberTokens &&
                    Object.keys(accountMemberTokens).length > 1 && (
                      <div className="px-1 py-1">
                        <>
                          <span className="text-[0.625rem] uppercase font-medium px-2">
                            Use store as...
                          </span>
                          {accountSwitcher}
                        </>
                      </div>
                    )}
                </div>
              </Popover.Panel>
            </>
          );
        }}
      </Popover>
    </>
  );
}
