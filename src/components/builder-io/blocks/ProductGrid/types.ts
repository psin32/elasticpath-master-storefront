/**
 * Grid-based slot configuration for banners/content blocks
 * that can span multiple cells in the product grid
 */
export interface GridSlotConfig {
  id: string; // Builder content entry ID for the banner
  startCell: number; // 1-based grid index where the banner starts
  spanCols: number; // how many columns the banner spans
  spanRows: number; // how many rows the banner spans
  content?: any; // Builder.io content for the banner (image, text, etc.)
}

/**
 * Grid layout configuration
 */
export interface GridLayoutConfig {
  columns: number; // Number of columns in the grid (e.g., 4)
  cellsPerPage?: number; // Total cells per page (optional, defaults to products.length + slots)
  slots?: GridSlotConfig[]; // Array of grid slots/banners
}

/**
 * Cell types in the grid
 */
export type Cell =
  | { type: "empty" }
  | { type: "product"; product: any; index: number }
  | { type: "slot"; slot: GridSlotConfig }
  | { type: "slot-shadow"; slotId: string }; // Other cells covered by a big slot

