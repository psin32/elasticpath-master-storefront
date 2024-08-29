"use client";
import dynamic from "next/dynamic";
import { type RegisteredComponent } from "@builder.io/sdk-react";
import { Input, Builder } from "@builder.io/sdk";
const LazyProductGrid = dynamic(async () => {
  return (await import("./blocks/ProductGrid/ProductGrid")).ProductGrid;
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

const productGridSchema: Input[] = [
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
      name: "ProductView",
    },
    {
      name: "MegaMenu",
    },
  ],
});
