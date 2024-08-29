import BuilderCategoryPage from "../../../components/category/BuilderCategoryPage";
import StoryblokCategoryPage from "../../../components/category/StoryblokCategoryPage";
import { cmsConfig } from "../../../lib/resolve-cms-env";

type IContent = {
  params: { slugs: string[] };
};

export default function Content({ params }: IContent) {
  const { enabledStoryblok, enableBuilderIO } = cmsConfig;

  return (
    <main className="flex flex-col justify-between">
      {enabledStoryblok && <StoryblokCategoryPage categories={params.slugs} />}
      {enableBuilderIO && <BuilderCategoryPage categories={params.slugs} />}
    </main>
  );
}
