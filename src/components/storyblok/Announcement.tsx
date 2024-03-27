'use client'

import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { storyblokEditable } from "@storyblok/react";

const Announcement = ({ blok }: any) => {
  return (
    blok.enable && (
      <div className="mx-auto max-w-2xl flex lg:max-w-7xl lg:px-8 py-4 border-primary-800 border-2 rounded-lg text-left" {...storyblokEditable(blok)}>
        <ExclamationCircleIcon className="w-16 text-primary-800 mr-4"/>
        <span>{blok.title}</span>
      </div>
    )
  )
};

export default Announcement;
