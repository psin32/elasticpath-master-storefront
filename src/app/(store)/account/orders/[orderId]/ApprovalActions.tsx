"use client";

import { useTransition, useState } from "react";
import { approveOrder, rejectOrder, escalateOrder } from "../actions";
import { Button } from "../../../../../components/button/Button";

interface ApprovalActionsProps {
  orderId: string;
  approvalRole?: string;
  memberRole?: string;
  accountMemberId: string;
  paymentStatus?: string;
  orderStatus?: string;
}

export default function ApprovalActions({
  orderId,
  approvalRole,
  memberRole,
  accountMemberId,
  paymentStatus,
  orderStatus,
}: ApprovalActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  // approval_role can be a comma-separated list
  let showApprovalActions = false;
  if (approvalRole && memberRole) {
    const roles = approvalRole.split(",").map((r) => r.trim().toLowerCase());
    showApprovalActions = roles.includes(memberRole.trim().toLowerCase());
  }

  // Hide if order is cancelled (status)
  if (orderStatus === "cancelled") return null;
  // Only show if payment is 'authorized'
  if (paymentStatus && paymentStatus !== "authorized") return null;

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
      <Button
        variant="secondary"
        className="text-red-600 border-red-600 py-2 text-sm"
        disabled={isPending}
        type="button"
        onClick={() => setShowRejectDialog(true)}
      >
        Reject
      </Button>
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md flex flex-col gap-4">
            <h2 className="text-lg font-bold">Reject Order</h2>
            <textarea
              className="border rounded p-2 w-full min-h-[80px]"
              placeholder="Enter rejection note (required)"
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              disabled={rejectLoading}
              required
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                className="py-2 text-sm"
                type="button"
                onClick={() => setShowRejectDialog(false)}
                disabled={rejectLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="button"
                className="py-2 text-sm"
                disabled={rejectLoading || !rejectionNote.trim()}
                onClick={async () => {
                  setRejectLoading(true);
                  await rejectOrder(
                    orderId,
                    accountMemberId,
                    rejectionNote.trim(),
                  );
                  setRejectLoading(false);
                  setShowRejectDialog(false);
                  window.location.reload();
                }}
              >
                {rejectLoading ? "Rejecting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
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
