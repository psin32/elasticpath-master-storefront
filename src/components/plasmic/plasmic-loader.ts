import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";
import { cmsConfig } from "../../lib/resolve-cms-env";
import PlasmicProductCarousel, {
  type PlasmicProductCarouselProps,
} from "./blocks/ProductCarousel/PlasmicProductCarousel";
import { ProductPickerControl } from "./blocks/ProductCarousel/ProductPickerControl";

const { plasmicProjectId, plasmicApiToken } = cmsConfig;

const canUsePlasmic = Boolean(plasmicProjectId && plasmicApiToken);
console.log("canUsePlasmic", canUsePlasmic);
console.log("plasmicProjectId", plasmicProjectId);
console.log("plasmicApiToken", plasmicApiToken);
export const PLASMIC = canUsePlasmic
  ? initPlasmicLoader({
      projects: [{ id: plasmicProjectId, token: plasmicApiToken }],
      host: "https://codegen.euwest.storefront.elasticpath.com",
      preview: true,
      platformOptions: { nextjs: { appDir: true } },
    })
  : null;

if (PLASMIC) {
  PLASMIC.registerComponent(PlasmicProductCarousel, {
    name: "ProductCarousel",
    description:
      "Displays an EP Catalog product carousel. Select products by ID or by a catalog node.",
    props: {
      selectionMode: {
        type: "choice",
        options: ["products", "node"],
        defaultValue: "products",
        description: "Fetch products by specific IDs or by a catalog node",
      },
      products: {
        type: "custom",
        control: ProductPickerControl,
        description:
          "Search and select EP Catalog products by name (used when Selection Mode is 'products')",
        hidden: (props: PlasmicProductCarouselProps) =>
          props.selectionMode === "node",
      },
      nodeId: {
        type: "string",
        defaultValue: "",
        description:
          "EP Catalog node ID — products belonging to this node will be shown (used when Selection Mode is 'node')",
        hidden: (props: PlasmicProductCarouselProps) =>
          props.selectionMode !== "node",
      },
      title: {
        type: "string",
        defaultValue: "",
        description: "Optional heading rendered above the carousel",
      },
      slidesToShow: {
        type: "number",
        defaultValue: 4,
        description: "Number of product cards visible at once",
      },
      slidesToScroll: {
        type: "number",
        defaultValue: 1,
        description: "Number of cards to scroll per navigation click",
      },
      autoplay: {
        type: "boolean",
        defaultValue: false,
        description: "Automatically advance the carousel",
      },
      infinite: {
        type: "boolean",
        defaultValue: false,
        description: "Loop the carousel back to the start",
      },
      showDots: {
        type: "boolean",
        defaultValue: false,
        description: "Show pagination dots below the carousel",
      },
      speed: {
        type: "number",
        defaultValue: 300,
        description: "Transition speed in milliseconds",
      },
      className: {
        type: "class",
        description: "CSS class applied to the carousel wrapper — override from Plasmic's style panel",
      },
    },
  });
}
