import { getFooter } from "../../services/storyblok";
import Content from "../storyblok/Content";
import { builder } from "@builder.io/sdk";
import { cmsConfig } from "../../lib/resolve-cms-env";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

const Footer = async () => {
  const { enableBuilderIO, enabledStoryblok } = cmsConfig;

  const contentData = async () => {
    if (enableBuilderIO) {
      const content = await builder
        .get("footer", {
          prerender: false,
        })
        .toPromise();
      return content;
    }

    if (enabledStoryblok) {
      return await getFooter();
    }
  };
  const content = await contentData();

  return (
    <>
      {enabledStoryblok && <Content content={content}></Content>}
      {enableBuilderIO && content?.data?.enabled && (
        <footer className="bg-white">
          <div className="mx-auto max-w-7xl overflow-hidden px-6 py-20 sm:py-24 lg:px-8">
            <nav
              className="-mb-6 columns-2 sm:flex sm:justify-center sm:space-x-12"
              aria-label="Footer"
            >
              {content?.data?.menu?.map((nestedBlok: any) => (
                <div key={nestedBlok.name} className="pb-6">
                  <a
                    href={nestedBlok.url}
                    className="text-sm leading-6 text-gray-600 hover:text-gray-900"
                  >
                    {nestedBlok.name}
                  </a>
                </div>
              ))}
            </nav>
            <div className="mt-10 flex justify-center space-x-10">
              {content?.data?.socials?.map((nestedBlok: any) => (
                <a
                  key={nestedBlok.name}
                  href={nestedBlok.url}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <img
                    className="h-6 w-6"
                    aria-hidden="true"
                    src={nestedBlok?.logo}
                    alt={nestedBlok?.name}
                  />
                </a>
              ))}
            </div>
            <p className="mt-10 text-center text-xs leading-5 text-gray-500">
              {content?.data?.text}
            </p>
          </div>
        </footer>
      )}
    </>
  );
};

export default Footer;
