import { Search } from "../search";
import { Metadata } from "next";
import { getServerSideImplicitClient } from "../../../../lib/epcc-server-side-implicit-client";
import {
  Hierarchy,
  ElasticPath,
  ProductResponse,
  ShopperCatalogResourcePage,
} from "@elasticpath/js-sdk";
import { notFound } from "next/navigation";
import {
  getMainImageForProductResponse,
  getOtherImagesForProductResponse,
} from "../../../../lib/file-lookup";
import { algoliaEnvData } from "../../../../lib/resolve-algolia-env";
import { cookies } from "next/headers";
import { COOKIE_PREFIX_KEY } from "../../../../lib/resolve-cart-env";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../../lib/cookie-constants";
import {
  getSelectedAccount,
  retrieveAccountMemberCredentials,
} from "../../../../lib/retrieve-account-member-credentials";
import { resolveEpccCustomRuleHeaders } from "../../../../lib/custom-rule-headers";
import SearchResultsKlevu from "../../../../components/search/SearchResultsKlevu";
import { builder } from "@builder.io/sdk";
import { cmsConfig } from "../../../../lib/resolve-cms-env";
import { ShopperProduct } from "../../../../react-shopper-hooks";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

export const metadata: Metadata = {
  title: "Search",
  description: "Search for products",
};

export const dynamic = "force-dynamic";

type Params = {
  node?: string[];
};

type SearchParams = {
  limit?: string;
  offset?: string;
};

