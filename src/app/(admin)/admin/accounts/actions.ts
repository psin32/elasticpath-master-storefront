"use server";

import {
  AccountTokenBase,
  ResourcePage,
  UserAuthenticationPasswordProfileBody,
} from "@elasticpath/js-sdk";
import { getServerSideCredentialsClientWihoutAccountToken } from "../../../../lib/epcc-server-side-credentials-client";
import { cookies } from "next/headers";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../../lib/cookie-constants";
import {
  AccountMemberCredential,
  AccountMemberCredentials,
} from "../../../(auth)/account-member-credentials-schema";

export async function getAccountMembers(email?: string) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  if (email) {
    return await client.AccountMembers.Filter({ eq: { email } }).All();
  }
  return await client.AccountMembers.All();
}

export async function impersonateUser(accountMemberId: string) {
  const realmId = process.env.NEXT_PUBLIC_AUTHENTICATION_REALM_ID;
  const passwordProfileID = process.env.NEXT_PUBLIC_ADMIN_PASSWORD_PROFILE_ID;
  const password = "Epcc@1234";
  if (passwordProfileID && realmId && password) {
    const client = getServerSideCredentialsClientWihoutAccountToken();
    const params: any = {
      eq: { id: accountMemberId },
    };
    const userAuthInfo = await client.UserAuthenticationInfo.Filter(params)
      .All(realmId)
      .catch((err: any) => {
        console.error("Error in UserAuthenticationInfo All", err);
        return err;
      });
    const request: UserAuthenticationPasswordProfileBody = {
      type: "user_authentication_password_profile_info",
      password_profile_id: passwordProfileID,
      username: userAuthInfo.data[0].email,
      password,
    };
    const userAuthenticationPasswordProfile =
      await client.UserAuthenticationPasswordProfile.Create(
        realmId,
        userAuthInfo.data[0].id,
        { data: request },
      ).catch((err: any) => {
        console.error("Error in UserAuthenticationPasswordProfile Create", err);
        return err;
      });
    const result = await client.AccountMembers.GenerateAccountToken({
      type: "account_management_authentication_token",
      authentication_mechanism: "password",
      password_profile_id: passwordProfileID,
      username: userAuthInfo.data[0].email,
      password,
    }).catch((err: any) => {
      console.error("Error in GenerateAccountToken", err);
      return err;
    });
    const cookieStore = cookies();
    cookieStore.set(
      createCookieFromGenerateTokenResponse(
        result,
        userAuthInfo.data[0].email,
        userAuthInfo.data[0].name,
      ),
    );
    await client.UserAuthenticationPasswordProfile.Delete(
      realmId,
      userAuthInfo.data[0].id,
      userAuthenticationPasswordProfile.data.id,
    ).catch((err: any) => {
      console.error("Error in UserAuthenticationPasswordProfile Delete", err);
    });
  }
}

function createCookieFromGenerateTokenResponse(
  response: ResourcePage<AccountTokenBase>,
  email: string,
  name: string,
): ResponseCookie {
  const { expires } = response.data[0]; // assuming all tokens have shared expiration date/time
  const memberId = (response.meta as unknown as { account_member_id: string })
    .account_member_id;

  const cookieValue = createAccountMemberCredentialsCookieValue(
    response.data,
    memberId,
    email,
    name,
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
  email: string,
  name: string,
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
    email,
    name,
  };
}
