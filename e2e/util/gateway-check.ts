import type { ElasticPath as EPCCClient } from "@elasticpath/js-sdk";

export async function gatewayCheck(client: EPCCClient): Promise<boolean> {
  try {
    const gateways = await client.Gateways.All();
    const epPaymentGateway = gateways.data.find(
      (gateway) => gateway.slug === "elastic_path_payments_stripe",
    )?.enabled;
    return !!epPaymentGateway;
  } catch (err) {
    return false;
  }
}
