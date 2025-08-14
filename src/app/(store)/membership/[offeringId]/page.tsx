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
    <div className="min-h-screen flex flex-col items-center py-12">
      <h1 className="text-3xl font-semibold mb-8">Membership</h1>
      <MembershipPlans offering={offering} />
    </div>
  );
}
