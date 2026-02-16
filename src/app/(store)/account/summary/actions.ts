"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { getServerSideImplicitClient } from "../../../../lib/epcc-server-side-implicit-client";
import {
  getSelectedAccount,
  retrieveAccountMemberCredentials,
} from "../../../../lib/retrieve-account-member-credentials";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../../lib/cookie-constants";
import { COOKIE_PREFIX_KEY } from "../../../../lib/resolve-cart-env";
import { revalidatePath } from "next/cache";
import { getServerSideCredentialsClient } from "../../../../lib/epcc-server-side-credentials-client";
import { getErrorMessage } from "../../../../lib/get-error-message";
import {
  getCreditBalance,
  getTotalStoreCreditBalance,
  type CreditBalanceResponse,
  type StoreCreditClient,
} from "../../../../services/store-credit";

const updateAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
});

/**
 * TODO request not working for implicit token + EP account management token
 * @param formData
 */
export async function updateAccount(formData: FormData) {
  const client = getServerSideImplicitClient();

  const rawEntries = Object.fromEntries(formData.entries());

  const validatedFormData = updateAccountSchema.safeParse(rawEntries);

  if (!validatedFormData.success) {
    console.error(JSON.stringify(validatedFormData.error));
    throw new Error("Invalid account submission");
  }

  const accountMemberCreds = retrieveAccountMemberCredentials(
    cookies(),
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  if (!accountMemberCreds) {
    throw new Error("Account member credentials not found");
  }

  const { name, id } = validatedFormData.data;

  const body = {
    type: "account",
    name,
    legal_name: name,
  };

  try {
    await client.Accounts.Update(id, body);
    revalidatePath("/accounts/summary");
  } catch (error) {
    console.error(getErrorMessage(error));
    return {
      error: getErrorMessage(error),
    };
  }

  return;
}

const updateUserAuthenticationPasswordProfileSchema = z.object({
  username: z.string(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
});

const PASSWORD_PROFILE_ID = process.env.NEXT_PUBLIC_PASSWORD_PROFILE_ID!;
const AUTHENTICATION_REALM_ID =
  process.env.NEXT_PUBLIC_AUTHENTICATION_REALM_ID!;

/**
 * Fetches store credit balance for the current account member.
 * Calls GET credit/balance with x-moltin-currency and EP-Account-Management-Authentication-Token headers.
 */
export async function getStoreCreditBalance(): Promise<{
  balance: { totalMinor: number; currency: string; formatted: string };
  response: CreditBalanceResponse | null;
} | null> {
  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookies(),
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );
  if (!accountMemberCookie) return null;
  const selectedAccount = getSelectedAccount(accountMemberCookie);
  const cookieStore = cookies();
  const currencyInCookie = cookieStore.get(`${COOKIE_PREFIX_KEY}_ep_currency`);
  const currency =
    currencyInCookie?.value ||
    process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_CODE ||
    "USD";
  try {
    const client = getServerSideImplicitClient() as StoreCreditClient;
    const response = await getCreditBalance(client, {
      "x-moltin-currency": currency,
      "EP-Account-Management-Authentication-Token": selectedAccount.token,
    });
    const { totalMinor, currency: balanceCurrency } =
      getTotalStoreCreditBalance(response);
    const formatted =
      balanceCurrency && totalMinor >= 0
        ? new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: balanceCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(totalMinor / 100)
        : "";
    return {
      balance: { totalMinor, currency: balanceCurrency, formatted },
      response,
    };
  } catch (error) {
    console.error("getStoreCreditBalance error:", error);
    return null;
  }
}

export async function updateUserAuthenticationPasswordProfile(
  formData: FormData,
) {
  const client = getServerSideImplicitClient();

  const rawEntries = Object.fromEntries(formData.entries());

  const validatedFormData =
    updateUserAuthenticationPasswordProfileSchema.safeParse(rawEntries);

  if (!validatedFormData.success) {
    console.error(JSON.stringify(validatedFormData.error));
    throw new Error("Invalid submission");
  }

  const accountMemberCreds = retrieveAccountMemberCredentials(
    cookies(),
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  if (!accountMemberCreds) {
    throw new Error("Account member credentials not found");
  }

  const { username, newPassword, currentPassword } = validatedFormData.data;

  // Re auth the user to check the current password is correct
  const reAuthResult = await client.AccountMembers.GenerateAccountToken({
    type: "account_management_authentication_token",
    authentication_mechanism: "password",
    password_profile_id: PASSWORD_PROFILE_ID,
    username,
    password: currentPassword,
  });

  const reAuthedSelectedAccount = reAuthResult.data.find(
    (entry) => entry.account_id === accountMemberCreds.selected,
  );

  if (!reAuthedSelectedAccount) {
    throw new Error("Error re-authenticating user");
  }

  const credsClient = getServerSideCredentialsClient();
  const userAuthenticationPasswordProfileInfoResult =
    await credsClient.UserAuthenticationPasswordProfile.All(
      AUTHENTICATION_REALM_ID,
      accountMemberCreds.accountMemberId,
    );

  const userAuthenticationPasswordProfileInfo =
    userAuthenticationPasswordProfileInfoResult.data.find(
      (entry) => entry.password_profile_id === PASSWORD_PROFILE_ID,
    );

  if (!userAuthenticationPasswordProfileInfo) {
    throw new Error(
      "User authentication password profile info not found for password profile",
    );
  }

  const body: any = {
    type: "user_authentication_password_profile_info",
    id: userAuthenticationPasswordProfileInfo.id,
    password_profile_id: PASSWORD_PROFILE_ID,
    ...(username && { username }),
    ...(newPassword && { password: newPassword }),
  };

  try {
    await client.UserAuthenticationInfo.Update(
      AUTHENTICATION_REALM_ID,
      accountMemberCreds.accountMemberId,
      body,
    );
    revalidatePath("/accounts");
  } catch (error) {
    console.error(error);
    throw new Error("Error updating account");
  }
}

// async function getOneTimePasswordToken(
//   client: ElasticPath,
//   username: string,
// ): Promise<string> {
//   const response = await client.OneTimePasswordTokenRequest.Create(
//     AUTHENTICATION_REALM_ID,
//     PASSWORD_PROFILE_ID,
//     {
//       type: "one_time_password_token_request",
//       username,
//       purpose: "reset_password",
//     },
//   );
//
//   const result2 = await client.request.send(
//     `/authentication-realms/${AUTHENTICATION_REALM_ID}/password-profiles/${PASSWORD_PROFILE_ID}/one-time-password-token-request`,
//     "POST",
//     {
//       data: {
//         type: "one_time_password_token_request",
//         username,
//         purpose: "reset_password",
//       },
//     },
//     undefined,
//     client,
//     false,
//     "v2",
//   );
//
//   return response;
// }
