import type { Hierarchy, ElasticPath as EPCCClient } from "@elasticpath/js-sdk";
import {
  getHierarchies,
  getHierarchyChildren,
  getHierarchyNodes,
} from "../services/hierarchy";

interface ISchema {
  name: string;
  slug: string;
  href: string;
  id: string;
  children: ISchema[];
}

export interface NavigationNode {
  name: string;
  slug: string;
  href: string;
  id: string;
  children: NavigationNode[];
}

export async function buildSiteNavigation(
  client: EPCCClient,
): Promise<NavigationNode[]> {
  // Fetch hierarchies to be used as top level nav
  const hierarchies = await getHierarchies(client);
  return constructTree(hierarchies, client);
}

/**
 * Construct hierarchy tree, limited to 5 hierarchies at the top level
 */
function constructTree(
  hierarchies: Hierarchy[],
  client: EPCCClient,
): Promise<NavigationNode[]> {
  const tree = hierarchies
    .slice(0, 10)
    .map((hierarchy) =>
      createNode({
        name: hierarchy.attributes.name,
        id: hierarchy.id,
        slug: hierarchy.attributes.slug,
      }),
    )
    .map(async (hierarchy) => {
      // Fetch first-level nav ('parent nodes') - the direct children of each hierarchy
      const directChildren = await getHierarchyChildren(hierarchy.id, client);
      // Fetch all nodes in each hierarchy (i.e. all 'child nodes' belonging to a hierarchy)
      const allNodes = await getHierarchyNodes(hierarchy.id, client);

      // const response = directChildren
      //   .map((node) =>
      //     createNode({
      //       name: node.attributes.name,
      //       id: node.id,
      //       slug: node.attributes.slug,
      //     }),
      //   )
      //   .map((child: any) => {
      //     const children: ISchema[] = allNodes
      //       .filter((node) => node?.relationships?.parent.data.id === child.id)
      //       .map((node) =>
      //         createNode({
      //           name: node.attributes.name,
      //           id: node.id,
      //           slug: node.attributes.slug,
      //           hrefBase: `${child.slug}`,
      //         }),
      //       )
      //       .map((superchild: any) => {
      //         const data: ISchema[] = allNodes
      //           .filter(
      //             (node) =>
      //               node?.relationships?.parent.data.id === superchild.id,
      //           )
      //           .map((node) =>
      //             createNode({
      //               name: node.attributes.name,
      //               id: node.id,
      //               slug: node.attributes.slug,
      //               hrefBase: `/${hierarchy.slug}`,
      //             }),
      //           );

      //         return { ...superchild, children: data };
      //       });

      //     return { ...child, children };
      //   });

      // Build 2nd level by finding all 'child nodes' belonging to each first level featured-nodes
      const directs = directChildren.map((child) => {
        const children: ISchema[] = allNodes
          .filter((node) => node?.relationships?.parent.data.id === child.id)
          .map((node) =>
            createNode({
              name: node.attributes.name,
              id: node.id,
              slug: node.attributes.slug,
              hrefBase: `${hierarchy.href}/${child.attributes.slug}`,
            }),
          );

        return createNode({
          name: child.attributes.name,
          id: child.id,
          slug: child.attributes.slug,
          hrefBase: hierarchy.href,
          children,
        });
      });

      return { ...hierarchy, children: directs };
    });

  return Promise.all(tree);
}

interface CreateNodeDefinition {
  name: string;
  id: string;
  slug?: string;
  hrefBase?: string;
  children?: ISchema[];
}

function createNode({
  name,
  id,
  slug = "missing-slug",
  hrefBase = "",
  children = [],
}: CreateNodeDefinition): ISchema {
  return {
    name,
    id,
    slug,
    href: `${hrefBase}/${slug}`,
    children,
  };
}
