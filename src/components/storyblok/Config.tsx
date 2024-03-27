import { StoryblokComponent } from "@storyblok/react";

const Config = ({ blok }: any) => (
  blok.header_menu.map((nestedBlok: any) => (
    <StoryblokComponent className='' blok={nestedBlok} key={nestedBlok._uid} />
  ))
);

export default Config;
