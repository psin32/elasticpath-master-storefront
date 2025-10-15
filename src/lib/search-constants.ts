import { EP_CURRENCY_CODE } from "./resolve-ep-currency-code";

/**
 * Get the EP_ROUTE_PRICE attribute path for Algolia
 * @param catalogId - The catalog ID to use
 * @returns The attribute path for price in Algolia index
 */
export function getEpRoutePrice(catalogId: string): string {
  return `${catalogId}.ep_price.${EP_CURRENCY_CODE}.float_price`;
}

// Legacy constant - deprecated, use getEpRoutePrice instead
export const EP_ROUTE_PRICE = `ep_price.${EP_CURRENCY_CODE}.float_price`;
