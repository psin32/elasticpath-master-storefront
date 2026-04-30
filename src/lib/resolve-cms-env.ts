export const cmsConfig = cmsEnv();

function cmsEnv(): {
  enabledStoryblok: boolean;
  enableBuilderIO: boolean;
  enablePlasmic: boolean;
  storyblokApi: string;
  builderApi: string;
  plasmicProjectId: string;
  plasmicApiToken: string;
} {
  const cmsProvider = process.env.NEXT_PUBLIC_CMS_PROVIDER || "storyblok";
  const enabledStoryblok = cmsProvider === "storyblok";
  const enableBuilderIO = cmsProvider === "builder-io";
  const enablePlasmic = cmsProvider === "plasmic";
  const storyblokApi = process.env.NEXT_PUBLIC_STORYBLOK_API_KEY || "";
  const builderApi = process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "";
  const plasmicProjectId = process.env.NEXT_PUBLIC_PLASMIC_PROJECT_ID || "";
  const plasmicApiToken = process.env.NEXT_PUBLIC_PLASMIC_API_TOKEN || "";

  return {
    enabledStoryblok,
    enableBuilderIO,
    enablePlasmic,
    storyblokApi,
    builderApi,
    plasmicProjectId,
    plasmicApiToken,
  };
}
