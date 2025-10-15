export const CATALOG_ID = resolveCatalogId();

function resolveCatalogId(): string {
  const catalogId = process.env.NEXT_PUBLIC_CATALOG_ID;

  if (!catalogId) {
    throw new Error(
      `Failed to get catalog ID from environment variables. Make sure you have set NEXT_PUBLIC_CATALOG_ID`,
    );
  }

  return catalogId;
}
