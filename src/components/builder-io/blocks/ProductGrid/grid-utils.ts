import { Cell, GridSlotConfig } from "./types";

/**
 * Builds the grid cells array by placing slots and filling remaining cells with products
 */
export function buildCells({
  hits,
  slots = [],
  columns,
  cellsPerPage,
}: {
  hits: any[];
  slots?: GridSlotConfig[];
  columns: number;
  cellsPerPage?: number;
}): Cell[] {
  // Calculate total cells needed
  const totalCells = cellsPerPage || Math.max(hits.length + slots.length * 4, 24);
  const cells: Cell[] = Array.from({ length: totalCells }, () => ({ type: "empty" }));

  // 1) Place slots and reserve their area
  for (const slot of slots) {
    const { startCell, spanCols, spanRows } = slot;

    // Convert startCell to row/col (1-based)
    const startRow = Math.ceil(startCell / columns);
    const startCol = ((startCell - 1) % columns) + 1;

    // Mark all cells covered by this slot
    for (let r = 0; r < spanRows; r++) {
      for (let c = 0; c < spanCols; c++) {
        const row = startRow + r;
        const col = startCol + c;
        const cellIndex = (row - 1) * columns + col; // Convert back to 1-based

        if (cellIndex > totalCells) continue;

        const isTopLeft = r === 0 && c === 0;

        cells[cellIndex - 1] = isTopLeft
          ? { type: "slot", slot } // Primary cell for the banner
          : { type: "slot-shadow", slotId: slot.id }; // Hidden covered cells
      }
    }
  }

  // 2) Fill remaining empty cells with products from hits
  let productIndex = 0;
  for (let i = 0; i < cells.length && productIndex < hits.length; i++) {
    if (cells[i].type === "empty") {
      cells[i] = { type: "product", product: hits[productIndex], index: productIndex };
      productIndex++;
    }
  }

  return cells;
}

/**
 * Validates grid slot configuration
 */
export function validateGridSlot(
  slot: GridSlotConfig,
  columns: number,
  totalCells: number,
): { valid: boolean; error?: string } {
  if (slot.startCell < 1 || slot.startCell > totalCells) {
    return {
      valid: false,
      error: `startCell must be between 1 and ${totalCells}`,
    };
  }

  if (slot.spanCols < 1 || slot.spanCols > columns) {
    return {
      valid: false,
      error: `spanCols must be between 1 and ${columns}`,
    };
  }

  if (slot.spanRows < 1) {
    return {
      valid: false,
      error: "spanRows must be at least 1",
    };
  }

  // Check if slot would overflow the grid
  const startRow = Math.ceil(slot.startCell / columns);
  const startCol = ((slot.startCell - 1) % columns) + 1;
  const endCol = startCol + slot.spanCols - 1;
  const endRow = startRow + slot.spanRows - 1;

  if (endCol > columns) {
    return {
      valid: false,
      error: `Slot would overflow columns (ends at column ${endCol}, max is ${columns})`,
    };
  }

  const endCell = (endRow - 1) * columns + endCol;
  if (endCell > totalCells) {
    return {
      valid: false,
      error: `Slot would overflow total cells (ends at cell ${endCell}, max is ${totalCells})`,
    };
  }

  return { valid: true };
}

