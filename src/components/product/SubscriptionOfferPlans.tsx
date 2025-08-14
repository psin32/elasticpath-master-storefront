"use client";

import { useEffect, useState } from "react";
import Price from "./Price";
import StrikePrice from "./StrikePrice";

export default function SubscriptionOfferPlans({
  offerings,
  product,
}: {
  offerings: any;
  product: any;
}) {
  const [selected, setSelected] = useState<string>();
  const [selectedPlan, setSelectedPlan] = useState<any>();
  const [selectedPricingOption, setSelectedPricingOption] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    setSelected("one_time");
    const plan: any = {};
    offerings.data.map((offering: any) => {
      plan[offering.id] = offering.relationships.plans.data[0].id;
    });
    setSelectedPlan(plan);
    // Initialize default selected pricing option per offering (first plan's first option)
    const defaults: Record<string, string> = {};
    offerings.data.forEach((offering: any) => {
      const firstPlanId = offering.relationships?.plans?.data?.[0]?.id;
      if (!firstPlanId) return;
      const includedPlan = (offerings.included?.plans || []).find(
        (p: any) => p.id === firstPlanId,
      );
      const firstOptionId =
        includedPlan?.relationships?.pricing_options?.data?.[0]?.id;
      if (firstOptionId) {
        defaults[offering.id] = firstOptionId;
      }
    });
    setSelectedPricingOption(defaults);
  }, [product]);

  const changeSelectedPlan = (offeringId: string, planId: string) => {
    const plan: any = {};
    plan[offeringId] = planId;
    setSelectedPlan(plan);
  };

  const {
    meta: { display_price, original_display_price },
  } = product;

  return (
    <div className="flex items-center justify-center">
      <div className="grid w-full grid-cols-1 gap-2">
        <div className="relative">
          <input
            className="peer hidden"
            id="radio_1"
            value="one_time"
            type="radio"
            name="price_type"
            checked={selected === "one_time"}
            onChange={() => setSelected("one_time")}
          />
          <span className="absolute right-4 top-1/2 box-content block h-3 w-3 -translate-y-1/2 rounded-full border-8 border-gray-300 bg-white peer-checked:border-indigo-500"></span>
          <label
            className="flex cursor-pointer flex-col rounded-lg border border-gray-300 p-4 peer-checked:border-4 peer-checked:border-indigo-700"
            htmlFor="radio_1"
          >
            <span className="text-xs font-semibold uppercase">
              One-time purchase
            </span>
            {display_price && (
              <div className="flex items-center mt-2">
                {original_display_price && (
                  <StrikePrice
                    price={
                      original_display_price?.without_tax?.formatted
                        ? original_display_price?.without_tax?.formatted
                        : original_display_price.with_tax.formatted
                    }
                    currency={
                      original_display_price.without_tax?.currency
                        ? original_display_price?.without_tax?.currency
                        : original_display_price.with_tax.currency
                    }
                    size="text-xl"
                  />
                )}
                <Price
                  price={
                    display_price?.without_tax?.formatted
                      ? display_price?.without_tax?.formatted
                      : display_price.with_tax.formatted
                  }
                  currency={
                    display_price?.without_tax?.currency
                      ? display_price?.without_tax?.currency
                      : display_price.with_tax.currency
                  }
                  original_display_price={original_display_price}
                  size="text-xl"
                />
              </div>
            )}
          </label>
        </div>
        {offerings.data.map((offering: any) => {
          return (
            <div className="relative" key={offering.id}>
              <input
                className="peer hidden"
                id={offering.id}
                value={offering.id}
                type="radio"
                name="price_type"
                checked={selected === offering.id}
                onChange={() => setSelected(offering.id)}
              />
              <span className="absolute right-4 top-1/2 box-content block h-3 w-3 -translate-y-1/2 rounded-full border-8 border-gray-300 bg-white peer-checked:border-indigo-500"></span>

              <label
                className="flex cursor-pointer flex-col rounded-lg border border-gray-300 p-4 peer-checked:border-4 peer-checked:border-indigo-700"
                htmlFor={offering.id}
              >
                <span className="text-xs font-semibold uppercase">
                  Subscription
                </span>
                <span className="mt-2 text-xl font-bold mb-4">
                  {offering.attributes.description}
                </span>
                <ul
                  hidden={selected != offering.id}
                  className="mr-10 w-[80%] text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {(() => {
                    const items: Array<{ plan: any; option: any }> = [];
                    (offering.relationships?.plans?.data || []).forEach(
                      (plan_data: any) => {
                        const plan = (offerings.included.plans || []).find(
                          (p: any) => p.id === plan_data.id,
                        );
                        if (!plan) return;
                        const optionIds: string[] = Array.from(
                          new Set(
                            (
                              plan.relationships?.pricing_options?.data || []
                            ).map((po: any) => po.id),
                          ),
                        );
                        optionIds.forEach((id) => {
                          const option = (
                            offerings.included.pricing_options || []
                          ).find((po: any) => po.id === id);
                          if (option) items.push({ plan, option });
                        });
                      },
                    );
                    return items.map(({ plan, option }) => {
                      const displayPrice =
                        option.meta?.prices?.[plan.id]?.display_price;
                      const priceFormatted =
                        displayPrice?.without_tax?.formatted ||
                        displayPrice?.with_tax?.formatted;
                      const priceCurrency =
                        displayPrice?.without_tax?.currency ||
                        displayPrice?.with_tax?.currency;
                      const inputId = `${offering.id}-${plan.id}-${option.id}`;
                      return (
                        <li
                          key={inputId}
                          className="border-b border-gray-200 rounded-t-lg dark:border-gray-600"
                        >
                          <div className="flex items-center ps-3">
                            <input
                              id={inputId}
                              type="radio"
                              name="pricing_option"
                              value={option.id}
                              checked={
                                selectedPricingOption?.[offering.id] ===
                                option.id
                              }
                              onChange={() => {
                                setSelectedPricingOption((prev) => ({
                                  ...(prev || {}),
                                  [offering.id]: option.id,
                                }));
                                changeSelectedPlan(offering.id, plan.id);
                                setSelected(offering.id);
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                            />
                            <input
                              type="hidden"
                              name="plan"
                              value={plan.id}
                              disabled={
                                selectedPricingOption?.[offering.id] !==
                                option.id
                              }
                            />
                            <label
                              htmlFor={inputId}
                              className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                            >
                              <div className="flex flex-col items-start gap-2 ml-2">
                                <span className="mt-2 text-xl font-semibold">
                                  {option.attributes.name ||
                                    option.attributes.description}
                                </span>
                                <span>
                                  Frequency:{" "}
                                  {option.attributes.billing_frequency}{" "}
                                  {option.attributes.billing_interval_type}
                                </span>
                                {priceFormatted && (
                                  <span>
                                    <Price
                                      price={priceFormatted}
                                      currency={priceCurrency}
                                      size="text-md"
                                    />
                                  </span>
                                )}
                              </div>
                            </label>
                          </div>
                        </li>
                      );
                    });
                  })()}
                </ul>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
