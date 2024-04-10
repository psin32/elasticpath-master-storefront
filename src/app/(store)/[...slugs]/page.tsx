import CategoryPage from "../../../components/category/CategoryPage"

type IContent = {
  params: { slugs: string[] }
}

export default function Content({ params }: IContent) {
  return (
    <main className="flex flex-col justify-between">
      <CategoryPage categories={params.slugs} />
    </main>
  )
}
