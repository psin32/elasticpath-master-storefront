'use client'

import { storyblokEditable } from "@storyblok/react";

const Footer = ({ blok }: any) => {
  return (
    blok.enable && (
      <footer {...storyblokEditable(blok)} className="bg-white">
        <div className="mx-auto max-w-7xl overflow-hidden px-6 py-20 sm:py-24 lg:px-8">
          <nav className="-mb-6 columns-2 sm:flex sm:justify-center sm:space-x-12" aria-label="Footer">
            {blok?.menu?.map((nestedBlok: any) => (
              <div key={nestedBlok.name} className="pb-6">
                <a href={nestedBlok.url.url} className="text-sm leading-6 text-gray-600 hover:text-gray-900">
                  {nestedBlok.name}
                </a>
              </div>
            ))}
          </nav>
          <div className="mt-10 flex justify-center space-x-10">
            {blok?.socials?.map((nestedBlok: any) => (
              <a key={nestedBlok.name} href={nestedBlok.url.url} className="text-gray-400 hover:text-gray-500">
                <img className="h-6 w-6" aria-hidden="true" src={nestedBlok?.logo?.filename} alt={nestedBlok?.name} />
              </a>
            ))}
          </div>
          <p className="mt-10 text-center text-xs leading-5 text-gray-500">
            {blok?.text}
          </p>
        </div>
      </footer>
    )
  )
};

export default Footer;
