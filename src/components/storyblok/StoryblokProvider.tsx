"use client";
import { storyblokInit, apiPlugin } from "@storyblok/react";
import Feature from "./Feature";
import Grid from "./Grid";
import Page from "./Page";
import Menu from "./Menu";
import MenuLink from "./MenuLink";
import Teaser from "./Teaser";
import HeroBanner from "./HeroBanner";
import HeroCarousel from "./HeroCarousel";
import Announcement from "./Announcement";
import HeaderLogo from "./HeaderLogo";
import Banner from "./Banner";
import ProductContent from "./ProductContent";
import Footer from "./Footer";
import CatalogMenu from "./CatalogMenu";
import Membership from "./Membership";

const components = {
  feature: Feature,
  grid: Grid,
  teaser: Teaser,
  page: Page,
  mega_menu: Menu,
  menu_link: MenuLink,
  hero_banner: HeroBanner,
  hero_carousel: HeroCarousel,
  announcement: Announcement,
  logo: HeaderLogo,
  banner: Banner,
  product: ProductContent,
  footer: Footer,
  catalog_menu: CatalogMenu,
  membership: Membership,
};

storyblokInit({
  accessToken: process.env.NEXT_PUBLIC_STORYBLOK_API_KEY,
  use: [apiPlugin],
  components,
  apiOptions: {
    region: "",
  },
});

export default function StoryblokProvider({ children }: any) {
  return children;
}
