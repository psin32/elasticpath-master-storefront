import { useQuery } from "@tanstack/react-query";
import { EP_CURRENCY_CODE } from "../../../lib/resolve-ep-currency-code";

export type ShippingMethod = {
  label: string;
  value: string;
  amount: number;
  formatted: string;
  message?: string;
  sort_order?: number;
};

export function useShippingMethod() {
  const query = useQuery({
    queryKey: ["delivery-methods"],
    queryFn: async () => {
      const response = await fetch("/api/shipping/details");
      if (!response.ok) throw new Error("Failed to fetch shipping methods");
      const data = await response.json();
      if (!data.success || !data.data) return [];
      let methods: ShippingMethod[] = [];
      if (Array.isArray(data.data)) {
        const sortedData = data.data.sort((a: any, b: any) => {
          const sortOrderA = a?.sort_order || 0;
          const sortOrderB = b?.sort_order || 0;
          return sortOrderB - sortOrderA;
        });
        methods = sortedData.map((shipping: any) => {
          const shipping_method = shipping.shipping_method;
          const currency = shipping?.currency || EP_CURRENCY_CODE;
          const amount = shipping?.shipping_cost || 0;
          return {
            label: shipping_method,
            value: "__shipping_" + shipping_method.toLowerCase(),
            amount,
            formatted: new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
            }).format(amount / 100),
            message: shipping?.shipping_message || shipping?.description || "",
            sort_order: shipping?.sort_order || 0,
          };
        });
      } else {
        // fallback for mock data
        methods = Object.entries(data.data).map(([type, details]: any) => {
          const amount = details.shipping_cost || 0;
          return {
            label: details.shipping_method || type,
            value: type,
            amount,
            formatted: new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: details.currency || EP_CURRENCY_CODE,
            }).format(amount / 100),
            message: details.shipping_message || "",
            sort_order: details.sort_order || 0,
          };
        });
        methods.sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0));
      }
      return methods;
    },
  });

  return {
    ...query,
    shippingMethods: query.data || [],
  };
}
