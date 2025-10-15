import { useStore } from "./use-store";

/**
 * Hook to get the active catalog ID from the store context.
 * This catalog ID is dynamically fetched based on the current context
 * (EP-Channel, EP-Context-Tag headers) during initialization.
 *
 * @returns The active catalog ID or undefined if not available
 * @throws Error if used outside of StoreProvider
 */
export function useCatalogId(): string | undefined {
  const { catalogId } = useStore();
  return catalogId;
}
