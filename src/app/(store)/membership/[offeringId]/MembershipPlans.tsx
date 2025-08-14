"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "../../../../react-shopper-hooks";

export default function MembershipPlans({ offering }: { offering: any }) {
  const { useScopedAddSubscriptionItemToCart } = useCart();
  const { mutate: addSubscriptionItem, isPending } =
    useScopedAddSubscriptionItemToCart();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedPricingOptionId, setSelectedPricingOptionId] = useState<
    string | null
  >(null);

  // Always initialize derived values to keep hooks order consistent
  const plans: any[] = useMemo(
    () => offering?.included?.plans || [],
    [offering],
  );
  const pricingOptions: any[] = useMemo(
    () => offering?.included?.pricing_options || [],
    [offering],
  );
  const allFeatures: any[] = useMemo(
    () => offering?.included?.features || [],
    [offering],
  );

  // Auto-select first plan and its first pricing option for a smoother UX
  useEffect(() => {
    if (!selectedPlanId && plans?.length > 0) {
      const firstPlan = plans[0];
      setSelectedPlanId(firstPlan.id);
      const defaultOptId =
        firstPlan?.relationships?.pricing_options?.data?.[0]?.id || null;
      setSelectedPricingOptionId(defaultOptId);
    }
  }, [plans, selectedPlanId]);

  const currentPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId),
    [plans, selectedPlanId],
  );

  const currentPlanOptionIds: string[] = useMemo(() => {
    if (!currentPlan) return [];
    return (
      currentPlan?.relationships?.pricing_options?.data?.map(
        (d: any) => d.id,
      ) || []
    );
  }, [currentPlan]);

  const currentPlanOptions = useMemo(
    () => pricingOptions.filter((opt) => currentPlanOptionIds.includes(opt.id)),
    [pricingOptions, currentPlanOptionIds],
  );

  const handleAdd = () => {
    if (!selectedPlanId || !selectedPricingOptionId) return;
    addSubscriptionItem({
      data: {
        type: "subscription_item",
        id: offering?.data?.id,
        quantity: 1,
        subscription_configuration: {
          plan: selectedPlanId,
          pricing_option: selectedPricingOptionId,
        },
      },
    });
  };

  return (
    <div className="flex flex-col gap-10 w-full max-w-6xl mt-10">
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {plans.map((plan) => {
          const name = plan?.attributes?.name;
          const desc = plan?.attributes?.description;
          const isSelected = plan.id === selectedPlanId;
          return (
            <button
              type="button"
              key={plan.id}
              className={
                "relative text-left rounded-2xl border p-6 flex flex-col gap-2 bg-white hover:shadow-sm transition " +
                (isSelected
                  ? " border-gray-900 ring-2 ring-gray-900"
                  : " border-gray-200")
              }
              onClick={() => {
                setSelectedPlanId(plan.id);
                // default pricing option for selected plan
                const defaultOptId =
                  plan?.relationships?.pricing_options?.data?.[0]?.id || null;
                setSelectedPricingOptionId(defaultOptId);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="text-xl font-semibold">{name}</div>
                <span
                  className={
                    "h-5 w-5 rounded-full border flex items-center justify-center " +
                    (isSelected
                      ? " border-gray-900 bg-gray-900"
                      : " border-gray-300")
                  }
                >
                  {isSelected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="white"
                      className="h-3.5 w-3.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a1 1 0 010 1.415l-7.2 7.2a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.415l2.293 2.293 6.493-6.493a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
              </div>
              <p className="text-gray-600 line-clamp-3">{desc}</p>
              {(() => {
                const configuredIds: string[] = Object.keys(
                  plan?.attributes?.feature_configurations || {},
                );
                const relatedIds: string[] =
                  plan?.relationships?.features?.data?.map((d: any) => d.id) ||
                  [];
                const includedIds: string[] =
                  configuredIds.length > 0 ? configuredIds : relatedIds;
                const features = allFeatures;
                const max = 4;
                return (
                  <div className="mt-4">
                    <div className="text-xs font-semibold text-gray-700 mb-2">
                      What&apos;s included
                    </div>
                    {features?.length > 0 ? (
                      <ul className="space-y-1">
                        {features.slice(0, max).map((feature: any) => {
                          const isIncluded = includedIds.includes(feature.id);
                          return (
                            <li
                              key={feature.id}
                              className="flex items-start gap-2 text-xs"
                            >
                              {isIncluded ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="h-4 w-4 text-green-600 mt-0.5"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.704 5.29a1 1 0 010 1.415l-7.2 7.2a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.415l2.293 2.293 6.493-6.493a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  className="h-4 w-4 text-red-600 mt-0.5"
                                >
                                  <path d="M6 6l8 8M14 6l-8 8" />
                                </svg>
                              )}
                              <span className="text-gray-700">
                                {feature.attributes?.name ||
                                  feature.attributes?.description}
                              </span>
                            </li>
                          );
                        })}
                        {features.length > max && (
                          <li className="text-xs text-gray-500">
                            + {features.length - max} more
                          </li>
                        )}
                      </ul>
                    ) : (
                      <div className="text-xs text-gray-500">
                        No features listed
                      </div>
                    )}
                  </div>
                );
              })()}
            </button>
          );
        })}
      </div>

      {currentPlan && (
        <div className="rounded-2xl border border-gray-200 p-6 bg-white">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-lg font-semibold">
                Select a pricing option
              </div>
              <div className="text-sm text-gray-500">
                {currentPlan?.attributes?.name}
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                className="inline-flex items-center justify-center rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-50"
                onClick={handleAdd}
                disabled={!selectedPricingOptionId || isPending}
              >
                {isPending ? "Adding..." : "Add membership"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mt-6">
            {currentPlanOptions.map((option) => {
              const displayPrice =
                option?.meta?.prices?.[currentPlan.id]?.display_price;
              const priceFormatted =
                displayPrice?.without_tax?.formatted ||
                displayPrice?.with_tax?.formatted;
              const isActive = option.id === selectedPricingOptionId;
              const freq = option?.attributes?.billing_frequency;
              const interval = option?.attributes?.billing_interval_type;

              return (
                <button
                  type="button"
                  key={option.id}
                  className={
                    "text-left rounded-xl border p-4 hover:shadow-sm transition bg-white " +
                    (isActive
                      ? " border-gray-900 ring-1 ring-gray-900"
                      : " border-gray-200")
                  }
                  onClick={() => setSelectedPricingOptionId(option.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium mb-1">
                        {option.attributes?.name ||
                          option.attributes?.description}
                      </div>
                      {priceFormatted && (
                        <div className="text-sm text-gray-600">
                          {priceFormatted}
                        </div>
                      )}
                    </div>
                    <span
                      className={
                        "mt-1 h-4 w-4 rounded-full border flex items-center justify-center " +
                        (isActive
                          ? " border-gray-900 bg-gray-900"
                          : " border-gray-300")
                      }
                    >
                      {isActive && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="white"
                          className="h-3 w-3"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 5.29a1 1 0 010 1.415l-7.2 7.2a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.415l2.293 2.293 6.493-6.493a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-3">
                    Billed every {freq} {interval}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
