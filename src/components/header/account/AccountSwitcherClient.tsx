"use client";

import { selectedAccount } from "../../../app/(auth)/actions";
import { CheckCircleIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { SwitchButton } from "./switch-button";
import { AccountMemberCredential } from "../../../app/(auth)/account-member-credentials-schema";

interface AccountSwitcherClientProps {
  accounts: Record<string, AccountMemberCredential>;
  selectedAccountId: string;
}

export function AccountSwitcherClient({
  accounts,
  selectedAccountId,
}: AccountSwitcherClientProps) {
  return Object.keys(accounts).map((tokenKey) => {
    const value = accounts[tokenKey];
    const Icon =
      selectedAccountId === value.account_id ? CheckCircleIcon : UserCircleIcon;
    const isSelected = selectedAccountId === value.account_id;
    const isAccountChanging = selectedAccountId !== value.account_id;

    return (
      <form
        key={value.account_id}
        action={async (formData: FormData) => {
          if (isAccountChanging) {
            await selectedAccount(formData);
            // Redirect to home page after account change using window.location for reliable redirect
            window.location.href = "/";
          }
        }}
      >
        <input
          id="accountId"
          readOnly
          name="accountId"
          type="text"
          className="hidden"
          value={value.account_id}
        />
        <SwitchButton
          type="submit"
          className={`${
            isSelected ? "bg-brand-highlight/10" : "text-gray-900"
          } group flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-brand-primary hover:text-white transition-color ease-in-out duration-100`}
          icon={<Icon className="mr-2 h-5 w-5" aria-hidden="true" />}
        >
          {value.account_name}
        </SwitchButton>
      </form>
    );
  });
}