export default async function SearchPage({
  searchParams,
  params,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { enableBuilderIO } = cmsConfig;
  const contentData = async () => {
    if (enableBuilderIO && params?.node) {
      const content = await builder
        .get("page", {
          userAttributes: { urlPath: `/search/${params.node.join("/")}` },
          prerender: false,
        })
        .toPromise();
      return content;
    }
  };
  const content = await contentData();

  const enabledKlevu: boolean =
    process.env.NEXT_PUBLIC_ENABLE_KLEVU === "true" || false;
  if (algoliaEnvData.enabled) {
    return <Search content={content} />;
  } else if (enabledKlevu) {
    return <SearchResultsKlevu content={content} />;
  } else {
    const client = getServerSideImplicitClient();
    const cookieStore = cookies();
    const catalogTag = process.env.NEXT_PUBLIC_CATALOG_TAG || "";
    const tagInCookie = cookieStore.get(`${COOKIE_PREFIX_KEY}_ep_catalog_tag`);
    const accountMemberCookie = retrieveAccountMemberCredentials(
      cookies(),
      ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
    );
    let accountToken = "";
    if (accountMemberCookie) {
      const selectedAccount = getSelectedAccount(accountMemberCookie);
      accountToken = selectedAccount.token;
    }
    let customHeaders = resolveEpccCustomRuleHeaders();
    if (customHeaders) {
      customHeaders["EP-Account-Management-Authentication-Token"] =
        accountToken;
      customHeaders["EP-Context-Tag"] = catalogTag
        ? catalogTag
        : tagInCookie?.value || "";
    } else {
      customHeaders = {
        "EP-Account-Management-Authentication-Token": accountToken,
        "EP-Context-Tag": catalogTag ? catalogTag : tagInCookie?.value || "",
      };
    }
    const { limit, offset } = searchParams;

    if (!params.node || params.node.length === 0) {
      const products = await client.ShopperCatalog.Products.With(["main_image"])
        .Filter({
          in: {
            product_types: "standard,parent,bundle",
          },
        })
        .Limit(processLimit(limit))
        .Offset(processOffset(offset))
        .All();

      return <Search page={processResult(products)} content={content} />;
    }

    const rootNodeSlug = params.node?.[0];

    if (!rootNodeSlug) {
      return <Search content={content} />;
    }

    const rootHierarchy = await findHierarchyFromSlug(client, rootNodeSlug);

    if (!rootHierarchy) {
      console.warn("No root hierarchy found for slug: ", rootNodeSlug);
      return notFound();
    }

    if (params.node.length === 1) {
      const products = await getHierarchyProducts(
        client,
        rootHierarchy.id,
        customHeaders,
        limit,
        offset,
      );

      return <Search page={processResult(products)} content={content} />;
    }

    const lastNodeSlug = getLastArrayElement(params.node);

    if (!lastNodeSlug) {
      console.warn("No last node slug found for node path: ", params.node);
      return notFound();
    }

    const leafNodeId = await findLeafNodeId(
      client,
      rootHierarchy,
      lastNodeSlug,
    );

    if (!leafNodeId) {
      console.warn("No leaf node id found for slug: ", lastNodeSlug);
      return notFound();
    }

    const products = await getNodeProducts(client, leafNodeId, limit, offset);

    return <Search page={processResult(products)} content={content} />;
  }
}

/**
 * Works to a maximum of 25 hierarchies (default limit).
 * Behavior for more than 25 hierarchies is unpredictable.
 */
async function findHierarchyFromSlug(
  client: ElasticPath,
  slug: string,
): Promise<Hierarchy | undefined> {
  const allHierarchies = await client.ShopperCatalog.Hierarchies.All();

  return allHierarchies.data.find((hierarchy) => {
    return hierarchy.attributes.slug === slug;
  });
}

function processResult(
  page: ShopperCatalogResourcePage<ProductResponse>,
): ShopperCatalogResourcePage<ShopperProduct> {
  const processedData: ShopperProduct[] = page.data.map((product) => {
    const mainImage = page.included?.main_images
      ? getMainImageForProductResponse(product, page.included.main_images) ??
        null
      : null;

    const otherImages = page.included?.files
      ? getOtherImagesForProductResponse(product, page.included?.files) ?? []
      : [];

    return {
      kind: "simple-product",
      response: product,
      main_image: mainImage,
      otherImages: otherImages,
    };
  });

  return {
    ...page,
    data: processedData,
  };
}

/**
 * Works to a maximum of 25 Child Nodes (default limit).
 * Behavior for more than 25 Child Nodes is unpredictable.
 */
async function findLeafNodeId(
  client: ElasticPath,
  rootHierarchy: Hierarchy,
  leafNodeSlug: string,
): Promise<string | undefined> {
  const hierarchyChildrenResponse =
    await client.ShopperCatalog.Hierarchies.GetHierarchyNodes({
      hierarchyId: rootHierarchy.id,
    });

  const hierarchyChildren = hierarchyChildrenResponse.data;
  const hierarchyChild = hierarchyChildren.find((child) => {
    return child.attributes.slug === leafNodeSlug;
  });

  return hierarchyChild?.id;
}

function getLastArrayElement<T>(array: T[]): T | undefined {
  return array[array.length - 1];
}

async function getNodeProducts(
  client: ElasticPath,
  nodeId: string,
  limit?: string,
  offset?: string,
): Promise<ShopperCatalogResourcePage<ProductResponse>> {
  return client.ShopperCatalog.Nodes.With(["main_image"])
    .Offset(processOffset(offset))
    .Limit(processLimit(limit))
    .GetNodeProducts({ nodeId });
}

async function getHierarchyProducts(
  client: ElasticPath,
  hierarchyId: string,
  customHeaders: any,
  limit?: string,
  offset?: string,
): Promise<any> {
  return await client.request.send(
    `catalog/hierarchies/${hierarchyId}/products?include=main_image&page[limit]=${processLimit(limit)}&page[offset]=${processOffset(offset)}`,
    "GET",
    undefined,
    undefined,
    client,
    undefined,
    "pcm",
    customHeaders,
  );
}

const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 25;

function processOffset(offset: string | undefined): number {
  const offsetNumber = Number(offset);
  return isNaN(offsetNumber) ? DEFAULT_OFFSET : offsetNumber;
}

function processLimit(limit: string | undefined): number {
  const limitNumber = Number(limit);
  return isNaN(limitNumber) ? DEFAULT_LIMIT : limitNumber;
}
