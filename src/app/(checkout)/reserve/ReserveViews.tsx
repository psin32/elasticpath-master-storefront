"use client";

import { useReserve } from "./reserve-provider";
import { ReactNode } from "react";
import { ReserveConfirmation } from "./ReserveConfirmation";

export function ReserveViews({ children }: { children: ReactNode }) {
  const { confirmationData } = useReserve();

  if (confirmationData) {
    return <ReserveConfirmation />;
  }

  return children;
}
