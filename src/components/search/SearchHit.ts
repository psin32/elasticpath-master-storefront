import { Hit } from "instantsearch.js";

export type CurrencyPrice = {
  amount: number;
  includes_tax: boolean;
  tiers: any | null;
  formatted_price: string;
  float_price: number;
};

export type CatalogCategories = {
  lvl0: string;
  lvl1: string;
  lvl2: string;
};

export type CatalogData = {
  ep_price: {
    [currency: string]: CurrencyPrice;
  };
  ep_slug_categories?: CatalogCategories;
  ep_categories?: CatalogCategories;
};

export interface SearchHit extends Hit {
  ep_name: string;
  ep_description: string;
  ep_slug: string;
  ep_sku: string;
  ep_main_image_url: string;
  ep_image_url?: string;
  objectID: string;
  parentID: string | null;
  is_child: number;
  ep_sales?: any;
  // Dynamic catalog keys (e.g., "bc6c9426-6a34-4348-bbaa-1c1f3544879b")
  [catalogId: string]: any | CatalogData;
}
