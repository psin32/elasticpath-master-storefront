"use client";

import {
  useAuthedAccountMember,
  useAccountMembers,
} from "../../../react-shopper-hooks";
import { Button } from "../../../components/button/Button";
import { FormControl, FormField } from "../../../components/form/Form";
import { Input } from "../../../components/input/Input";
import React, { useEffect, useTransition, useState } from "react";
import { useFormContext } from "react-hook-form";
import { CheckoutForm as CheckoutFormSchemaType } from "../../../components/checkout/form-schema/checkout-form-schema";
import { logout } from "../../(auth)/actions";
import { Skeleton } from "../../../components/skeleton/Skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/select/Select";
import { AccountMember } from "@elasticpath/js-sdk";

export function AccountDisplay() {
  const {
    data: accountMember,
    selectedAccountToken,
    accountMemberTokens,
  } = useAuthedAccountMember();
  const accountId = selectedAccountToken?.account_id;

  // Show account tags dropdown only when there are multiple accounts
  const hasMultipleAccounts =
    accountMemberTokens && Object.keys(accountMemberTokens).length > 1;

  const { control, setValue } = useFormContext<CheckoutFormSchemaType>();

  const [isPending, startTransition] = useTransition();
  const [selectedAccountMemberId, setSelectedAccountMemberId] = useState<
    string | undefined
  >(accountMember?.id);

  // Fetch all account members for the selected account
  const {
    data: accountMembersData,
    isLoading: isLoadingMembers,
    error: accountMembersError,
  } = useAccountMembers(accountId || "", {
    enabled: !!accountId && !!selectedAccountToken?.token,
  });

  // Extract account members from the response
  // accountMembersData could be the ResourcePage object or directly the data array
  let accountMembers: AccountMember[] = [];
  if (Array.isArray(accountMembersData)) {
    accountMembers = accountMembersData as AccountMember[];
  } else if (
    accountMembersData &&
    typeof accountMembersData === "object" &&
    "data" in accountMembersData
  ) {
    const data = (accountMembersData as { data?: AccountMember[] }).data;
    accountMembers = (data as AccountMember[]) || [];
  }
  const hasMultipleMembers = accountMembers.length > 1;

  // Set initial selected account member when account members are loaded
  useEffect(() => {
    if (
      accountMember?.id &&
      !selectedAccountMemberId &&
      accountMembers.length > 0
    ) {
      // Check if logged-in member exists in the list, otherwise use first member
      const loggedInMember = accountMembers.find(
        (member: AccountMember) => member.id === accountMember.id,
      );
      setSelectedAccountMemberId(loggedInMember?.id || accountMembers[0]?.id);
    }
  }, [accountMember?.id, accountMembers, selectedAccountMemberId]);

  // Update form values when account member changes
  useEffect(() => {
    const selectedMember = accountMembers.find(
      (member: AccountMember) => member.id === selectedAccountMemberId,
    );
    if (selectedMember?.email && selectedMember?.name) {
      setValue("account", {
        email: selectedMember.email,
        name: selectedMember.name,
      });
    } else if (accountMember?.email && accountMember?.name) {
      // Fallback to logged-in account member
      setValue("account", {
        email: accountMember.email,
        name: accountMember.name,
      });
    }
  }, [selectedAccountMemberId, accountMembers, accountMember, setValue]);

  const handleAccountMemberChange = (value: string) => {
    setSelectedAccountMemberId(value);
  };

  const selectedMember =
    accountMembers.find((member) => member.id === selectedAccountMemberId) ||
    accountMember;

  return (
    <div className="flex flex-col gap-4 p-5 border border-black/10 rounded-md">
      <div className="flex flex-row flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col flex-1">
          {isLoadingMembers || !selectedMember ? (
            <div className="flex flex-col gap-1 pr-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : (
            <>
              {hasMultipleAccounts && hasMultipleMembers ? (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Select Account Member
                  </label>
                  <Select
                    value={selectedAccountMemberId || ""}
                    onValueChange={handleAccountMemberChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select account member">
                        {selectedMember
                          ? `${selectedMember.name} (${selectedMember.email})`
                          : "Select account member"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {accountMembers.map((member: AccountMember) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{member.name}</span>
                            <span className="text-sm text-gray-500">
                              {member.email}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <>
                  <span>{selectedMember?.name}</span>
                  <span>{selectedMember?.email}</span>
                </>
              )}
            </>
          )}
        </div>
        <Button
          variant="link"
          className="text-sm font-normal underline flex-none p-0 self-start"
          onClick={() => startTransition(() => logout())}
        >
          Sign Out
        </Button>
      </div>
      {selectedMember && (
        <>
          <FormField
            control={control}
            defaultValue={selectedMember?.email}
            name="account.email"
            render={({ field }) => (
              <FormControl>
                <Input
                  className="hidden"
                  {...field}
                  hidden
                  aria-label="Email Address"
                />
              </FormControl>
            )}
          />
          <FormField
            control={control}
            defaultValue={selectedMember?.name}
            name="account.name"
            render={({ field }) => (
              <FormControl>
                <Input className="hidden" {...field} hidden aria-label="Name" />
              </FormControl>
            )}
          />
        </>
      )}
    </div>
  );
}
