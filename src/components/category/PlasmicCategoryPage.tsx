import PlasmicContent from "../plasmic/PlasmicContent";

interface ICategoryPage {
  categories: string[];
}

export default async function PlasmicCategoryPage(params: ICategoryPage) {
  const componentName = params?.categories?.join("-") || "homepage";
  return <PlasmicContent component={componentName} />;
}
