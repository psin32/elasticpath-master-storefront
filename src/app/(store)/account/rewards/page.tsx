import { cookies } from "next/headers";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../../lib/cookie-constants";
import { redirect } from "next/navigation";
import { retrieveAccountMemberCredentials } from "../../../../lib/retrieve-account-member-credentials";
import { getRewardsData } from "./actions";
import {
  BanknotesIcon,
  QrCodeIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

const QR_CODE_SIZE = 200;

function formatTransactionAmount(
  amount: number,
  currency: string,
  transactionType: string,
): string {
  const formatted = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount) / 100);
  return transactionType === "debit" ? `-${formatted}` : `+${formatted}`;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(new Date(dateStr));
}

export default async function AccountRewardsPage() {
  const cookieStore = cookies();
  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookieStore,
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  if (!accountMemberCookie) {
    return redirect("/login");
  }

  const rewardsData = await getRewardsData();

  return (
    <div className="flex flex-col gap-10 items-start w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gray-900">Rewards</h1>
        <p className="text-sm text-gray-500">
          Your store credit and loyalty ID for in-store use.
        </p>
      </div>

      {rewardsData !== null ? (
        <div className="flex flex-col lg:flex-row gap-8 w-full items-start">
          {/* Left column: Store credit & Loyalty ID */}
          <div className="flex flex-col gap-8 w-full max-w-xl lg:max-w-md flex-1">
            {/* Store credit */}
            <section className="flex flex-col gap-5 self-stretch rounded-lg border border-gray-200 bg-gray-50 p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BanknotesIcon className="h-5 w-5" />
                Store credit
              </h2>
              <p className="text-2xl font-semibold text-gray-900">
                {rewardsData.balance.formatted || "—"}
              </p>
              <p className="text-sm text-gray-500">
                Available to use at checkout when you purchase items.
              </p>
            </section>

            {/* Loyalty ID QR code */}
            {rewardsData.loyaltyId ? (
              <section className="flex flex-col gap-5 self-stretch rounded-lg border border-gray-200 bg-gray-50 p-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <QrCodeIcon className="h-5 w-5" />
                  Loyalty ID
                </h2>
                <p className="text-sm text-gray-500">
                  Show this QR code in-store to earn or redeem rewards.
                </p>
                <div className="inline-flex flex-col items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 self-start">
                  <Image
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=${QR_CODE_SIZE}x${QR_CODE_SIZE}&data=${encodeURIComponent(rewardsData.loyaltyId)}`}
                    alt="Loyalty ID QR code"
                    width={QR_CODE_SIZE}
                    height={QR_CODE_SIZE}
                    unoptimized
                    className="rounded"
                  />
                  <p className="text-xs font-mono text-gray-600 break-all text-center max-w-[200px]">
                    {rewardsData.loyaltyId}
                  </p>
                </div>
              </section>
            ) : (
              <section className="flex flex-col gap-5 self-stretch rounded-lg border border-gray-200 bg-gray-50 p-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <QrCodeIcon className="h-5 w-5" />
                  Loyalty ID
                </h2>
                <p className="text-sm text-gray-500">
                  No loyalty ID is associated with your account yet. Make a
                  purchase or contact support to get your loyalty ID.
                </p>
              </section>
            )}
          </div>

          {/* Right column: Transaction history */}
          <section className="flex flex-col gap-5 w-full flex-1 self-stretch rounded-lg border border-gray-200 bg-gray-50 p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ArrowsRightLeftIcon className="h-5 w-5" />
              Transaction history
            </h2>
            <p className="text-sm text-gray-500">
              Recent store credit transactions on your account.
            </p>
            {rewardsData.transactions && rewardsData.transactions.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white flex-1">
                <ul role="list" className="divide-y divide-gray-200">
                  {rewardsData.transactions.map((tx) => (
                    <li
                      key={tx.id}
                      className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              tx.transaction_type === "debit"
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {tx.transaction_type}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {tx.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-600 break-all">
                          {tx.order_reference ? (
                            <Link
                              href={`/account/orders/${tx.order_reference}`}
                              className="hover:text-brand-primary hover:underline"
                            >
                              Order {tx.order_reference}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </p>
                        {tx.meta?.timestamps?.created_at && (
                          <p className="text-xs text-gray-400">
                            {formatDate(tx.meta.timestamps.created_at)}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-sm font-medium text-gray-900 sm:mt-0">
                        {formatTransactionAmount(
                          tx.amount,
                          tx.currency,
                          tx.transaction_type,
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white p-8">
                <p className="text-sm text-gray-500">No transactions yet.</p>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Unable to load rewards. Please try again later.
        </div>
      )}
    </div>
  );
}
