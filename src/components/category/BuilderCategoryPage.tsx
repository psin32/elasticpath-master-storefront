import { builder } from "@builder.io/sdk";
import { Content } from "@builder.io/sdk-react";
import { builderComponent } from "../builder-io/BuilderComponents";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

interface ICategoryPage {
  categories: string[];
}

export default async function BuilderCategoryPage(params: ICategoryPage) {
  const urlPath = "/" + (params?.categories?.join("/") || "");

  const content = await builder
    .get("page", {
      userAttributes: { urlPath },
      prerender: false,
    })
    .toPromise();

  return (
    <Content
      model="page"
      content={content}
      apiKey={process.env.NEXT_PUBLIC_BUILDER_IO_KEY || ""}
      customComponents={builderComponent}
    />
  );
}
