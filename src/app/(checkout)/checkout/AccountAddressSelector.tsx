"use client";

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { CheckoutForm as CheckoutFormSchemaType } from "../../../components/checkout/form-schema/checkout-form-schema";
import { useAuthedAccountMember } from "../../../react-shopper-hooks";
import { getEpccImplicitClient } from "../../../lib/epcc-implicit-client";
import { AccountAddress } from "@elasticpath/js-sdk";
import { Button } from "../../../components/button/Button";
import { AddressForm } from "./AddressForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/select/Select";
import { toast } from "react-toastify";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { accountAddressesQueryKeys } from "../../../react-shopper-hooks/account/hooks/use-account-addresses";
import { Dialog } from "@headlessui/react";

export function AccountAddressSelector() {
  const { control, setValue, getValues } =
    useFormContext<CheckoutFormSchemaType>();
  const { selectedAccountToken } = useAuthedAccountMember();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const client = getEpccImplicitClient();

  // Use React Query to fetch account addresses
  const { data: accountAddressesData } = useQuery({
    queryKey: selectedAccountToken?.account_id
      ? [
          ...accountAddressesQueryKeys.list({
            accountId: selectedAccountToken.account_id,
          }),
        ]
      : ["no-account"],
    queryFn: async () => {
      if (!selectedAccountToken?.account_id) return { data: [] };
      const client = getEpccImplicitClient();
      return client.AccountAddresses.All({
        account: selectedAccountToken.account_id,
      });
    },
    enabled: !!selectedAccountToken?.account_id,
  });

  const accountAddresses = accountAddressesData?.data || [];

  // Auto-select first address when addresses are loaded
  useEffect(() => {
    if (accountAddresses.length > 0 && !selectedAddressId) {
      const firstAddress = accountAddresses[0];
      setSelectedAddressId(firstAddress.id);
      updateFormWithAddress(firstAddress);
    } else if (accountAddresses.length === 0) {
      setIsSheetOpen(true);
    }
    setIsLoading(false);
  }, [accountAddresses, selectedAddressId]);

  const updateFormWithAddress = (address: AccountAddress) => {
    setValue("shippingAddress", {
      first_name: address.first_name || "",
      last_name: address.last_name || "",
      company_name: address.company_name || "",
      line_1: address.line_1 || "",
      line_2: address.line_2 || "",
      city: address.city || "",
      county: address.county || "",
      region: address.region || "",
      postcode: address.postcode || "",
      country: address.country || "",
      phone_number: address.phone_number || "",
      instructions: address.instructions || "",
    });
  };

  const handleAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId);
    if (addressId === "new") {
      setIsSheetOpen(true);
      // Clear the form
      setValue("shippingAddress", {
        first_name: "",
        last_name: "",
        company_name: "",
        line_1: "",
        line_2: "",
        city: "",
        county: "",
        region: "",
        postcode: "",
        country: "",
        phone_number: "",
        instructions: "",
      });
    } else {
      const selectedAddress = accountAddresses.find(
        (addr) => addr.id === addressId,
      );
      if (selectedAddress) {
        updateFormWithAddress(selectedAddress);
      }
    }
  };

  const handleSaveNewAddress = async () => {
    if (!selectedAccountToken?.account_id) {
      toast.error("No account found");
      return;
    }

    const formValues = getValues();
    const shippingAddress = formValues.shippingAddress;

    if (
      !shippingAddress?.first_name ||
      !shippingAddress?.line_1 ||
      !shippingAddress?.city ||
      !shippingAddress?.postcode ||
      !shippingAddress?.country
    ) {
      toast.error("Please fill in all required address fields");
      return;
    }

    try {
      const newAddress = await client.AccountAddresses.Create({
        account: selectedAccountToken.account_id,
        body: {
          type: "account-address",
          first_name: shippingAddress.first_name,
          last_name: shippingAddress.last_name || "",
          company_name: shippingAddress.company_name || "",
          line_1: shippingAddress.line_1,
          line_2: shippingAddress.line_2 || "",
          city: shippingAddress.city,
          county: shippingAddress.county || "",
          region: shippingAddress.region || "",
          postcode: shippingAddress.postcode,
          country: shippingAddress.country,
          phone_number: shippingAddress.phone_number || "",
          instructions: shippingAddress.instructions || "",
        },
      });

      // Add the new address to the list
      queryClient.setQueryData(
        selectedAccountToken?.account_id
          ? [
              ...accountAddressesQueryKeys.list({
                accountId: selectedAccountToken.account_id,
              }),
            ]
          : ["no-account"],
        (oldData: any) => {
          if (oldData.data) {
            return {
              ...oldData,
              data: [...oldData.data, newAddress.data],
            };
          }
          return { data: [newAddress.data] };
        },
      );

      // Invalidate the query to ensure all components are refreshed
      await queryClient.invalidateQueries({
        queryKey: selectedAccountToken?.account_id
          ? [
              ...accountAddressesQueryKeys.list({
                accountId: selectedAccountToken.account_id,
              }),
            ]
          : ["no-account"],
      });

      setSelectedAddressId(newAddress.data.id);
      setIsSheetOpen(false);
      toast.success("Address saved successfully");
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-5">Loading addresses...</div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex justify-between items-center">
        <span className="text-2xl font-medium">Shipping Address</span>
        <Button
          variant="secondary"
          size="small"
          onClick={() => setIsSheetOpen(true)}
        >
          Add New Address
        </Button>
      </div>

      {/* Dialog for new address form */}
      <Dialog
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        className="relative z-10"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6">
            <div className="space-y-4">
              <AddressForm addressField="shippingAddress" />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setIsSheetOpen(false)}
                >
                  Cancel
                </Button>
                <Button size="small" onClick={handleSaveNewAddress}>
                  Save Address
                </Button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
