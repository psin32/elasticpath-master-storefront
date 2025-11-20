"use client";

import { FC, useEffect } from "react";
import { GridSlotConfig } from "./types";
import Image from "next/image";
import Link from "next/link";

interface PromoBannerProps {
  slot: GridSlotConfig;
}

export const PromoBanner: FC<PromoBannerProps> = ({ slot }) => {
  const content = slot.content;

  // Debug: log the entire slot structure
  useEffect(() => {
    if (content?.image) {
      console.log("PromoBanner slot content:", {
        slotId: slot.id,
        content,
        image: content.image,
        imageType: typeof content.image,
      });
    }
  }, [slot, content]);

  if (!content) {
    console.warn("PromoBanner: No content provided for slot", slot.id);
    return null;
  }

  // Handle different content types from Builder.io
  // Builder.io file fields can be objects with various structures
  // Try multiple possible paths for the image URL
  const getImageUrl = () => {
    if (!content.image) return null;

    // Builder.io file field can be:
    // - A string URL directly
    if (typeof content.image === "string") {
      return content.image;
    }

    // - An object with url property (most common)
    if (content.image.url) {
      return content.image.url;
    }

    // - An object with src property
    if (content.image.src) {
      return content.image.src;
    }

    // - An object with image property (nested)
    if (content.image.image?.url) {
      return content.image.image.url;
    }

    // - An object with href property
    if (content.image.href) {
      return content.image.href;
    }

    // - Builder.io asset format: check for data attributes
    if (content.image.data?.url) {
      return content.image.data.url;
    }

    // - Builder.io asset format: check for asset property
    if (content.image.asset?.url) {
      return content.image.asset.url;
    }

    // - Check if it's a Builder.io image URL pattern
    if (
      content.image.toString &&
      content.image.toString().includes("builder.io")
    ) {
      return content.image.toString();
    }

    return null;
  };

  const imageUrl = getImageUrl() || content.imageUrl;
  const title = content.title || content.heading;
  const description = content.description || content.text;
  const linkUrl = content.link?.url || content.url;
  const linkText = content.linkText || content.ctaText || content.link?.text;

  // Debug: log content structure if image is missing
  if (!imageUrl && content.image) {
    console.log("PromoBanner: Image object structure:", content.image);
  }

  return (
    <div className="relative w-full h-full min-h-[200px] rounded-lg overflow-hidden bg-gray-100">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={title || "Promotional banner"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized={!imageUrl.startsWith("/")}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-400">
          <span className="text-sm">No image</span>
        </div>
      )}
      {(title || description || linkUrl) && (
        <div className="absolute inset-0 flex flex-col justify-center items-center p-6 bg-black/20">
          {title && (
            <h3 className="text-2xl font-bold text-white mb-2 text-center">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-white text-center mb-4">{description}</p>
          )}
          {linkUrl && (
            <Link
              href={linkUrl}
              className="px-6 py-2 bg-white text-gray-900 rounded-md font-semibold hover:bg-gray-100 transition-colors"
            >
              {linkText || "Learn More"}
            </Link>
          )}
        </div>
      )}
    </div>
  );
};
