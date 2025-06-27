"use client";

import { useState, useEffect, useRef } from "react";
import { useCart } from "../../../react-shopper-hooks";
import { useFormContext } from "react-hook-form";
import { CheckoutForm as CheckoutFormSchemaType } from "../../../components/checkout/form-schema/checkout-form-schema";
import { Button } from "../../../components/button/Button";
import { Label } from "../../../components/label/Label";
import { Checkbox } from "../../../components/Checkbox";
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/select/Select";
import { useAuthedAccountMember } from "../../../react-shopper-hooks";
import { getEpccImplicitClient } from "../../../lib/epcc-implicit-client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { cartQueryKeys } from "../../../react-shopper-hooks/cart/hooks/use-get-cart";
import { accountAddressesQueryKeys } from "../../../react-shopper-hooks/account/hooks/use-account-addresses";
import { Dialog } from "@headlessui/react";
import { AddressForm } from "./AddressForm";
import { ProductThumbnail } from "../../(store)/account/orders/[orderId]/ProductThumbnail";

interface ShippingGroup {
  id: string;
  type: string;
  shipping_type: string;
  tracking_reference: string;
  shipping_price?: {
    total: number;
    base: number;
    tax: number;
    fees: number;
  };
  address: {
    first_name: string;
    last_name: string;
    phone_number?: string;
    company_name?: string;
    line_1: string;
    line_2?: string;
    city: string;
    postcode: string;
    county?: string;
    country: string;
    region?: string;
    instructions?: string;
  };
  delivery_estimate?: {
    start: string;
    end: string;
  };
  created_at: string;
  updated_at: string;
  items?: string[];
  meta?: {
    shipping_display_price: {
      total: {
        formatted: string;
      };
    };
  };
}

