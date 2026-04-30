"use client";

import {
  initPlasmicLoader,
  PlasmicComponent,
  PlasmicRootProvider,
} from "@plasmicapp/loader-nextjs";
import { cmsConfig } from "../../lib/resolve-cms-env";

const { plasmicProjectId, plasmicApiToken } = cmsConfig;

const canUsePlasmic = Boolean(plasmicProjectId && plasmicApiToken);
console.log("canUsePlasmic", canUsePlasmic);
console.log("plasmicProjectId", plasmicProjectId);
console.log("plasmicApiToken", plasmicApiToken);

const PLASMIC = canUsePlasmic
  ? initPlasmicLoader({
      projects: [
        {
          id: plasmicProjectId,
          token: plasmicApiToken,
        },
      ],
      host: "https://codegen.euwest.storefront.elasticpath.com",
      preview: false,
      platformOptions: {
        nextjs: {
          appDir: true,
        },
      },
    })
  : null;

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
