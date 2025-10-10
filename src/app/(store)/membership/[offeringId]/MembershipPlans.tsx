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
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

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
    const data: any = {
      custom_inputs: {
        additional_information: [],
      },
    };

    if (currentPlan?.attributes?.main_image) {
      data.custom_inputs.image_url = currentPlan?.attributes?.main_image;
    }

    addSubscriptionItem({
      data: {
        type: "subscription_item",
        id: offering?.data?.id,
        quantity: 1,
        subscription_configuration: {
          plan: selectedPlanId,
          pricing_option: selectedPricingOptionId,
        },
        custom_inputs: data.custom_inputs,
      },
    });
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mt-8 px-4">
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
        {plans.map((plan) => {
          const name = plan?.attributes?.name;
          const desc = plan?.attributes?.description;
          const isSelected = plan.id === selectedPlanId;
          return (
            <button
              type="button"
              key={plan.id}
              className={
                "relative text-left rounded-2xl border-2 p-6 flex flex-col gap-3 bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 " +
                (isSelected
                  ? " border-brand-primary ring-4 ring-brand-primary/10 shadow-lg bg-gradient-to-br from-brand-primary/5 to-white"
                  : " border-gray-200 hover:border-gray-300")
              }
              onClick={() => {
                setSelectedPlanId(plan.id);
                // default pricing option for selected plan
                const defaultOptId =
                  plan?.relationships?.pricing_options?.data?.[0]?.id || null;
                setSelectedPricingOptionId(defaultOptId);
              }}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 bg-brand-primary text-white text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-xl">
                  Selected
                </div>
              )}
              <div className="flex items-start justify-between mt-2">
                <div className="text-2xl font-bold text-gray-900 pr-4">
                  {name}
                </div>
                <span
                  className={
                    "h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all " +
                    (isSelected
                      ? " border-brand-primary bg-brand-primary shadow-md"
                      : " border-gray-300 bg-white")
                  }
                >
                  {isSelected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="white"
                      className="h-4 w-4"
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
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                {desc}
              </p>
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
                const isExpanded = expandedPlanId === plan.id;
                const previewLimit = 4;
                const hasMoreFeatures = features.length > previewLimit;
                const displayedFeatures = isExpanded
                  ? features
                  : features.slice(0, previewLimit);

                return (
                  <div className="mt-4 flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold text-gray-900">
                        What&apos;s included
                      </div>
                      {hasMoreFeatures && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedPlanId(isExpanded ? null : plan.id);
                          }}
                          className="text-xs font-medium text-brand-primary hover:text-brand-primary/80 transition-colors flex items-center gap-1"
                        >
                          {isExpanded
                            ? "Show less"
                            : `View all ${features.length}`}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    {features?.length > 0 ? (
                      <ul className="space-y-2">
                        {displayedFeatures.map((feature: any) => {
                          const isIncluded = includedIds.includes(feature.id);
                          return (
                            <li
                              key={feature.id}
                              className="flex items-start gap-2.5 text-sm group"
                            >
                              <span
                                className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center mt-0.5 ${
                                  isIncluded ? "bg-green-100" : "bg-red-50"
                                }`}
                              >
                                {isIncluded ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="h-3.5 w-3.5 text-green-600"
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
                                    fill="currentColor"
                                    className="h-3.5 w-3.5 text-red-500"
                                  >
                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                  </svg>
                                )}
                              </span>
                              <span
                                className={`flex-1 ${isIncluded ? "text-gray-700" : "text-gray-500"}`}
                              >
                                {feature.attributes?.name ||
                                  feature.attributes?.description}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
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
        <div className="rounded-2xl border-2 border-gray-200 p-8 bg-gradient-to-br from-gray-50 to-white shadow-lg">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                Select a pricing option
              </div>
              <div className="text-base text-gray-600 flex items-center gap-2">
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
                {currentPlan?.attributes?.name}
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                className="inline-flex items-center justify-center rounded-xl bg-brand-primary hover:bg-brand-primary/80 text-white px-8 py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-xl transform hover:scale-105"
                onClick={handleAdd}
                disabled={!selectedPricingOptionId || isPending}
              >
                {isPending ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    Add membership
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="ml-2 h-5 w-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
                    "relative text-left rounded-xl border-2 p-5 hover:shadow-md transition-all duration-200 bg-white transform hover:-translate-y-0.5 " +
                    (isActive
                      ? " border-brand-primary ring-2 ring-brand-primary/20 shadow-md"
                      : " border-gray-200 hover:border-gray-300")
                  }
                  onClick={() => setSelectedPricingOptionId(option.id)}
                >
                  {isActive && (
                    <div className="absolute -top-2 -right-2 bg-brand-primary text-white rounded-full p-1.5 shadow-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 5.29a1 1 0 010 1.415l-7.2 7.2a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.415l2.293 2.293 6.493-6.493a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-2">
                        {option.attributes?.name ||
                          option.attributes?.description}
                      </div>
                      {priceFormatted && (
                        <div className="text-2xl font-bold text-brand-primary mb-1">
                          {priceFormatted}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 flex items-center gap-1.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-3.5 w-3.5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Billed every {freq} {interval}
                      </div>
                    </div>
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
