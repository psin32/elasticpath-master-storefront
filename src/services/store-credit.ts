/**
 * Store credit balance types and API.
 * Uses EPCC implicit client request.send to /credit/balance (or extensions/credit-details).
 */

export interface CreditBalanceItem {
  id: string;
  amount: number;
  currency: string;
  created: string;
  loyalty_id: string;
  user_id: string;
  type: string;
  links?: { self: string };
  meta?: {
    timestamps?: { created_at: string; updated_at: string };
    data_size?: number;
    resource_version?: number;
    etag_id?: string;
  };
}

export interface CreditBalanceResponse {
  data: CreditBalanceItem[];
  meta: {
    page: {
      limit: number;
      offset: number;
      current: number;
      total: number;
    };
    results: {
      total: number;
      total_method?: string;
    };
  };
  links?: Record<string, string | null>;
}

/**
 * Minimal client type for store credit API calls.
 * Compatible with EPCC implicit client (ElasticPath).
 */
export type StoreCreditClient = any;

export type GetCreditBalanceHeaders = {
  "x-moltin-currency"?: string;
  "EP-Account-Management-Authentication-Token"?: string;
};

export interface CreditTransaction {
  id: string;
  amount: number;
  currency: string;
  order_reference: string;
  source: string;
  status: string;
  transaction_type: "debit" | "credit";
  type: string;
  user_id: string;
  links?: { self: string };
  meta?: {
    timestamps?: { created_at: string; updated_at: string };
    data_size?: number;
    resource_version?: number;
    etag_id?: string;
  };
}

export interface CreditTransactionsResponse {
  data: CreditTransaction[];
  meta: {
    page: {
      limit: number;
      offset: number;
      current: number;
      total: number;
    };
    results: {
      total: number;
      total_method?: string;
    };
  };
  links?: Record<string, string | null>;
}

export interface GetCreditTransactionsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetches store credit balance using EPCC implicit client.
 * Calls GET credit/balance with optional x-moltin-currency and EP-Account-Management-Authentication-Token headers.
 */
export async function getCreditBalance(
  client: StoreCreditClient,
  headers?: GetCreditBalanceHeaders,
): Promise<CreditBalanceResponse> {
  const response = await client.request.send(
    "credit/balance",
    "GET",
    undefined,
    undefined,
    undefined,
    false,
    "v2",
    headers,
  );
  return response as CreditBalanceResponse;
}

/**
 * Fetches store credit transactions using EPCC implicit client.
 * Calls GET extensions/credit-transactions with optional pagination and EP-Account-Management-Authentication-Token header.
 */
export async function getCreditTransactions(
  client: StoreCreditClient,
  headers?: GetCreditBalanceHeaders,
  params?: GetCreditTransactionsParams,
): Promise<CreditTransactionsResponse> {
  const limit = params?.limit ?? 10;
  const offset = params?.offset ?? 0;
  const response = await client.request.send(
    "credit/transactions",
    "GET",
    undefined,
    undefined,
    undefined,
    false,
    "v2",
    headers,
  );
  return response as CreditTransactionsResponse;
}

/**
 * Total balance in minor units and formatted for display.
 */
export function getTotalStoreCreditBalance(
  response: CreditBalanceResponse | null | undefined,
): { totalMinor: number; currency: string; items: CreditBalanceItem[] } {
  if (!response?.data?.length) {
    return { totalMinor: 0, currency: "", items: [] };
  }
  const items = response.data;
  const totalMinor = items.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const currency = items[0]?.currency ?? "";
  return { totalMinor, currency, items };
}
