'use client'

import { storyblokEditable } from "@storyblok/react";

const HeroBanner = ({ blok }: any) => {
  return (
    blok.enable && (
      <div {...storyblokEditable(blok)} className="mx-auto">
        <div className="relative overflow-hidden bg-gray-900 px-6 py-20 shadow-xl sm:px-10 sm:py-24 md:px-12 lg:px-20 h-full">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src={blok.image_url?.filename}
            alt=""
          />
          <div className="relative my-auto mx-auto max-w-xl lg:mx-0 h-[250px] text-left">
            <blockquote className="mt-6 text-xl sm:text-xl sm:leading-8 text-gray-950 bg-white p-8">
              <div className="font-semibold text-4xl mb-4">{blok.title}</div>
              <p>
                {blok.description}
              </p>
              {blok.button_text && blok.link.url && (
                <div className="mt-8">
                  <a href={blok.link.url} role="button" data-te-ripple-init data-te-ripple-color="primary"
                    className="rounded-full border-transparent px-8 py-4 text-sm font-medium uppercase leading-normal text-black  drop-shadow-2x bg-brand-primary hover:bg-brand-highlight">
                    {blok.button_text}
                  </a>
                </div>
              )}
            </blockquote>
          </div>
        </div>
      </div>
    )
  )
};

export default HeroBanner;
