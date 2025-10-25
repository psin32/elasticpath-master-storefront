"use client";

import { StatusButton } from "../../../components/button/StatusButton";
import { useReserve } from "./reserve-provider";
import { BookmarkIcon } from "@heroicons/react/24/solid";

export function SubmitReserveButton({ cart }: { cart?: any }) {
  const { isCompleting } = useReserve();
  const { cart: cartState } = useReserve();
  const activeCart = cart || cartState;

  const hasItems = (activeCart?.items?.length ?? 0) > 0;

  return (
    <StatusButton
      type="submit"
      className="self-stretch"
      status={isCompleting ? "loading" : "idle"}
      disabled={!hasItems || isCompleting}
    >
      <BookmarkIcon className="w-5 h-5 mr-2" />
      {isCompleting ? "Reserving Order..." : "Reserve Order"}
    </StatusButton>
  );
}
