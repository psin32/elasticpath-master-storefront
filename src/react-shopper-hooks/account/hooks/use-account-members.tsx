import { UseQueryOptionsWrapper } from "../../types";
import { AccountMember, ResourcePage } from "@elasticpath/js-sdk";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { queryKeysFactory } from "../../shared/util/query-keys-factory";
import { getEpccImplicitClient } from "../../../lib/epcc-implicit-client";

const ACCOUNT_MEMBERS_QUERY_KEY = "account-members" as const;

export const accountMembersQueryKeys = queryKeysFactory(
  ACCOUNT_MEMBERS_QUERY_KEY,
);
type AccountMembersQueryKey = typeof accountMembersQueryKeys;

export function useAccountMembers(
  accountId: string,
  options?: UseQueryOptionsWrapper<
    ResourcePage<AccountMember>,
    Error,
    ReturnType<AccountMembersQueryKey["list"] & string>
  >,
): Partial<ResourcePage<AccountMember>> &
  Omit<UseQueryResult<ResourcePage<AccountMember>, Error>, "data"> {
  const { data, ...rest } = useQuery({
    queryKey: [...accountMembersQueryKeys.list({ accountId })],
    queryFn: async () => {
      if (!accountId) {
        throw new Error("Account ID is required");
      }
      const client = getEpccImplicitClient();
      const response: any =
        await client.AccountMemberships.With("account_members").All(accountId);

      // Extract account members from the included section
      const accountMembers = response.included?.account_members || [];

      return {
        data: accountMembers,
        links: response.links || {},
        meta: response.meta || {
          page: { current: 1, limit: 0, offset: 0, total: 0 },
          results: { total: accountMembers.length },
        },
      } as ResourcePage<AccountMember>;
    },
    enabled: !!accountId,
    ...options,
  });

  return { ...data, ...rest } as const;
}