export function ShippingGroupManager() {
  const { state: cart } = useCart();
  const { getValues } = useFormContext<CheckoutFormSchemaType>();
  const { selectedAccountToken } = useAuthedAccountMember();
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [shippingGroups, setShippingGroups] = useState<ShippingGroup[]>([]);
  const [shippingType, setShippingType] = useState("standard");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedGroups = useRef(false);
  const [attachMode, setAttachMode] = useState(false);
  const [selectedGroupForAttach, setSelectedGroupForAttach] =
    useState<string>("");
  const [itemsToAttach, setItemsToAttach] = useState<string[]>([]);
  const [isAttaching, setIsAttaching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);

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
      setSelectedAddressId(accountAddresses[0].id);
    }
  }, [accountAddresses, selectedAddressId]);

  // Reset selected address if it's no longer in the list
  useEffect(() => {
    if (selectedAddressId && accountAddresses.length > 0) {
      const addressExists = accountAddresses.find(
        (addr) => addr.id === selectedAddressId,
      );
      if (!addressExists) {
        setSelectedAddressId(accountAddresses[0].id);
      }
    }
  }, [accountAddresses, selectedAddressId]);

  // Load existing shipping groups and addresses
  useEffect(() => {
    if (cart?.id) {
      loadShippingGroups();
    }
  }, [cart?.id, selectedAccountToken?.account_id]);

  // Update shipping groups when cart items change (only after groups are loaded)
  useEffect(() => {
    if (cart?.items && shippingGroups.length > 0 && hasLoadedGroups.current) {
      updateShippingGroupsWithItems();
    }
  }, [cart?.items]);

  const loadShippingGroups = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/carts/${cart?.id}/shipping-groups`);
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          // Map the API response to our local structure
          const groups: ShippingGroup[] = data.data.map((group: any) => ({
            id: group.id,
            type: group.type,
            shipping_type: group.shipping_type,
            tracking_reference: group.tracking_reference || "",
            shipping_price: group.shipping_price,
            address: group.address,
            delivery_estimate: group.delivery_estimate,
            created_at: group.created_at,
            updated_at: group.updated_at,
            items: [], // Will be populated by matching with cart items
            meta: group.meta,
          }));
          setShippingGroups(groups);
          hasLoadedGroups.current = true;

          // Update items immediately after loading groups
          if (cart?.items) {
            updateShippingGroupsWithItems();
          }
        }
      }
    } catch (error) {
      console.error("Error loading shipping groups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateShippingGroupsWithItems = () => {
    if (!cart?.items) return;

    setShippingGroups((prevGroups) =>
      prevGroups.map((group) => ({
        ...group,
        items: cart.items
          .filter((item) => item.shipping_group_id === group.id)
          .map((item) => item.id),
      })),
    );
  };

  const handleItemSelection = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    }
  };

  const getSelectedAddress = () => {
    return accountAddresses.find((addr) => addr.id === selectedAddressId);
  };

  const createShippingGroup = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item");
      return;
    }

    // Get shipping address from selected address or form
    let shippingAddress;

    if (selectedAddressId && accountAddresses.length > 0) {
      // Use selected address from address book
      const selectedAddress = getSelectedAddress();
      if (selectedAddress) {
        shippingAddress = {
          first_name: selectedAddress.first_name,
          last_name: selectedAddress.last_name,
          phone_number: selectedAddress.phone_number || "",
          company_name: selectedAddress.company_name || "",
          line_1: selectedAddress.line_1,
          line_2: selectedAddress.line_2 || "",
          city: selectedAddress.city,
          postcode: selectedAddress.postcode,
          county: selectedAddress.county || "",
          country: selectedAddress.country,
          region: selectedAddress.region || "",
          instructions: selectedAddress.instructions || "",
        };
      }
    } else {
      // Use address from form
      const formValues = getValues();
      shippingAddress = formValues.shippingAddress;
    }

    if (!shippingAddress) {
      toast.error(
        "Please select an address or fill in the shipping address first",
      );
      return;
    }

    // Validate required address fields
    const requiredFields = [
      "first_name",
      "last_name",
      "line_1",
      "city",
      "postcode",
      "country",
    ];
    const missingFields = requiredFields.filter(
      (field) => !shippingAddress[field as keyof typeof shippingAddress],
    );

    if (missingFields.length > 0) {
      toast.error(
        `Please fill in the following fields: ${missingFields.join(", ")}`,
      );
      return;
    }

    setIsCreating(true);
    try {
      // Prepare shipping group request with all required fields
      const shippingGroupRequest = {
        type: "shipping_group",
        shipping_type: shippingType,
        shipping_price: {
          total: 0,
          base: 0,
          tax: 0,
          fees: 0,
          discount: 0,
        },
        address: {
          first_name: shippingAddress.first_name,
          last_name: shippingAddress.last_name,
          phone_number: shippingAddress.phone_number || "",
          company_name: shippingAddress.company_name || "",
          line_1: shippingAddress.line_1,
          line_2: shippingAddress.line_2 || "",
          city: shippingAddress.city,
          postcode: shippingAddress.postcode,
          county: shippingAddress.county || "",
          country: shippingAddress.country,
          region: shippingAddress.region || "",
          instructions: shippingAddress.instructions || "",
        },
        includes_tax: true,
        delivery_estimate: {
          start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        },
      };

      // Create shipping group
      const groupResponse = await fetch(
        `/api/carts/${cart?.id}/shipping-groups`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(shippingGroupRequest),
        },
      );

      if (!groupResponse.ok) {
        const errorData = await groupResponse.json();
        throw new Error(errorData.error || "Failed to create shipping group");
      }

      const groupData = await groupResponse.json();
      const newGroup: ShippingGroup = {
        id: groupData.data.id,
        type: groupData.data.type,
        shipping_type: groupData.data.shipping_type,
        tracking_reference: groupData.data.tracking_reference || "",
        meta: groupData.data.meta,
        address: groupData.data.address,
        delivery_estimate: groupData.data.delivery_estimate,
        created_at: groupData.data.created_at,
        updated_at: groupData.data.updated_at,
        items: selectedItems,
      };

      // Associate items with the shipping group
      const updatePromises = selectedItems.map((itemId) =>
        fetch(`/api/carts/${cart?.id}/items/${itemId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shipping_group_id: groupData.data.id,
          }),
        }),
      );

      await Promise.all(updatePromises);

      // Invalidate cart query to refresh the cart state
      if (cart?.id) {
        await queryClient.invalidateQueries({
          queryKey: cartQueryKeys.detail(cart.id),
        });
      }

      // Update local shipping groups state with the new group
      setShippingGroups((prevGroups) => [...prevGroups, newGroup]);

      // Reset form state
      setSelectedItems([]);
      setShowCreateForm(false);

      toast.success(`Shipping group created successfully`);
    } catch (error) {
      console.error("Error creating shipping group:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create shipping group",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const removeFromGroup = async (groupId: string, itemId: string) => {
    try {
      const response = await fetch(`/api/carts/${cart?.id}/items/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shipping_group_id: "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update cart item");
      }

      const result = await response.json();

      // Invalidate cart query to refresh the cart state
      if (cart?.id) {
        await queryClient.invalidateQueries({
          queryKey: cartQueryKeys.detail(cart.id),
        });
      }

      // Update local shipping groups state
      setShippingGroups((groups) =>
        groups
          .map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  items: group.items?.filter((id) => id !== itemId) || [],
                }
              : group,
          )
          .filter((group) => (group.items?.length || 0) > 0),
      );

      toast.success("Item removed from shipping group");
    } catch (error) {
      console.error("Error removing item from group:", error);
      toast.error("Failed to remove item from group");
    }
  };

  const deleteShippingGroup = async (groupId: string) => {
    try {
      // Get all items in this group
      const groupItems = getItemsForGroup(groupId);

      // Remove shipping_group_id from all items in this group
      const updatePromises = groupItems.map((item) =>
        fetch(`/api/carts/${cart?.id}/items/${item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shipping_group_id: "",
          }),
        }),
      );

      await Promise.all(updatePromises);

      // Delete the shipping group
      const deleteResponse = await fetch(
        `/api/carts/${cart?.id}/shipping-groups/${groupId}`,
        {
          method: "DELETE",
        },
      );

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        throw new Error(errorData.error || "Failed to delete shipping group");
      }

      // Invalidate cart query to refresh the cart state
      if (cart?.id) {
        await queryClient.invalidateQueries({
          queryKey: cartQueryKeys.detail(cart.id),
        });
      }

      // Remove the group from local state
      setShippingGroups((groups) =>
        groups.filter((group) => group.id !== groupId),
      );

      toast.success("Shipping group deleted successfully");
    } catch (error) {
      console.error("Error deleting shipping group:", error);
      toast.error("Failed to delete shipping group");
    }
  };

  const attachItemsToGroup = async () => {
    if (itemsToAttach.length === 0 || !selectedGroupForAttach) {
      toast.error("Please select items and a shipping group");
      return;
    }

    setIsAttaching(true);
    try {
      // Attach items to the selected shipping group
      const updatePromises = itemsToAttach.map((itemId) =>
        fetch(`/api/carts/${cart?.id}/items/${itemId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shipping_group_id: selectedGroupForAttach,
          }),
        }),
      );

      await Promise.all(updatePromises);

      // Invalidate cart query to refresh the cart state
      if (cart?.id) {
        await queryClient.invalidateQueries({
          queryKey: cartQueryKeys.detail(cart.id),
        });
      }

      // Update local shipping groups state to add items to the selected group
      setShippingGroups((groups) =>
        groups.map((group) =>
          group.id === selectedGroupForAttach
            ? {
                ...group,
                items: [...(group.items || []), ...itemsToAttach],
              }
            : group,
        ),
      );

      // Reset attach mode
      setAttachMode(false);
      setSelectedGroupForAttach("");
      setItemsToAttach([]);

      toast.success("Items attached to shipping group successfully");
    } catch (error) {
      console.error("Error attaching items to group:", error);
      toast.error("Failed to attach items to group");
    } finally {
      setIsAttaching(false);
    }
  };

  const handleItemSelectionForAttach = (itemId: string, checked: boolean) => {
    if (checked) {
      setItemsToAttach([...itemsToAttach, itemId]);
    } else {
      setItemsToAttach(itemsToAttach.filter((id) => id !== itemId));
    }
  };

  const getItemsNotInGroups = () => {
    const itemsInGroups = shippingGroups.flatMap((group) => group.items || []);
    return (
      cart?.items?.filter((item) => !itemsInGroups.includes(item.id)) || []
    );
  };

  const formatAddress = (address: any) => {
    const parts = [
      address.line_1,
      address.line_2,
      address.city,
      address.region,
      address.postcode,
      address.country,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const getItemsForGroup = (groupId: string) => {
    return (
      cart?.items?.filter((item) => item.shipping_group_id === groupId) || []
    );
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

      // Invalidate the query to refresh the address list
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
      setIsAddressDialogOpen(false);
      toast.success("Address saved successfully");
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Shipping Groups</h2>
          <p className="text-gray-600">
            Organize your cart items into shipping groups
          </p>
        </div>
        <div className="flex space-x-2">
          {shippingGroups.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => {
                setAttachMode(!attachMode);
                if (attachMode) {
                  setSelectedGroupForAttach("");
                  setItemsToAttach([]);
                }
              }}
            >
              {attachMode ? "Cancel Attach" : "Attach Items"}
            </Button>
          )}
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            variant={showCreateForm ? "secondary" : "primary"}
          >
            {showCreateForm ? "Cancel" : "Create New Group"}
          </Button>
        </div>
      </div>

      {/* Create New Group */}
      {showCreateForm && (
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Create New Shipping Group</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shippingType">Shipping Type</Label>
                <Select value={shippingType} onValueChange={setShippingType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select shipping type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="express">Express</SelectItem>
                    <SelectItem value="overnight">Overnight</SelectItem>
                    <SelectItem value="economy">Economy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedAccountToken?.account_id && (
                <div>
                  <Label htmlFor="addressSelect">Shipping Address</Label>
                  <Select
                    value={selectedAddressId}
                    onValueChange={(value) => {
                      if (value === "new") {
                        setIsAddressDialogOpen(true);
                      } else {
                        setSelectedAddressId(value);
                      }
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select an address" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountAddresses.map((address) => (
                        <SelectItem key={address.id} value={address.id}>
                          {address.name ||
                            `${address.first_name} ${address.last_name}`}{" "}
                          - {address.line_1}, {address.city}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="new"
                        className="text-blue-600 font-medium"
                      >
                        + Add New Address
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {selectedAddressId && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium">
                  {getSelectedAddress()?.name ||
                    `${getSelectedAddress()?.first_name} ${getSelectedAddress()?.last_name}`}
                </p>
                <p>{getSelectedAddress()?.line_1}</p>
                {getSelectedAddress()?.line_2 && (
                  <p>{getSelectedAddress()?.line_2}</p>
                )}
                <p>
                  {getSelectedAddress()?.city}, {getSelectedAddress()?.region}{" "}
                  {getSelectedAddress()?.postcode}
                </p>
                <p>{getSelectedAddress()?.country}</p>
              </div>
            )}

            <div>
              <Label className="mb-2 block">Select Items</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                {getItemsNotInGroups().map((item) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`item-${item.id}`}
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) =>
                        handleItemSelection(item.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={`item-${item.id}`} className="text-sm">
                      {item.name} (Qty: {item.quantity})
                    </Label>
                  </div>
                ))}
                {getItemsNotInGroups().length === 0 && (
                  <p className="text-sm text-gray-500 col-span-full">
                    All items are already in shipping groups
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={createShippingGroup}
              disabled={isCreating || selectedItems.length === 0}
              className="w-full"
            >
              {isCreating ? "Creating..." : "Create Shipping Group"}
            </Button>
          </div>
        </div>
      )}

      {/* Attach to Existing Group */}
      {attachMode && shippingGroups.length > 0 && (
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">
              Attach Items to Existing Group
            </h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="groupSelect">Select Shipping Group</Label>
                <Select
                  value={selectedGroupForAttach}
                  onValueChange={setSelectedGroupForAttach}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a shipping group" />
                  </SelectTrigger>
                  <SelectContent>
                    {shippingGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.shipping_type} - {group.address.city},{" "}
                        {group.address.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Select Items to Attach</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                {getItemsNotInGroups().map((item) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`attach-item-${item.id}`}
                      checked={itemsToAttach.includes(item.id)}
                      onCheckedChange={(checked) =>
                        handleItemSelectionForAttach(
                          item.id,
                          checked as boolean,
                        )
                      }
                    />
                    <Label
                      htmlFor={`attach-item-${item.id}`}
                      className="text-sm"
                    >
                      {item.name} (Qty: {item.quantity})
                    </Label>
                  </div>
                ))}
                {getItemsNotInGroups().length === 0 && (
                  <p className="text-sm text-gray-500 col-span-full">
                    All items are already in shipping groups
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={attachItemsToGroup}
              disabled={
                isAttaching ||
                itemsToAttach.length === 0 ||
                !selectedGroupForAttach
              }
              className="w-full"
            >
              {isAttaching ? "Attaching..." : "Attach to Group"}
            </Button>
          </div>
        </div>
      )}

      {/* Existing Groups */}
      {isLoading ? (
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="py-8">
            <p className="text-center text-gray-500">
              Loading shipping groups...
            </p>
          </div>
        </div>
      ) : shippingGroups.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Existing Shipping Groups</h3>
          <div className="flex flex-col gap-6 w-full">
            {shippingGroups.map((group) => {
              const groupItems = getItemsForGroup(group.id);
              return (
                <div
                  key={group.id}
                  className="rounded-2xl border border-gray-200 bg-white shadow-sm mb-6"
                >
                  <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-brand-primary">
                          Shipping Group
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(group.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>
                          Type:{" "}
                          <span className="font-medium text-black">
                            {group.shipping_type}
                          </span>
                        </span>
                        {group.meta?.shipping_display_price?.total
                          ?.formatted && (
                          <span>
                            Shipping:{" "}
                            <span className="font-medium text-black">
                              {
                                group.meta?.shipping_display_price.total
                                  .formatted
                              }
                            </span>
                          </span>
                        )}
                        {group.tracking_reference && (
                          <span>
                            Tracking:{" "}
                            <span className="font-medium text-black">
                              {group.tracking_reference}
                            </span>
                          </span>
                        )}
                        <span>
                          {group.address.first_name} {group.address.last_name},{" "}
                          {[
                            group.address.line_1,
                            group.address.line_2,
                            group.address.city,
                            group.address.region,
                            group.address.postcode,
                            group.address.country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => deleteShippingGroup(group.id)}
                      className="text-red-600 hover:text-red-700 text-xs"
                      title="Delete shipping group"
                    >
                      Delete Group
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-0 divide-y divide-gray-100">
                    {groupItems.length > 0 ? (
                      groupItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 py-4 px-6 my-4"
                        >
                          <div className="w-16 sm:w-20 min-h-[6.25rem] flex-shrink-0">
                            <ProductThumbnail productId={item.product_id} />
                          </div>
                          <div className="flex flex-col flex-1">
                            <span className="font-medium text-base">
                              {item.name}
                            </span>
                            <span className="text-sm text-black/60">
                              Quantity: {item.quantity}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="small"
                            onClick={() => removeFromGroup(group.id, item.id)}
                            className="text-red-600 hover:text-red-700 text-xs ml-2"
                          >
                            Remove from this group
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 p-4">
                        No items assigned to this group
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="py-8">
            <p className="text-center text-gray-500">
              No shipping groups created yet
            </p>
          </div>
        </div>
      )}

      {/* Address Dialog */}
      <Dialog
        open={isAddressDialogOpen}
        onClose={() => setIsAddressDialogOpen(false)}
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
                  onClick={() => setIsAddressDialogOpen(false)}
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
