import Link from "next/link";
import { cookies } from "next/headers";
import { getLogo } from "../../services/storyblok";
import Content from "../storyblok/Content";

export default async function Logo() {
  const cookieStore = cookies();
  const locale = cookieStore.get("locale")?.value || "en";
  const content = await getLogo(locale);

  return (
    <div className="ml-4 flex lg:ml-0 text-white mr-4 min-w-40">
      <Link href="/">
        <Content content={content}></Content>
      </Link>
    </div>
  );
}
