/**
 * Swatch Configuration
 * 
 * Choose how color swatches are displayed:
 * - 'color': Uses CSS background colors from colorLookup
 * - 'image': Uses background images from imageLookup
 */

export const SWATCH_CONFIG = {
  mode: 'color' as 'color' | 'image',
  
  // Optional: Override mode for specific variations
  overrides: {
    // Example: 'color': 'image', // Force color variation to use images
    'color': 'image'
    // Example: 'finish': 'color', // Force finish variation to use colors
  }
} as const;

export type SwatchMode = typeof SWATCH_CONFIG.mode;