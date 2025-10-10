import { getServerSideCredentialsClient } from "../../../../lib/epcc-server-side-credentials-client";
import { getSubscriptionOfferingById } from "../../../../services/products";
import MembershipPlans from "./MembershipPlans";

export default async function Page({
  params,
}: {
  params: { offeringId: string };
}) {
  const { offeringId } = params;
  const client = getServerSideCredentialsClient();
  const offering = await getSubscriptionOfferingById(offeringId, client);

  return (
    <div className="min-h-screen flex flex-col items-center py-16 bg-gradient-to-b from-brand-primary/5 via-white to-gray-50/30">
      <div className="max-w-7xl w-full px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-brand-primary to-brand-primary/70 bg-clip-text text-transparent">
            {offering?.data?.attributes?.name || "Membership"}
          </h1>
          {offering?.data?.attributes?.description && (
            <p className="max-w-3xl mx-auto text-lg text-gray-600 leading-relaxed">
              {offering.data.attributes.description}
            </p>
          )}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5 text-brand-primary"
            >
              <path
                fillRule="evenodd"
                d="M16.704 5.29a1 1 0 010 1.415l-7.2 7.2a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.415l2.293 2.293 6.493-6.493a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Choose the perfect plan for you
          </div>
        </div>
        <MembershipPlans offering={offering} />
      </div>
    </div>
  );
}
