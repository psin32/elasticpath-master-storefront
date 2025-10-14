"use server";

import { getServerSideCredentialsClientWihoutAccountToken } from "../../../../lib/epcc-server-side-credentials-client";

export async function approveOrder(orderId: string, accountMemberId: string) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  try {
    const request: any = {
      approval_status: "Approved",
      approval_member_id: accountMemberId,
    };
    const response = await client.Orders.Update(orderId, request);
    const transactions = await client.Transactions.All({ order: orderId });
    await client.Transactions.Capture({
      order: orderId,
      transaction: transactions.data[0].id,
    });
    return response;
  } catch (error) {
    console.error("Failed to approve order", error);
    throw error;
  }
}

export async function rejectOrder(
  orderId: string,
  accountMemberId: string,
  rejectionNote?: string,
) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  try {
    const request: any = {
      status: "cancelled",
      approval_status: "Rejected",
      approval_member_id: accountMemberId,
      ...(rejectionNote ? { rejection_notes: rejectionNote } : {}),
    };
    return await client.Orders.Update(orderId, request);
  } catch (error) {
    console.error("Failed to reject order", error);
    throw error;
  }
}

export async function escalateOrder(orderId: string, accountMemberId: string) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  try {
    const request: any = {
      approval_status: "Escalated",
      approval_member_id: accountMemberId,
    };
    return await client.Orders.Update(orderId, request);
  } catch (error) {
    console.error("Failed to escalate order", error);
    throw error;
  }
}

export async function getAccountMemberDetails(accountMemberId: string) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  try {
    const memberResp = await client.AccountMembers.Get(accountMemberId);
    const { name, email } = memberResp.data;
    return { name, email };
  } catch (e) {
    return null;
  }
}

export async function cancelOrder(orderId: string) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  try {
    // First get the transactions for this order
    const transactions = await client.Transactions.All({ order: orderId });

    if (transactions.data && transactions.data.length > 0) {
      // Cancel the authorized transaction
      await client.Transactions.Cancel({
        order: orderId,
        transaction: transactions.data[0].id,
      });
    }

    // Update order status to cancelled
    const request: any = {
      status: "cancelled",
      payment: "cancelled",
    };
    return await client.Orders.Update(orderId, request);
  } catch (error) {
    console.error("Failed to cancel order", error);
    throw error;
  }
}
