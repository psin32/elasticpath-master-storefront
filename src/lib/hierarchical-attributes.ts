/**
 * Get hierarchical attributes for Algolia search
 * @param catalogId - The catalog ID to use
 * @returns Array of hierarchical attribute paths
 */
export function getHierarchicalAttributes(catalogId: string): string[] {
  return [
    `${catalogId}.ep_slug_categories.lvl0`,
    `${catalogId}.ep_slug_categories.lvl1`,
    `${catalogId}.ep_slug_categories.lvl2`,
    `${catalogId}.ep_slug_categories.lvl3`,
  ];
}

// Legacy constant - deprecated, use getHierarchicalAttributes instead
export const hierarchicalAttributes: string[] = [
  "ep_slug_categories.lvl0",
  "ep_slug_categories.lvl1",
  "ep_slug_categories.lvl2",
  "ep_slug_categories.lvl3",
];

export const INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTES = [
  "meta.search.categories.lvl0",
  "meta.search.categories.lvl1",
  "meta.search.categories.lvl2",
  "meta.search.categories.lvl3",
  "meta.search.categories.lvl4",
];
