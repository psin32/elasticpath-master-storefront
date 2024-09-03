"use client";

import Link from "next/link";
import { SubscriptionInvoices } from "./SubscriptionInvoices";
import { StatusButton } from "../../../../../components/button/StatusButton";
import { Button } from "../../../../../components/button/Button";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { changeState } from "./actions";
import { SubscriptionsStateAction } from "@moltin/sdk";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { epPaymentsEnvData } from "../../../../../lib/resolve-ep-stripe-env";
import { CardForm } from "./CardForm";

const stripePromise = loadStripe(epPaymentsEnvData.publishableKey, {
  stripeAccount: epPaymentsEnvData.accountId,
});

type SubscriptionDetailsProps = {
  subscription: any;
  invoices: any;
};

export function SubscriptionDetails({
  subscription,
  invoices,
}: SubscriptionDetailsProps) {
  const router = useRouter();
  const [pauseLoading, setPauseLoading] = useState<boolean>(false);
  const [resumeLoading, setResumeLoading] = useState<boolean>(false);
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);

  const {
    data: {
      id,
      meta: { paused, canceled },
      attributes: {
        payment_authority: { customer_id },
      },
    },
    included: { plans },
  } = subscription;

  const canCancel = plans?.[0]?.attributes.can_cancel || false;
  const canPause = plans?.[0]?.attributes.can_pause || false;
  const canResume = plans?.[0]?.attributes.can_resume || false;

  const handleStateChange = async (state: SubscriptionsStateAction) => {
    if (state === "pause") {
      setPauseLoading(true);
    } else if (state === "cancel") {
      setCancelLoading(true);
    } else if (state === "resume") {
      setResumeLoading(true);
    }
    await changeState(id, state);
    router.refresh();
    if (state === "pause") {
      setPauseLoading(false);
    } else if (state === "cancel") {
      setCancelLoading(false);
    } else if (state === "resume") {
      setResumeLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-5 items-start w-full">
        <div className="flex self-stretch">
          <Button variant="secondary" size="medium" asChild>
            <Link href="/account/subscriptions">
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Subscriptions
            </Link>
          </Button>
        </div>
        <div className="w-full border-t border-zinc-300"></div>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h1 className="text-xl">Subscription # {id}</h1>
          </div>
        </div>
        <div className="flex py-4 self-stretch justify-end">
          <div className="flex flex-row gap-2.5">
            {canResume && (
              <StatusButton
                className="py-1 text-sm"
                variant={paused || canceled ? "primary" : "ghost"}
                onClick={() => handleStateChange("resume")}
                status={resumeLoading ? "loading" : "idle"}
              >
                Resume
              </StatusButton>
            )}

            {canPause && (
              <StatusButton
                className={clsx(
                  "py-1 text-sm",
                  !paused && !canceled ? "bg-yellow-500 text-white" : "",
                )}
                variant={!paused && !canceled ? "primary" : "ghost"}
                onClick={() => handleStateChange("pause")}
                status={pauseLoading ? "loading" : "idle"}
              >
                Pause
              </StatusButton>
            )}

            {canCancel && (
              <StatusButton
                className={clsx(
                  "py-1 text-sm",
                  !canceled ? "bg-red-600 text-white" : "",
                )}
                variant={!canceled ? "primary" : "ghost"}
                onClick={() => handleStateChange("cancel")}
                status={cancelLoading ? "loading" : "idle"}
              >
                Cancel
              </StatusButton>
            )}
          </div>
        </div>
        <Elements stripe={stripePromise}>
          <CardForm customerId={customer_id} subscription={subscription} />
        </Elements>
      </div>
      <SubscriptionInvoices invoices={invoices} />
    </>
  );
}
