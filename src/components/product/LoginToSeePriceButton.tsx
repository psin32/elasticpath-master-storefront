"use client";

import Link from "next/link";
import { useAuthedAccountMember } from "../../react-shopper-hooks";
import { usePathname } from "next/navigation";
import { StatusButton } from "../button/StatusButton";

interface ILoginToSeePriceButtonProps {
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const LoginToSeePriceButton = ({
  className = "",
  disabled = false,
  type = "button",
}: ILoginToSeePriceButtonProps): JSX.Element | null => {
  const { data: accountMember } = useAuthedAccountMember();
  const pathname = usePathname();

  if (accountMember) {
    return null;
  }

  // Create login URL with return URL parameter
  const loginUrl = `/login?returnUrl=${encodeURIComponent(pathname)}`;

  return (
    <StatusButton type={type} disabled={disabled} className={className}>
      <Link href={loginUrl} className="block">
        LOGIN TO SEE PRICE
      </Link>
    </StatusButton>
  );
};

export default LoginToSeePriceButton;
