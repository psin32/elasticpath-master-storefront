import EpLogo from "../../../components/icons/ep-logo";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminLoginForm } from "./AdminLoginForm";
import { useTranslation } from "../../i18n";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";

export default async function Login({
  searchParams,
}: {
  searchParams: { returnUrl?: string };
}) {
  const session = await getServerSession(authOptions);
  const { returnUrl } = searchParams;

  const cookieStore = cookies();
  const { t } = await useTranslation(
    cookieStore.get("locale")?.value || "en",
    "auth",
    {},
  );

  if (session?.user) {
    redirect("/admin/dashboard");
  }

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <Link href="/">
            <EpLogo className="h-10 w-auto mx-auto" />
          </Link>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <AdminLoginForm returnUrl={returnUrl} />
        </div>
      </div>
    </>
  );
}
