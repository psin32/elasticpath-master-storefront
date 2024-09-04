"use client";
import { useRouter } from "next/navigation";
import { StatusButton } from "../button/StatusButton";
import { AccountMemberCredentials } from "../../app/(auth)/account-member-credentials-schema";
import { logout } from "../../app/(auth)/actions";

const AdminAccountBanner = ({
  accountMemberCookie,
}: {
  accountMemberCookie: AccountMemberCredentials | undefined;
}) => {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/admin/dashboard");
  };

  return (
    accountMemberCookie &&
    accountMemberCookie?.email && (
      <div className="bg-red-600 text-white text-center py-2 text-sm">
        You are currently accessing account for{" "}
        <span className="underline font-bold">
          {accountMemberCookie?.name} ({accountMemberCookie?.email})
        </span>
        <StatusButton
          className="py-1 text-xs mr-2 ml-2 bg-black"
          onClick={handleLogout}
        >
          Click to logout this user and back to admin console
        </StatusButton>
      </div>
    )
  );
};

export default AdminAccountBanner;
