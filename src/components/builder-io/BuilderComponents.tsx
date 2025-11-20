"use client";
import dynamic from "next/dynamic";
import { type RegisteredComponent } from "@builder.io/sdk-react";
import { Input, Builder } from "@builder.io/sdk";
const LazyProductGrid = dynamic(async () => {
  return (await import("./blocks/ProductGrid/ProductGrid")).ProductGrid;
});

const LazyProductGridAlgolia = dynamic(async () => {
  return (await import("./blocks/ProductGrid/ProductGridAlgolia"))
    .ProductGridAlgolia;
});

const LazyProductView = dynamic(
  () => import(`./blocks/ProductView/ProductView`),
  {
    ssr: true,
  },
);

const LazyMegaMenu = dynamic(() => import(`./blocks/MegaMenu/MegaMenu`), {
  ssr: true,
});

const carouselFields: Input[] = [
  {
    name: "slidesToShow",
    type: "number",
    defaultValue: 4,
  },
  {
    name: "slidesToScroll",
    type: "number",
    defaultValue: 1,
  },
  {
    name: "enableAutoplay",
    type: "boolean",
    advanced: true,
    defaultValue: true,
  },
  {
    name: "enabledInfinite",
    type: "boolean",
    advanced: true,
    defaultValue: true,
  },
  {
    name: "speed",
    type: "number",
    advanced: true,
    defaultValue: 300,
  },
  {
    name: "displayDots",
    type: "boolean",
    advanced: true,
    defaultValue: false,
  },
];

const gridSlotFields: Input[] = [
  {
    name: "id",
    type: "string",
    required: true,
    helperText: "Unique identifier for this slot",
  },
  {
    name: "startCell",
    type: "number",
    required: true,
    defaultValue: 1,
    helperText:
      "1-based grid index where the banner starts (e.g., 3 for 3rd cell)",
  },
  {
    name: "spanCols",
    type: "number",
    required: true,
    defaultValue: 1,
    helperText: "How many columns the banner spans",
  },
  {
    name: "spanRows",
    type: "number",
    required: true,
    defaultValue: 1,
    helperText: "How many rows the banner spans",
  },
  {
    name: "content",
    type: "object",
    helperText: "Banner content (image, title, description, link)",
    subFields: [
      {
        name: "image",
        type: "file",
        helperText: "Banner image",
      },
      {
        name: "title",
        type: "text",
        helperText: "Banner title",
      },
      {
        name: "description",
        type: "text",
        helperText: "Banner description",
      },
      {
        name: "link",
        type: "object",
        helperText: "Banner link",
        subFields: [
          {
            name: "url",
            type: "url",
            helperText: "Link URL",
          },
          {
            name: "text",
            type: "text",
            helperText: "Link text (e.g., 'Learn More')",
          },
        ],
      },
    ],
  },
];

const productGridSchema: Input[] = [
  {
    name: "layoutMode",
    type: "string",
    enum: ["carousel", "grid"],
    defaultValue: "carousel",
    helperText: "Layout mode: carousel (slider) or grid (CSS Grid with slots)",
  },
  {
    name: "carouselProps",
    defaultValue: {
      slidesToShow: 4,
      slidesToScroll: 1,
      enableAutoplay: true,
      enabledInfinite: true,
      speed: 300,
      displayDots: false,
    },
    type: "object",
    subFields: carouselFields,
  },
  {
    name: "gridLayout",
    type: "object",
    helperText:
      "Grid layout configuration (only used when layoutMode is 'grid')",
    subFields: [
      {
        name: "columns",
        type: "number",
        defaultValue: 4,
        helperText:
          "Number of columns in the grid (e.g., 4 for a 4-column grid)",
      },
      {
        name: "cellsPerPage",
        type: "number",
        helperText:
          "Total cells per page (optional, defaults to products.length + slots)",
      },
      {
        name: "slots",
        type: "list",
        helperText: "Grid slots/banners that span multiple cells",
        subFields: gridSlotFields as any,
      },
    ],
  },
];

