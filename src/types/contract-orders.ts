import { Order, ResourcePage } from "@elasticpath/js-sdk";

// Response type for getContractOrders
export type ContractOrdersResponse = {
  success: boolean;
  orders?: ResourcePage<Order>;
  error?: string;
};
