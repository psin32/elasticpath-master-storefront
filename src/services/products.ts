import type {
  Node,
  ProductResponse,
  Resource,
  ResourcePage,
  ShopperCatalogResource,
  ShopperCatalogResourcePage,
  SubscriptionOffering,
} from "@moltin/sdk";
import { wait300 } from "../lib/product-helper";
import { Moltin as EPCCClient } from "@moltin/sdk";

export async function getProductById(
  productId: string,
  client: EPCCClient,
): Promise<ShopperCatalogResource<ProductResponse>> {
  return client.ShopperCatalog.Products.With([
    "main_image",
    "files",
    "component_products",
  ]).Get({
    productId,
  });
}

export async function getProductBySlug(
  slug: string,
  client: EPCCClient,
): Promise<ShopperCatalogResourcePage<ProductResponse>> {
  return client.ShopperCatalog.Products.With([
    "main_image",
    "files",
    "component_products",
  ])
    .Filter({
      eq: {
        slug: slug,
      },
    })
    .All();
}

export async function getSubscriptionOfferingByProductId(
  productId: string,
  client: EPCCClient,
): Promise<ResourcePage<SubscriptionOffering, never>> {
  const filter: any = ["plans"];
  return client.SubscriptionOfferings.With(filter)
    .Filter({
      eq: {
        "products.external_ref": productId,
      },
    })
    .All();
}

export async function getSubscriptionOfferingById(
  offeringId: string,
  client: EPCCClient,
): Promise<Resource<SubscriptionOffering>> {
  const filter: any = ["plans"];
  return client.SubscriptionOfferings.With(filter).Get(offeringId);
}

export async function getProductByIds(
  productIds: string,
  client: EPCCClient,
): Promise<ShopperCatalogResource<ProductResponse[]>> {
  return client.ShopperCatalog.Products.With([
    "main_image",
    "files",
    "component_products",
  ])
    .Filter({
      in: {
        id: productIds,
      },
    })
    .All();
}

export function getAllProducts(client: EPCCClient): Promise<ProductResponse[]> {
  return _getAllProductPages(client)();
}

export function getProducts(client: EPCCClient, offset = 0, limit = 100) {
  return client.ShopperCatalog.Products.With(["main_image"])
    .Filter({
      in: {
        product_types: "standard,parent,bundle",
      },
    })
    .Limit(limit)
    .Offset(offset)
    .All();
}

const _getAllPages =
  <T, I>(
    nextPageRequestFn: (
      limit: number,
      offset: number,
      client?: EPCCClient,
    ) => Promise<ResourcePage<T, I>>,
  ) =>
  async (
    offset: number = 0,
    limit: number = 25,
    accdata: T[] = [],
  ): Promise<T[]> => {
    const requestResp = await nextPageRequestFn(limit, offset);
    const {
      meta: {
        page: newPage,
        results: { total },
      },
      data: newData,
    } = requestResp;

    const updatedOffset = offset + newPage.total;
    const combinedData = [...accdata, ...newData];
    if (updatedOffset < total) {
      return wait300.then(() =>
        _getAllPages(nextPageRequestFn)(updatedOffset, limit, combinedData),
      );
    }
    return Promise.resolve(combinedData);
  };

const _getAllProductPages = (client: EPCCClient) =>
  _getAllPages((limit = 25, offset = 0) =>
    client.ShopperCatalog.Products.Filter({
      in: {
        product_types: "standard,parent,bundle",
      },
    })
      .Limit(limit)
      .Offset(offset)
      .All(),
  );

export async function getNodesByIds(
  nodeIds: string[],
  client: EPCCClient,
): Promise<Node[]> {
  nodeIds = nodeIds.reverse();
  const response: ShopperCatalogResourcePage<Node> =
    await client.ShopperCatalog.Nodes.Filter({
      in: {
        id: nodeIds.join(","),
      },
    }).All();

  const nodes: Node[] = [];
  for (const nodeId of nodeIds) {
    const node: Node | undefined = response.data.find((nd) => nd.id == nodeId);
    node && nodes.push(node);
  }
  return nodes;
}
