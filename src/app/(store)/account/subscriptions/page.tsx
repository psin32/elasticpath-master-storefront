import { cookies } from "next/headers";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../../lib/cookie-constants";
import { redirect } from "next/navigation";
import {
  getSelectedAccount,
  retrieveAccountMemberCredentials,
} from "../../../../lib/retrieve-account-member-credentials";
import { getServerSideCredentialsClient } from "../../../../lib/epcc-server-side-credentials-client";
import {
  formatIsoDateString,
  formatIsoTimeString,
} from "../../../../lib/format-iso-date-string";
import Link from "next/link";
import Image from "next/image";
import { StatusButton } from "../../../../components/button/StatusButton";

export const dynamic = "force-dynamic";

export default async function Subscription({}) {
  const cookieStore = cookies();

  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookieStore,
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  if (!accountMemberCookie) {
    return redirect("/login");
  }

  const selectedAccount = getSelectedAccount(accountMemberCookie);

  const client = getServerSideCredentialsClient();

  const param: any = {
    eq: {
      account_id: selectedAccount.account_id,
    },
  };
  const include: any = ["plans", "products"];
  const result: any = await client.Subscriptions.With(include)
    .Filter(param)
    .All();
  const gray1pxBase64 =
    "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";

  return (
    <div className="flex flex-col gap-5 items-start">
      <div className="flex self-stretch">
        <h1 className="text-2xl">Subscription history</h1>
      </div>
      {result?.data?.length > 0 && (
        <>
          <div className="flex flex-col self-stretch gap-5">
            <div className="mt-8 flow-root">
              <div className="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
                <div className="inline-block py-2 align-middle sm:px-6 lg:px-8">
                  <div className="ring-1 ring-black ring-opacity-5  bg-white rounded-lg shadow-lg p-2 border border-gray-300">
                    <table className="divide-y divide-gray-300">
                      <thead>
                        <tr>
                          <th
                            scope="col"
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                          >
                            Subscription Product
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Price
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Frequency
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Length
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Created
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            End Date
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Next Invoice
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          ></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {result?.data.map((subscription: any) => {
                          const {
                            id,
                            attributes: { currency, offering, plan_id },
                            meta: {
                              invoice_after,
                              canceled,
                              paused,
                              suspended,
                              status,
                              timestamps: { created_at, end_date },
                            },
                          } = subscription;

                          const planDetails = result.included.plans.find(
                            (plan: any) => plan.id === plan_id,
                          );
                          const productDetails = result.included.products.find(
                            (product: any) =>
                              product.id ===
                              subscription.relationships.products.data[0].id,
                          );
                          return (
                            <tr key={id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-800 sm:pl-6">
                                <div className="mt-1 text-md leading-5 text-gray-800 flex gap-2">
                                  <div className="w-16 sm:w-20 min-h-[6.25rem]">
                                    <Image
                                      src={
                                        productDetails.attributes.main_image ??
                                        gray1pxBase64
                                      }
                                      width="100"
                                      height="100"
                                      alt={productDetails.attributes.name}
                                      className="overflow-hidden"
                                    />
                                  </div>
                                  <div className="">
                                    {productDetails?.attributes?.name}
                                    <div className="mt-1 text-xs leading-5 text-gray-500">
                                      {offering?.attributes?.description}
                                    </div>
                                    <div className="mt-1 text-xs leading-5 text-gray-500">
                                      {id}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-800">
                                <span className="text-base font-medium">
                                  {new Intl.NumberFormat("en", {
                                    style: "currency",
                                    currency,
                                  }).format(
                                    (planDetails.attributes.fixed_price[
                                      currency
                                    ].amount || 0) / 100,
                                  )}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-800">
                                {planDetails.attributes.billing_frequency}{" "}
                                {planDetails.attributes.billing_interval_type}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-800">
                                {planDetails.attributes.plan_length}{" "}
                                {planDetails.attributes.billing_interval_type}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-800">
                                <div>{formatIsoDateString(created_at)}</div>
                                <div className="mt-1 text-xs leading-5 text-gray-500">
                                  {formatIsoTimeString(created_at)}
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-800">
                                <div>
                                  <div>{formatIsoDateString(end_date)}</div>
                                  <div className="mt-1 text-xs leading-5 text-gray-500">
                                    {formatIsoTimeString(end_date)}
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-800">
                                <div>
                                  <div>
                                    {formatIsoDateString(invoice_after)}
                                  </div>
                                  <div className="mt-1 text-xs leading-5 text-gray-500">
                                    {formatIsoTimeString(invoice_after)}
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-800">
                                {canceled && (
                                  <span className="inline-flex items-center rounded-md bg-red-50 px-4 py-1 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                                    Cancelled
                                  </span>
                                )}
                                {!canceled && !paused && suspended && (
                                  <span className="inline-flex items-center rounded-md bg-yellow-50 px-4 py-1 text-sm font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                                    Suspended
                                  </span>
                                )}

                                {!canceled && paused && (
                                  <span className="inline-flex items-center rounded-md bg-yellow-50 px-4 py-1 text-sm font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                                    Paused
                                  </span>
                                )}
                                {!paused &&
                                  !canceled &&
                                  status === "active" && (
                                    <span className="inline-flex items-center rounded-md bg-green-50 px-4 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                      Active
                                    </span>
                                  )}
                                {!paused && status === "inactive" && (
                                  <span className="inline-flex items-center rounded-md bg-gray-50 px-4 py-1 text-sm font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                    Inactive
                                  </span>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-800">
                                <Link href={`/account/subscriptions/${id}`}>
                                  <StatusButton className="uppercase py-2 text-xs">
                                    Manage
                                  </StatusButton>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {result?.data?.length == 0 && (
        <div className="flex flex-col self-stretch gap-5">
          <div className="mt-8 flow-root">
            Your account does not have any quote created at the moment.
          </div>
        </div>
      )}
    </div>
  );
}
