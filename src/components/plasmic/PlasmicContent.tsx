"use client";

import { PlasmicComponent, PlasmicRootProvider } from "@plasmicapp/loader-nextjs";
import { PLASMIC } from "./plasmic-loader";

type PlasmicContentProps = {
  component: string;
  componentProps?: Record<string, unknown>;
};

export default function PlasmicContent({
  component,
  componentProps,
}: PlasmicContentProps) {
  if (!PLASMIC) {
    return null;
  }

  return (
    <PlasmicRootProvider loader={PLASMIC}>
      <PlasmicComponent component={component} componentProps={componentProps} />
    </PlasmicRootProvider>
  );
}
