import type {
  Inventory,
  Location,
  ResourceList,
  ResourcePage,
  StockResponse,
} from "@elasticpath/js-sdk";
import { ElasticPath as EPCCClient } from "@elasticpath/js-sdk";

export async function getAllLocations(
  client: EPCCClient,
): Promise<ResourcePage<Location>> {
  return client.MultiLocationInventories.Locations.All()
    .then((response) => {
      return response;
    })
    .catch((err) => {
      console.log("Error while fetching locations", err);
      return err;
    });
}

export async function getAllInventoriesByProductId(
  productId: string,
  client: EPCCClient,
): Promise<ResourcePage<Inventory>> {
  return client.MultiLocationInventories.Get(productId)
    .then((response) => {
      return response;
    })
    .catch((err) => {
      console.log("Error while fetching inventories", err);
      return err;
    });
}

export async function getMultipleInventoriesByProductIds(
  productIds: string[],
  client: EPCCClient,
): Promise<ResourceList<StockResponse>> {
  return client.MultiLocationInventories.GetMultipleStock(productIds)
    .then((response: ResourceList<StockResponse>) => {
      return response;
    })
    .catch((err) => {
      console.log("Error while fetching inventories", err);
      return err;
    });
}
