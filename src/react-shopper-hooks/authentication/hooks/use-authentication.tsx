import { useElasticPath } from "../../elasticpath"
import { UseQueryOptionsWrapper } from "../../types"
import type { AccountAuthenticationSettings, Resource } from "@moltin/sdk"
import { useQuery, UseQueryResult } from "@tanstack/react-query"
import { queryKeysFactory } from "../../shared/util/query-keys-factory"

const OIDC_QUERY_KEY = "authentications" as const

export const oidcQueryKeys = queryKeysFactory(OIDC_QUERY_KEY)
type OIDCQueryKey = typeof oidcQueryKeys

export function useAuthentication(
  options?: UseQueryOptionsWrapper<
    Resource<AccountAuthenticationSettings>,
    Error,
    ReturnType<OIDCQueryKey["list"]>
  >,
): Partial<Resource<AccountAuthenticationSettings>> &
  Omit<UseQueryResult<Resource<AccountAuthenticationSettings>, Error>, "data"> {
  const { client } = useElasticPath()
  const { data, ...rest } = useQuery({
    queryKey: oidcQueryKeys.list(),
    queryFn: () => client.AccountAuthenticationSettings.Get(),
    ...options,
  })
  return { ...data, ...rest } as const
}
