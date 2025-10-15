import { ElasticPath } from "@elasticpath/js-sdk";
import { InitialState } from "../react-shopper-hooks";
import { buildSiteNavigation } from "./build-site-navigation";
import { getCartCookieServer } from "./cart-cookie-server";
import { getCart } from "../services/cart";
import { getCatalog } from "../services/catalogs";

export async function getStoreInitialState(
  client: ElasticPath,
): Promise<InitialState> {
  const [nav, catalogResponse, cartCookie] = await Promise.all([
    buildSiteNavigation(client),
    getCatalog(client).catch((err) => {
      console.error("Error fetching catalog:", err);
      return null;
    }),
    Promise.resolve(getCartCookieServer()),
  ]);

  const cart = await getCart(cartCookie, client);

  return {
    cart,
    nav,
    catalogId: catalogResponse?.data?.attributes.catalog_id,
  };
}
