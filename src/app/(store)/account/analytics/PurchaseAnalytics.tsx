"use client";

import { useMemo, useState } from "react";
import { Order, OrderItem } from "@elasticpath/js-sdk";

interface PurchaseData {
  sku: string;
  name: string;
  periods: Record<string, number>; // period key -> total quantity
  totalQuantity: number;
  averageQuantity: number;
}

interface RevenueData {
  sku: string;
  name: string;
  periods: Record<string, number>; // period key -> total revenue
  totalRevenue: number;
  averageRevenue: number;
}

interface PurchaseAnalyticsProps {
  ordersData: { raw: Order; items: OrderItem[] }[];
}

type TimePeriod = "weeks" | "months" | "quarters";
type ViewMode = "quantity" | "revenue";

export function PurchaseAnalytics({ ordersData }: PurchaseAnalyticsProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("months");
  const [numPeriods, setNumPeriods] = useState(12);
  const [viewMode, setViewMode] = useState<ViewMode>("quantity");

  const { purchaseData, periodLabels, averages } = useMemo(() => {
    return processPurchaseData(ordersData, timePeriod, numPeriods);
  }, [ordersData, timePeriod, numPeriods]);

  const { revenueData, revenueAverages } = useMemo(() => {
    return processRevenueData(ordersData, timePeriod, numPeriods, periodLabels);
  }, [ordersData, timePeriod, numPeriods]);

  const getCellColor = (quantity: number, average: number) => {
    if (!quantity) return "bg-gray-50";
    if (quantity > average * 1.2) return "bg-green-100 text-green-800";
    if (quantity < average * 0.8) return "bg-red-100 text-red-800";
    return "bg-blue-100 text-blue-800";
  };

  // Determine which data to display
  const displayData = viewMode === "quantity" ? purchaseData : revenueData;
  const displayAverages = viewMode === "quantity" ? averages : revenueAverages;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setViewMode("quantity")}
            className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
              viewMode === "quantity"
                ? "bg-brand-primary text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Products (by Count)
          </button>
          <button
            onClick={() => setViewMode("revenue")}
            className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
              viewMode === "revenue"
                ? "bg-brand-primary text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Products (by Revenue)
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Period
            </label>
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
              <option value="quarters">Quarters</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of{" "}
              {timePeriod === "weeks"
                ? "Weeks"
                : timePeriod === "months"
                  ? "Months"
                  : "Quarters"}
            </label>
            <select
              value={numPeriods}
              onChange={(e) => setNumPeriods(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              {timePeriod === "weeks" ? (
                <>
                  <option value="4">4 weeks</option>
                  <option value="8">8 weeks</option>
                  <option value="12">12 weeks</option>
                  <option value="24">24 weeks</option>
                  <option value="52">52 weeks</option>
                </>
              ) : timePeriod === "months" ? (
                <>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                  <option value="18">18 months</option>
                  <option value="24">24 months</option>
                </>
              ) : (
                <>
                  <option value="4">4 quarters</option>
                  <option value="8">8 quarters</option>
                  <option value="12">12 quarters</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300"></div>
              <span className="text-gray-600">Above average (20%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300"></div>
              <span className="text-gray-600">Near average</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300"></div>
              <span className="text-gray-600">Below average (20%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-50 border border-gray-300"></div>
              <span className="text-gray-600">No purchases</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 border-r border-gray-200 max-w-[200px]">
                  Product (SKU)
                </th>
                {periodLabels.map((label) => (
                  <th
                    key={label}
                    className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {label}
                  </th>
                ))}
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayData.length === 0 ? (
                <tr>
                  <td
                    colSpan={periodLabels.length + 3}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No {viewMode === "quantity" ? "purchase" : "revenue"} data
                    available
                  </td>
                </tr>
              ) : (
                displayData.map((item) => {
                  const avg = displayAverages[item.sku] || 0;
                  const totalValue =
                    viewMode === "quantity"
                      ? (item as PurchaseData).totalQuantity
                      : (item as RevenueData).totalRevenue;
                  return (
                    <tr key={item.sku} className="hover:bg-gray-50">
                      <td className="px-6 py-4 sticky left-0 bg-white border-r border-gray-200 max-w-[200px]">
                        <div
                          className="text-sm font-medium text-gray-900 truncate"
                          title={item.name}
                        >
                          {item.name}
                        </div>
                        <div
                          className="text-sm text-gray-500 truncate"
                          title={item.sku}
                        >
                          {item.sku}
                        </div>
                      </td>
                      {periodLabels.map((period) => {
                        const value = item.periods[period] || 0;
                        return (
                          <td
                            key={period}
                            className={`px-4 py-4 text-center whitespace-nowrap text-sm font-medium ${getCellColor(
                              value,
                              avg,
                            )}`}
                          >
                            {viewMode === "quantity"
                              ? value || "-"
                              : value
                                ? `$${value.toFixed(2)}`
                                : "-"}
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                        {viewMode === "quantity"
                          ? (item as PurchaseData).totalQuantity
                          : `$${(item as RevenueData).totalRevenue.toFixed(2)}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-600">
                        {viewMode === "quantity"
                          ? avg.toFixed(1)
                          : `$${avg.toFixed(2)}`}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-2">Total Products</div>
          <div className="text-3xl font-bold text-gray-900">
            {displayData.length}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-2">Total Orders</div>
          <div className="text-3xl font-bold text-gray-900">
            {ordersData.length}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-2">
            {viewMode === "quantity" ? "Total Items" : "Total Revenue"}
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {viewMode === "quantity"
              ? purchaseData.reduce((sum, item) => sum + item.totalQuantity, 0)
              : `$${revenueData.reduce((sum, item) => sum + item.totalRevenue, 0).toFixed(2)}`}
          </div>
        </div>
      </div>
    </div>
  );
}

function processPurchaseData(
  ordersData: { raw: Order; items: OrderItem[] }[],
  timePeriod: TimePeriod,
  numPeriods: number,
) {
  const purchaseMap = new Map<
    string,
    { name: string; periods: Record<string, number>; totalQuantity: number }
  >();

  const now = new Date();
  const periodLabels: string[] = [];

  // Generate period labels
  for (let i = numPeriods - 1; i >= 0; i--) {
    let periodDate: Date;
    let label: string;

    switch (timePeriod) {
      case "weeks":
        periodDate = new Date(now);
        periodDate.setDate(now.getDate() - i * 7);
        label = `Week ${periodDate.getWeek()}/${periodDate.getFullYear()}`;
        break;
      case "months":
        periodDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        label = `${periodDate.toLocaleString("default", {
          month: "short",
        })} ${periodDate.getFullYear()}`;
        break;
      case "quarters":
        periodDate = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
        const quarter = Math.floor(periodDate.getMonth() / 3) + 1;
        label = `Q${quarter} ${periodDate.getFullYear()}`;
        break;
    }

    periodLabels.push(label);
  }

  // Process orders
  ordersData.forEach(({ raw: order, items }) => {
    const orderDate = new Date(order.meta.timestamps.created_at);

    items.forEach((item) => {
      const sku = item.sku || item.product_id || "unknown";
      const name = item.name || "Unknown Product";
      const quantity = item.quantity || 0;

      if (!purchaseMap.has(sku)) {
        purchaseMap.set(sku, {
          name,
          periods: {},
          totalQuantity: 0,
        });
      }

      const productData = purchaseMap.get(sku)!;
      productData.totalQuantity += quantity;

      // Determine which period this order belongs to
      const periodKey = getPeriodKey(orderDate, timePeriod, now, numPeriods);

      if (periodKey) {
        productData.periods[periodKey] =
          (productData.periods[periodKey] || 0) + quantity;
      }
    });
  });

  // Convert to array and calculate averages
  const purchaseData: PurchaseData[] = Array.from(purchaseMap.entries()).map(
    ([sku, data]) => {
      const periodQuantities = Object.values(data.periods).filter((q) => q > 0);
      const average =
        periodQuantities.length > 0
          ? periodQuantities.reduce((sum, q) => sum + q, 0) /
            periodQuantities.length
          : 0;

      return {
        sku,
        name: data.name,
        periods: data.periods,
        totalQuantity: data.totalQuantity,
        averageQuantity: average,
      };
    },
  );

  // Sort by total quantity descending
  purchaseData.sort((a, b) => b.totalQuantity - a.totalQuantity);

  // Calculate averages for each product
  const averages: Record<string, number> = {};
  purchaseData.forEach((item) => {
    averages[item.sku] = item.averageQuantity;
  });

  return { purchaseData, periodLabels, averages };
}

function getPeriodKey(
  date: Date,
  timePeriod: TimePeriod,
  now: Date,
  numPeriods: number,
): string | null {
  const diff = getTimeDifference(date, now, timePeriod);

  if (diff < 0 || diff >= numPeriods) {
    return null;
  }

  const periodIndex = numPeriods - 1 - diff;
  const periodLabels: string[] = [];

  for (let i = numPeriods - 1; i >= 0; i--) {
    let periodDate: Date;
    let label: string;

    switch (timePeriod) {
      case "weeks":
        periodDate = new Date(now);
        periodDate.setDate(now.getDate() - i * 7);
        label = `Week ${periodDate.getWeek()}/${periodDate.getFullYear()}`;
        break;
      case "months":
        periodDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        label = `${periodDate.toLocaleString("default", {
          month: "short",
        })} ${periodDate.getFullYear()}`;
        break;
      case "quarters":
        periodDate = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
        const quarter = Math.floor(periodDate.getMonth() / 3) + 1;
        label = `Q${quarter} ${periodDate.getFullYear()}`;
        break;
    }

    periodLabels.push(label);
  }

  return periodLabels[periodIndex] || null;
}

function getTimeDifference(
  pastDate: Date,
  now: Date,
  timePeriod: TimePeriod,
): number {
  const diffMs = now.getTime() - pastDate.getTime();

  switch (timePeriod) {
    case "weeks":
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
    case "months":
      return (
        (now.getFullYear() - pastDate.getFullYear()) * 12 +
        (now.getMonth() - pastDate.getMonth())
      );
    case "quarters":
      return Math.floor(
        ((now.getFullYear() - pastDate.getFullYear()) * 12 +
          (now.getMonth() - pastDate.getMonth())) /
          3,
      );
    default:
      return 0;
  }
}

function processRevenueData(
  ordersData: { raw: Order; items: OrderItem[] }[],
  timePeriod: TimePeriod,
  numPeriods: number,
  _periodLabels: string[],
) {
  const revenueMap = new Map<
    string,
    { name: string; periods: Record<string, number>; totalRevenue: number }
  >();

  // Process orders
  ordersData.forEach(({ raw: order, items }) => {
    const orderDate = new Date(order.meta.timestamps.created_at);

    items.forEach((item) => {
      const sku = item.sku || item.product_id || "unknown";
      const name = item.name || "Unknown Product";
      const quantity = item.quantity || 0;

      // Calculate revenue: unit_amount includes discounts
      const unitAmount = item.meta?.display_price?.with_tax?.unit?.amount || 0;
      const revenue = (unitAmount / 100) * quantity; // Convert from cents to dollars

      if (!revenueMap.has(sku)) {
        revenueMap.set(sku, {
          name,
          periods: {},
          totalRevenue: 0,
        });
      }

      const productData = revenueMap.get(sku)!;
      productData.totalRevenue += revenue;

      // Determine which period this order belongs to
      const periodKey = getPeriodKey(
        orderDate,
        timePeriod,
        new Date(),
        numPeriods,
      );

      if (periodKey) {
        productData.periods[periodKey] =
          (productData.periods[periodKey] || 0) + revenue;
      }
    });
  });

  // Convert to array and calculate averages
  const revenueData: RevenueData[] = Array.from(revenueMap.entries()).map(
    ([sku, data]) => {
      const periodRevenues = Object.values(data.periods).filter((r) => r > 0);
      const average =
        periodRevenues.length > 0
          ? periodRevenues.reduce((sum, r) => sum + r, 0) /
            periodRevenues.length
          : 0;

      return {
        sku,
        name: data.name,
        periods: data.periods,
        totalRevenue: data.totalRevenue,
        averageRevenue: average,
      };
    },
  );

  // Sort by total revenue descending
  revenueData.sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Calculate averages for each product
  const averages: Record<string, number> = {};
  revenueData.forEach((item) => {
    averages[item.sku] = item.averageRevenue;
  });

  return { revenueData, revenueAverages: averages };
}

// Add Date extension for week calculation
declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function (): number {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    )
  );
};
