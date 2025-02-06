import type { ElasticPath as EPCCClient } from "@elasticpath/js-sdk";

export async function hasPublishedCatalog(
  client: EPCCClient,
): Promise<boolean> {
  try {
    await client.ShopperCatalog.Get();
    return false;
  } catch (err) {
    return true;
  }
}
