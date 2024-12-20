export const algoliaEnvData = algoliaEnv();

function algoliaEnv(): {
  appId: string;
  apiKey: string;
  indexName: string;
  enabled: boolean;
} {
  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
  const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_API_KEY;
  const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME;
  const enabled = process.env.NEXT_PUBLIC_ENABLE_ALGOLIA === "true";
  if (!enabled) {
    return { appId: "", apiKey: "", indexName: "", enabled };
  }
  if (!appId || !apiKey || !indexName) {
    throw new Error(
      `Failed to get algolia search environment variables. \n Make sure you have set NEXT_PUBLIC_ALGOLIA_APP_ID, NEXT_PUBLIC_ALGOLIA_API_KEY and NEXT_PUBLIC_ALGOLIA_INDEX_NAME`,
    );
  }
  return { appId, apiKey, indexName, enabled };
}
