"use client";

import { useState } from "react";
import BulkOrder from "../../../components/bulk-order/BulkOrder";
import QuickOrder from "../../../components/bulk-order/QuickOrder";

export default function Page() {
  const [activeTab, setActiveTab] = useState("bulkOrder");

  return (
    <div className="max-w-5xl mx-auto mt-10 bg-white p-6 ">
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-4">
          <button
            className={`py-4 px-6 ${activeTab === "bulkOrder" ? "border-b-2 border-black text-black" : "text-gray-500"}`}
            onClick={() => setActiveTab("bulkOrder")}
          >
            Bulk Order
          </button>
          <button
            className={`py-4 px-6 ${activeTab === "quickOrder" ? "border-b-2 border-black text-black" : "text-gray-500"}`}
            onClick={() => setActiveTab("quickOrder")}
          >
            Quick Order
          </button>
        </nav>
      </div>
      <div>
        {activeTab === "bulkOrder" && <BulkOrder />}
        {activeTab === "quickOrder" && <QuickOrder />}
      </div>
    </div>
  );
}
