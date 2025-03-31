"use server";

import { getServerSideImplicitClient } from "../../lib/epcc-server-side-implicit-client";
import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  CART_COOKIE_NAME,
} from "../../lib/cookie-constants";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import {
  AccountMemberCredential,
  AccountMemberCredentials,
} from "./account-member-credentials-schema";
import { retrieveAccountMemberCredentials } from "../../lib/retrieve-account-member-credentials";
import { revalidatePath } from "next/cache";
import { getErrorMessage } from "../../lib/get-error-message";
import type {
  AccountAuthenticationSettings,
  AccountTokenBase,
  ResourcePage,
  ElasticPath as EPCCClient,
  Profile,
  ProfileResponse,
  Resource,
} from "@elasticpath/js-sdk";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  returnUrl: z.string().optional(),
});

const selectedAccountSchema = z.object({
  accountId: z.string(),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  name: z.string(),
  returnUrl: z.string().optional(),
});

const PASSWORD_PROFILE_ID = process.env.NEXT_PUBLIC_PASSWORD_PROFILE_ID!;

const loginErrorMessage =
  "Failed to login, make sure your email and password are correct";

export async function login(props: FormData) {
  const client = getServerSideImplicitClient();

  const rawEntries = Object.fromEntries(props.entries());

  const validatedProps = loginSchema.safeParse(rawEntries);

  if (!validatedProps.success) {
    return {
      error: loginErrorMessage,
    };
  }

  const { email, password, returnUrl } = validatedProps.data;

  try {
    const result = await client.AccountMembers.GenerateAccountToken({
      type: "account_management_authentication_token",
      authentication_mechanism: "password",
      password_profile_id: PASSWORD_PROFILE_ID,
      username: email.toLowerCase(), // Known bug for uppercase usernames so we force lowercase.
      password,
    });

    await mergeCart(
      client,
      result?.data?.[0]?.token,
      result?.data?.[0]?.account_id,
      true,
    );
    const cookieStore = cookies();
    cookieStore.set(createCookieFromGenerateTokenResponse(result));
  } catch (error) {
    console.error(getErrorMessage(error));
    return {
      error: loginErrorMessage,
    };
  }

  redirect(returnUrl ?? "/");
}

export async function logout() {
  const cookieStore = cookies();

  cookieStore.delete(ACCOUNT_MEMBER_TOKEN_COOKIE_NAME);
  const client = getServerSideImplicitClient();
  const response = await client.Cart().CreateCart({ name: "Cart" });
  cookieStore.set(CART_COOKIE_NAME, response.data.id);

  redirect("/");
}

