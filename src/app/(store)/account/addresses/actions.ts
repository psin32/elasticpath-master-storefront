"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { getServerSideImplicitClient } from "../../../../lib/epcc-server-side-implicit-client";
import {
  getSelectedAccount,
  retrieveAccountMemberCredentials,
} from "../../../../lib/retrieve-account-member-credentials";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../../lib/cookie-constants";
import { revalidatePath } from "next/cache";
import { shippingAddressSchema } from "../../../../components/checkout/form-schema/checkout-form-schema";
import { AccountAddress, Resource } from "@moltin/sdk";
import { redirect } from "next/navigation";

const deleteAddressSchema = z.object({
  addressId: z.string(),
});

const updateAddressSchema = shippingAddressSchema.merge(
  z.object({
    name: z.string(),
    addressId: z.string(),
    line_2: z
      .string()
      .optional()
      .transform((e) => (e === "" ? undefined : e)),
  }),
);

const addAddressSchema = shippingAddressSchema.merge(
  z.object({
    name: z.string(),
    line_2: z
      .string()
      .optional()
      .transform((e) => (e === "" ? undefined : e)),
  }),
);

export async function deleteAddress(formData: FormData) {
  const client = getServerSideImplicitClient();
  const rawEntries = Object.fromEntries(formData.entries());
  const validatedFormData = deleteAddressSchema.safeParse(rawEntries);

  if (!validatedFormData.success) {
    throw new Error("Invalid address id");
  }

  const accountMemberCreds = retrieveAccountMemberCredentials(
    cookies(),
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  if (!accountMemberCreds) {
    throw new Error("Account member credentials not found");
  }

  const { addressId } = validatedFormData.data;
  const selectedAccount = getSelectedAccount(accountMemberCreds);

  try {
    await client.AccountAddresses.Delete({account: selectedAccount.account_id, address: addressId})
    revalidatePath("/accounts/addresses");
  } catch (error) {
    console.error(error);
    throw new Error("Error deleting address");
  }
}

export async function updateAddress(formData: FormData) {
  const client = getServerSideImplicitClient();

  const rawEntries = Object.fromEntries(formData.entries());

  const validatedFormData = updateAddressSchema.safeParse(rawEntries);

  if (!validatedFormData.success) {
    console.error(JSON.stringify(validatedFormData.error));
    throw new Error("Invalid address submission");
  }

  const accountMemberCreds = retrieveAccountMemberCredentials(
    cookies(),
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  if (!accountMemberCreds) {
    throw new Error("Account member credentials not found");
  }

  const selectedAccount = getSelectedAccount(accountMemberCreds);
  const { addressId, ...addressData } = validatedFormData.data;

  const body: any = {
    type: "address",
    id: addressId,
    ...addressData,
  };

  
  try {
    await client.AccountAddresses.Update({ account: selectedAccount.account_id, address: addressId, body: body })
    revalidatePath("/accounts/addresses");
  } catch (error) {
    console.error(error);
    throw new Error("Error updating address");
  }
}

export async function addAddress(formData: FormData) {
  const client = getServerSideImplicitClient();
  const rawEntries = Object.fromEntries(formData.entries());
  const validatedFormData = addAddressSchema.safeParse(rawEntries);

  if (!validatedFormData.success) {
    console.error(JSON.stringify(validatedFormData.error));
    throw new Error("Invalid address submission");
  }

  const accountMemberCreds = retrieveAccountMemberCredentials(
    cookies(),
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  if (!accountMemberCreds) {
    throw new Error("Account member credentials not found");
  }

  const selectedAccount = getSelectedAccount(accountMemberCreds);
  const { ...addressData } = validatedFormData.data;

  const body: any = {
      type: "address",
      ...addressData,
  };

  let redirectUrl: string | undefined = undefined;
  try {
    const result = (await client.AccountAddresses.Create({account: selectedAccount.account_id, body: body})) as Resource<AccountAddress>;
    redirectUrl = `/account/addresses/${result.data.id}`;
  } catch (error) {
    console.error(error);
    throw new Error("Error adding address");
  }

  revalidatePath("/account/addresses");
  redirect(redirectUrl);
}