export const builderComponent: RegisteredComponent[] = [
  {
    component: LazyProductGrid,
    name: "ProductGrid",
    override: true,
    canHaveChildren: true,
    image: "https://unpkg.com/css.gg@2.0.0/icons/svg/play-list-add.svg",
    inputs: [
      {
        name: "productsList",
        type: "list",
        subFields: [
          {
            name: "product",
            type: `ElasticpathPCMProduct`,
          },
        ],
      },
      {
        name: "customCss",
        type: "text",
        defaultValue: "xl:max-w-7xl xl:p-0 mx-auto max-w-full p-8",
      },
    ].concat(productGridSchema as any),
  },
  {
    component: LazyProductGridAlgolia,
    name: "ProductGridAlgolia",
    canHaveChildren: true,
    image: "https://unpkg.com/css.gg@2.0.0/icons/svg/play-list-add.svg",
    inputs: [
      {
        name: "customCss",
        type: "text",
        defaultValue: "xl:max-w-7xl xl:p-0 mx-auto max-w-full p-8",
        helperText: "Custom CSS classes for the grid container",
      },
      {
        name: "searchQuery",
        type: "string",
        helperText:
          "Optional search query to filter products (leave empty for all products)",
      },
      {
        name: "filters",
        type: "string",
        helperText:
          "Optional Algolia filters (e.g., 'price > 100 AND brand:Apple')",
      },
      {
        name: "hitsPerPage",
        type: "number",
        defaultValue: 20,
        helperText: "Number of products to display",
      },
      {
        name: "sortBy",
        type: "string",
        helperText: "Sort order (e.g., 'price_asc', 'price_desc', 'name_asc')",
      },
      {
        name: "gridLayout",
        type: "object",
        helperText: "Grid layout configuration with slots for banners",
        subFields: [
          {
            name: "columns",
            type: "number",
            defaultValue: 4,
            helperText:
              "Number of columns in the grid (e.g., 4 for a 4-column grid)",
          },
          {
            name: "cellsPerPage",
            type: "number",
            helperText:
              "Total cells per page (optional, defaults to products.length + slots)",
          },
          {
            name: "slots",
            type: "list",
            helperText: "Grid slots/banners that span multiple cells",
            subFields: gridSlotFields as any,
          },
        ],
      },
    ],
  },
  {
    component: LazyProductView,
    name: "ProductView",
    inputs: [
      {
        name: "product",
        type: `ElasticpathPCMProduct`,
      },
      {
        name: "description",
        richText: true,
        type: "html",
        helperText: "Override product description from Elastic Path",
      },
      {
        name: "title",
        type: "text",
        helperText: "Override product title from Elastic Path",
      },
    ],
    image: "https://unpkg.com/css.gg@2.0.0/icons/svg/ereader.svg",
    description: "Choose a product to show its details on page",
  },
  {
    component: LazyMegaMenu,
    name: "MegaMenu",
    inputs: [
      {
        type: "list",
        name: "data",
        required: false,
        subFields: [
          {
            name: "name",
            type: "text",
            helperText: "Category Name",
          },
          {
            name: "slug",
            type: "text",
            helperText: "Category Slug",
          },
          {
            name: "href",
            type: "url",
            helperText: "Category URL",
          },
          {
            name: "showCategory",
            type: "boolean",
            helperText: "Show or Hide Category",
          },
          {
            name: "image",
            type: "file",
            helperText: "Select Image",
          },
          {
            type: "list",
            name: "children",
            subFields: [
              {
                name: "name",
                type: "text",
                helperText: "Category Name",
              },
              {
                name: "slug",
                type: "text",
                helperText: "Category Slug",
              },
              {
                name: "href",
                type: "url",
                helperText: "Category URL",
              },
              {
                name: "showCategory",
                type: "boolean",
                helperText: "Show or Hide Category",
              },
              {
                name: "image",
                type: "file",
                helperText: "Select Image",
              },
              {
                type: "list",
                name: "children",
                subFields: [
                  {
                    name: "name",
                    type: "text",
                    helperText: "Category Name",
                  },
                  {
                    name: "slug",
                    type: "text",
                    helperText: "Category Slug",
                  },
                  {
                    name: "href",
                    type: "url",
                    helperText: "Category URL",
                  },
                  {
                    name: "showCategory",
                    type: "boolean",
                    helperText: "Show or Hide Category",
                  },
                  {
                    name: "image",
                    type: "file",
                    helperText: "Select Image",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    image: "https://unpkg.com/css.gg@2.0.0/icons/svg/ereader.svg",
    description: "Choose a product to show its details on page",
  },
];

Builder.register("insertMenu", {
  name: "Elastic Path Components",
  items: [
    {
      name: "ProductGrid",
    },
    {
      name: "ProductGridAlgolia",
    },
    {
      name: "ProductView",
    },
    {
      name: "MegaMenu",
    },
  ],
});