export async function selectedAccount(args: FormData) {
  const rawEntries = Object.fromEntries(args.entries());

  const validatedProps = selectedAccountSchema.safeParse(rawEntries);

  if (!validatedProps.success) {
    throw new Error("Invalid account id");
  }

  const { accountId } = validatedProps.data;

  const cookieStore = cookies();

  const accountMemberCredentials = retrieveAccountMemberCredentials(
    cookieStore,
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  if (!accountMemberCredentials) {
    redirect("/login");
    return;
  }

  const selectedAccount = accountMemberCredentials?.accounts[accountId];

  if (!selectedAccount) {
    throw new Error("Invalid account id");
  }

  const client = getServerSideImplicitClient();
  await mergeCart(
    client,
    accountMemberCredentials?.accounts[accountId].token,
    accountId,
    false,
  );

  cookieStore.set({
    name: ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
    value: JSON.stringify({
      ...accountMemberCredentials,
      selected: selectedAccount.account_id,
    }),
    path: "/",
    sameSite: "strict",
    expires: new Date(
      accountMemberCredentials.accounts[
        Object.keys(accountMemberCredentials.accounts)[0]
      ].expires,
    ),
  });

  revalidatePath("/account");
}

export async function register(data: FormData) {
  const client = getServerSideImplicitClient();

  const validatedProps = registerSchema.safeParse(
    Object.fromEntries(data.entries()),
  );

  if (!validatedProps.success) {
    throw new Error("Invalid email or password or name");
  }

  const { email, password, name, returnUrl } = validatedProps.data;

  const result = await client.AccountMembers.GenerateAccountToken({
    type: "account_management_authentication_token",
    authentication_mechanism: "self_signup",
    password_profile_id: PASSWORD_PROFILE_ID,
    username: email.toLowerCase(), // Known bug for uppercase usernames so we force lowercase.
    password,
    name, // TODO update sdk types as name should exist
    email,
  } as any);

  await mergeCart(
    client,
    result?.data?.[0]?.token,
    result?.data?.[0]?.account_id,
    true,
  );

  const cookieStore = cookies();
  cookieStore.set(createCookieFromGenerateTokenResponse(result));

  redirect(returnUrl ?? "/");
}

export async function getAccountAuthenticationSettings(): Promise<
  Resource<AccountAuthenticationSettings>
> {
  const client = getServerSideImplicitClient();
  return client.AccountAuthenticationSettings.Get();
}

export async function getOidcProfile(
  realmId: string,
  profileId: string,
): Promise<ProfileResponse> {
  const client = getServerSideImplicitClient();
  return client.OidcProfile.Get({
    realmId,
    profileId,
  });
}

export async function loadOidcProfiles(
  realmId: string,
): Promise<ResourcePage<Profile>> {
  const client = getServerSideImplicitClient();
  return client.OidcProfile.All(realmId);
}

export async function oidcLogin(
  code: string,
  redirectUri: string,
  codeVerifier: string,
): Promise<AccountTokenBase[]> {
  const client = getServerSideImplicitClient();
  const cookieStore = cookies();
  const request: any = {
    type: "account_management_authentication_token",
    authentication_mechanism: "oidc",
    oauth_authorization_code: code,
    oauth_redirect_uri: redirectUri,
    oauth_code_verifier: codeVerifier,
  };

  const result: any = await client.AccountMembers.GenerateAccountToken(
    request,
  ).catch((error) => {
    return error;
  });
  await mergeCart(
    client,
    result?.data?.[0]?.token,
    result?.data?.[0]?.account_id,
    true,
  );
  if (result?.data?.length > 0) {
    cookieStore.set(createCookieFromGenerateTokenResponse(result));
    redirect("/");
  }
  return result;
}

function createCookieFromGenerateTokenResponse(
  response: ResourcePage<AccountTokenBase>,
): ResponseCookie {
  const { expires } = response.data[0]; // assuming all tokens have shared expiration date/time

  const cookieValue = createAccountMemberCredentialsCookieValue(
    response.data,
    (response.meta as unknown as { account_member_id: string })
      .account_member_id, // TODO update sdk types
  );

  return {
    name: ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
    value: JSON.stringify(cookieValue),
    path: "/",
    sameSite: "strict",
    expires: new Date(expires),
  };
}

function createAccountMemberCredentialsCookieValue(
  responseTokens: AccountTokenBase[],
  accountMemberId: string,
): AccountMemberCredentials {
  return {
    accounts: responseTokens.reduce(
      (acc, responseToken) => ({
        ...acc,
        [responseToken.account_id]: {
          account_id: responseToken.account_id,
          account_name: responseToken.account_name,
          expires: responseToken.expires,
          token: responseToken.token,
          type: "account_management_authentication_token" as const,
        },
      }),
      {} as Record<string, AccountMemberCredential>,
    ),
    selected: responseTokens[0].account_id,
    accountMemberId,
  };
}

export async function mergeCart(
  client: EPCCClient,
  token: string,
  accountId: string,
  isMergeEnabled: boolean,
) {
  const cookieStore = cookies();
  const headers = {
    "EP-Account-Management-Authentication-Token": token,
  };

  const accountCarts = await client.request
    .send(`/carts`, "GET", null, undefined, client, undefined, "v2", headers)
    .catch((err) => {
      console.error("Error while getting account carts", err);
    });

  const cartCookie = cookieStore.get(CART_COOKIE_NAME);
  const cartId = cartCookie?.value || "";
  let accountCartId = null;
  const validCarts = accountCarts.data.filter((cart: any) => !cart.is_quote);
  if (validCarts.length > 0) {
    accountCartId = validCarts[0].id;
  } else {
    const response = await client.request
      .send(
        `/carts`,
        "POST",
        {
          name: "Cart",
        },
        undefined,
        client,
        undefined,
        "v2",
        headers,
      )
      .catch((err) => {
        console.error("Error while creating new cart for account", err);
      });

    accountCartId = response.data.id;
    await client.request
      .send(
        `/carts/${accountCartId}/relationships/accounts`,
        "POST",
        [
          {
            type: "account",
            id: accountId,
          },
        ],
        undefined,
        client,
        undefined,
        "v2",
        headers,
      )
      .catch((err) => {
        console.error("Error while associating cart with account", err);
      });
  }

  if (isMergeEnabled) {
    await client.request
      .send(
        `/carts/${accountCartId}/items`,
        "POST",
        {
          data: {
            type: "cart_items",
            cart_id: cartId,
          },
          options: {
            add_all_or_nothing: false,
          },
        },
        undefined,
        client,
        undefined,
        "v2",
        headers,
      )
      .catch((err) => {
        console.error("Error while merge cart", err);
      });
  }
  cookieStore.set(CART_COOKIE_NAME, accountCartId);
}
