"use client";
import { CheckIcon } from "@heroicons/react/20/solid";
import React from "react";

const MembershipCard = ({
  title,
  price,
  description,
  frequency,
  intervalType,
  onSelect,
}: any) => {
  return (
    <div className="flex flex-col border border-gray-200 rounded-lg p-8 shadow-lg bg-white transform transition-transform hover:scale-105 max-w-xs sm:max-w-sm lg:max-w-md">
      <h2 className="text-3xl font-normal mb-4 text-gray-800">{title}</h2>
      <p className="text-5xl font-semibold mb-6 text-gray-800">
        {price}
        <span className="text-2xl font-medium">
          /{frequency > 1 ? frequency : ""} {intervalType}
        </span>
      </p>
      <span
        className="[&>ul]:list-disc [&>ul]:list-inside [&>ul]:my-4 [&>ul>li]:leading-8 [&>ul>li]:list-image-[url('/images/checkmark.png')] mb-6 text-left"
        dangerouslySetInnerHTML={{ __html: description }}
      ></span>
      <button
        onClick={onSelect}
        className="mt-auto py-3 px-6 bg-brand-primary text-white rounded-lg hover:bg-brand-highlight"
      >
        Select Plan
      </button>
    </div>
  );
};

export default MembershipCard;
