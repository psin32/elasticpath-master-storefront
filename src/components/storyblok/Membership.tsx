"use client";

import React, { useEffect, useState } from "react";
import { getSubscriptionOfferingById } from "../../services/products";
import { getEpccImplicitClient } from "../../lib/epcc-implicit-client";
import { useCart } from "../../react-shopper-hooks";
import MembershipCard from "../membership/MembershipCard";

const Membership = ({ blok }: any) => {
  const [offerings, setOfferings] = useState<any>();
  const { useScopedAddSubscriptionItemToCart } = useCart();
  const {
    mutate: mutateAddSubscriptionItem,
    isPending: isPendingSubscriptionItem,
  } = useScopedAddSubscriptionItemToCart();

  const addSubscriptionItem = (offeringId: string, planId: string) => {
    mutateAddSubscriptionItem({
      data: {
        type: "subscription_item",
        id: offeringId,
        quantity: 1,
        subscription_configuration: {
          plan: planId,
        },
      },
    });
  };

  useEffect(() => {
    const init = async () => {
      const client = getEpccImplicitClient();
      const response = await getSubscriptionOfferingById(
        blok.offering_id,
        client,
      );
      setOfferings(response);
    };
    blok.enabled && init();
  }, []);

  return (
    blok.enabled && (
      <div className="min-h-screen flex flex-col items-center py-12">
        <h1 className="text-4xl font-normal mb-12">{blok.header}</h1>
        <div className="grid gap-8 grid-flow-col">
          {offerings &&
            offerings.included.plans.map((plan: any) => (
              <MembershipCard
                key={plan.id}
                title={plan.attributes.name}
                price={plan.meta.display_price.without_tax.formatted}
                description={plan.attributes.description}
                frequency={plan.attributes.billing_frequency}
                intervalType={plan.attributes.billing_interval_type}
                onSelect={() => addSubscriptionItem(offerings.data.id, plan.id)}
              />
            ))}
        </div>
      </div>
    )
  );
};

export default Membership;
