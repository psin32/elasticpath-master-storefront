'use client'

import { storyblokEditable } from "@storyblok/react";

const HeaderLogo = ({ blok }: any) => {
  return (
    <img {...storyblokEditable(blok)} className="" src={blok?.image_url?.filename} alt={blok?.alt_text} />
  )
};

export default HeaderLogo;
