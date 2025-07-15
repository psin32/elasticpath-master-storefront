"use client";

import { useTransition } from "react";
import { approveOrder, rejectOrder, escalateOrder } from "../actions";
import { Button } from "../../../../../components/button/Button";

interface ApprovalActionsProps {
  orderId: string;
  approvalRole?: string;
  memberRole?: string;
  accountMemberId: string;
  orderStatus?: string;
}

export default function ApprovalActions({
  orderId,
  approvalRole,
  memberRole,
  accountMemberId,
  orderStatus,
}: ApprovalActionsProps) {
  const [isPending, startTransition] = useTransition();

  // approval_role can be a comma-separated list
  let showApprovalActions = false;
  if (approvalRole && memberRole) {
    const roles = approvalRole.split(",").map((r) => r.trim().toLowerCase());
    showApprovalActions = roles.includes(memberRole.trim().toLowerCase());
  }

  // Only show if order status is 'authorized'
  if (orderStatus && orderStatus !== "authorized") return null;

  if (!showApprovalActions) return null;

  return (
    <div className="flex gap-4 mt-2 justify-end self-stretch">
      <form
        action={async () => {
          startTransition(async () => {
            await approveOrder(orderId, accountMemberId);
            window.location.reload();
          });
        }}
      >
        <Button variant="primary" className="py-2 text-sm" disabled={isPending}>
          {isPending ? "Approving..." : "Approve"}
        </Button>
      </form>
      <form
        action={async () => {
          startTransition(async () => {
            await rejectOrder(orderId, accountMemberId);
            window.location.reload();
          });
        }}
      >
        <Button
          variant="secondary"
          className="text-red-600 border-red-600 py-2 text-sm"
          disabled={isPending}
        >
          {isPending ? "Rejecting..." : "Reject"}
        </Button>
      </form>
      <form
        action={async () => {
          startTransition(async () => {
            await escalateOrder(orderId, accountMemberId);
            window.location.reload();
          });
        }}
      >
        <Button
          variant="secondary"
          className="py-2 text-sm"
          disabled={isPending}
        >
          {isPending ? "Escalating..." : "Escalate"}
        </Button>
      </form>
    </div>
  );
}
