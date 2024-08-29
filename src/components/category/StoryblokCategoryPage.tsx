import { getCategoryContent } from "../../services/storyblok";
import { StoryblokComponent } from "../storyblok/Storyblok";

interface ICategoryPage {
  categories: string[];
}

export default async function StoryblokCategoryPage(params: ICategoryPage) {
  const content = await getCategoryContent(params.categories);

  return (
    <>
      {content?.story?.content && (
        <StoryblokComponent blok={content?.story.content} />
      )}
    </>
  );
}
