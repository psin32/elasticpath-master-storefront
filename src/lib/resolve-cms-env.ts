export const cmsConfig = cmsEnv();

function cmsEnv(): {
  enabledStoryblok: boolean;
  enableBuilderIO: boolean;
  storyblokApi: string;
  builderApi: string;
} {
  const cmsProvider = process.env.NEXT_PUBLIC_CMS_PROVIDER || "storyblok";
  const enabledStoryblok = cmsProvider === "storyblok";
  const enableBuilderIO = cmsProvider === "builder-io";
  const storyblokApi = process.env.NEXT_PUBLIC_STORYBLOK_API_KEY || "";
  const builderApi = process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "";

  return { enabledStoryblok, enableBuilderIO, storyblokApi, builderApi };
}
