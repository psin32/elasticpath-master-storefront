import { StoryblokComponent } from "@storyblok/react";
import {
  NavigationMenu,
  NavigationMenuList,
} from "../navigation-menu/NavigationMenu";

const Config = ({ blok }: any) => {
  return (
    <>
      <NavigationMenu>
        <NavigationMenuList>
          {blok.menu.map((nestedBlok: any) => (
            <StoryblokComponent className='' blok={nestedBlok} key={nestedBlok._uid} />
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </>
  )
};

export default Config;
