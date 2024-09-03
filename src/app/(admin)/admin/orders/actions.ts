"use server";

import { getServerSideCredentialsClientWihoutAccountToken } from "../../../../lib/epcc-server-side-credentials-client";

export async function getAllOrders(email?: string) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  if (email) {
    const accountMembers = await client.AccountMembers.Filter({
      eq: { email },
    }).All();
    const account_member_id = accountMembers.data[0].id;
    return await client.Orders.Filter({ eq: { account_member_id } }).All();
  }
  return await client.Orders.All();
}
