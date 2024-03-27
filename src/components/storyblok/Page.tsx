import { storyblokEditable, StoryblokComponent } from "@storyblok/react";

const Page = ({ blok }: any) => (
  <main className="text-center" {...storyblokEditable(blok)}>
    {blok.body.map((nestedBlok: any) => (
      <StoryblokComponent blok={nestedBlok} key={nestedBlok._uid} />
    ))}
  </main>
);

export default Page;
