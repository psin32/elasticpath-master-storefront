import type {
  ShopperCatalogResource,
  ShopperCatalogReleaseBase,
} from "@elasticpath/js-sdk";
import { ElasticPath as EPCCClient } from "@elasticpath/js-sdk";

/**
 * Get all catalogs from the Shopper Catalog API
 */
export async function getCatalog(
  client: EPCCClient,
): Promise<ShopperCatalogResource<ShopperCatalogReleaseBase>> {
  return client.ShopperCatalog.Get();
}
