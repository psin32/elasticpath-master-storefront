import { SearchHit } from "./SearchHit";
import Link from "next/link";
import Price from "../product/Price";
import StrikePrice from "../product/StrikePrice";
import { EyeSlashIcon } from "@heroicons/react/24/solid";
import { ProductResponse } from "@elasticpath/js-sdk";
import Ratings from "../reviews/yotpo/Ratings";
import {
  MinusIcon,
  PlusIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import { StatusButton } from "../button/StatusButton";
import LoginToSeePriceButton from "../product/LoginToSeePriceButton";
import { getCookie } from "cookies-next";

export default function HitComponentAlgoliaList({
  hit,
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
  onGetVariants,
  hasInventory = true,
  availableQuantity,
  useMultiLocation,
  locations,
  productInventory,
  selectedLocationSlug,
  onLocationSelect,
  onMakeAndShip,
}: {
  hit: SearchHit;
  product: ProductResponse;
  quantity: number;
  onQuantityChange: (productId: string, quantity: number) => void;
  onAddToCart: (productId: string) => void;
  onGetVariants?: (productId: string, variationMatrix: any) => Promise<void>;
  hasInventory?: boolean;
  availableQuantity?: number;
  useMultiLocation?: boolean;
  locations?: any[];
  productInventory?: Record<string, number>;
  selectedLocationSlug?: string;
  onLocationSelect?: (productId: string, locationSlug: string) => void;
  onMakeAndShip?: (productId: string, locationSlug?: string) => void;
}): JSX.Element {
  const { ep_name, objectID, ep_main_image_url, ep_description, ep_slug } = hit;

  const {
    meta: { display_price, original_display_price, variation_matrix },
    attributes: { components, extensions },
  } = product;

  // Check if Make and Ship button should be shown
  const makeToShipWarehouses =
    extensions?.["products(global)"]?.make_to_ship_warehouses;

  const showInventoryOnPLPValue = getCookie("show_inventory_on_plp");
  const showInventoryOnPLP = showInventoryOnPLPValue === "true";

  return (
    <div
      className="p-4 border rounded shadow-sm relative"
      data-testid={objectID}
    >
      {quantity > 0 && (
        <CheckCircleIcon className="w-6 h-6 text-green-500 absolute top-0 left-0 z-10" />
      )}
      {/* Main product info row */}
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-1">
          {ep_main_image_url ? (
            <div className="relative">
              <img
                src={ep_main_image_url}
                alt={ep_name}
                className="w-20 h-24 object-cover transition duration-300 ease-in-out group-hover:scale-105 hover:scale-105"
              />
            </div>
          ) : (
            <div className="w-20 h-24 flex items-center justify-center bg-gray-200">
              <EyeSlashIcon width={10} height={10} />
            </div>
          )}
        </div>
        <div className="col-span-5">
          <h2 className="text-lg text-gray-800 font-semibold hover:text-brand-primary">
            <Link href={`/products/${ep_slug}`} legacyBehavior>
              {ep_name}
            </Link>
          </h2>
          <span
            className="mt-2 line-clamp-6 text-xs font-medium leading-5 text-gray-500"
            dangerouslySetInnerHTML={{ __html: ep_description }}
          ></span>
        </div>
        <div className="col-span-2 text-green-500 font-bold">
          {display_price && (
            <div className="flex items-center mt-2">
              {product?.meta?.component_products && (
                <div className="mr-1 text-md">FROM </div>
              )}
              {original_display_price && (
                <StrikePrice
                  price={
                    original_display_price?.without_tax?.formatted
                      ? original_display_price?.without_tax?.formatted
                      : original_display_price.with_tax.formatted
                  }
                  currency={
                    original_display_price.without_tax?.currency
                      ? original_display_price?.without_tax?.currency
                      : original_display_price.with_tax.currency
                  }
                  size="text-md"
                />
              )}
              <Price
                price={
                  display_price?.without_tax?.formatted
                    ? display_price?.without_tax?.formatted
                    : display_price.with_tax.formatted
                }
                currency={
                  display_price?.without_tax?.currency
                    ? display_price?.without_tax?.currency
                    : display_price.with_tax.currency
                }
                original_display_price={original_display_price}
                size="text-xl"
              />
            </div>
          )}
          <div className="mt-2">
            <Ratings product={product} displayFromProduct={true} />
          </div>
        </div>
        <div className="col-span-2">
          {!variation_matrix && !components && hasInventory && (
            <div className="flex w-32 items-start rounded-lg border border-black/10">
              <button
                type="submit"
                onClick={() => onQuantityChange(objectID, quantity - 1)}
                className="ease flex w-9 h-9 mt-1 justify-center items-center transition-all duration-200"
              >
                <MinusIcon className="h-4 w-4 dark:text-neutral-500" />
              </button>
              <svg
                width="2"
                height="42"
                viewBox="0 0 2 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 0V36"
                  stroke="black"
                  strokeOpacity="0.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <input
                type="number"
                placeholder="Quantity"
                className="border-none focus-visible:ring-0 focus-visible:border-black w-12 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={quantity}
                onChange={(e) =>
                  onQuantityChange(objectID, parseInt(e.target.value) || 0)
                }
              />
              <svg
                width="2"
                height="42"
                viewBox="0 0 2 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 0V36"
                  stroke="black"
                  strokeOpacity="0.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <button
                type="submit"
                onClick={() => onQuantityChange(objectID, quantity + 1)}
                className="ease flex w-9 h-9 mt-1 justify-center items-center transition-all duration-200"
              >
                <PlusIcon className="h-4 w-4 dark:text-neutral-500" />
              </button>
            </div>
          )}
          {!variation_matrix && !components && !hasInventory && (
            <div className="text-sm text-gray-500">
              {availableQuantity !== undefined && (
                <span className="block">Available: {availableQuantity}</span>
              )}
            </div>
          )}
        </div>
        <div className="col-span-2">
          {!variation_matrix &&
            !components &&
            display_price &&
            hasInventory && (
              <StatusButton
                className="py-2 w-32 text-sm px-2"
                onClick={() => onAddToCart(objectID)}
                variant={quantity > 0 ? "primary" : "secondary"}
                disabled={quantity === 0}
              >
                Add to Cart
              </StatusButton>
            )}
          {!variation_matrix &&
            !components &&
            display_price &&
            !hasInventory && (
              <div className="py-2 w-32 text-sm px-2 text-center font-medium text-red-600">
                Out of Stock
              </div>
            )}

          {variation_matrix && onGetVariants && display_price && (
            <StatusButton
              className="py-2 text-xs w-32"
              onClick={() => onGetVariants(objectID, variation_matrix)}
            >
              Choose Variants
            </StatusButton>
          )}

          {components && display_price && (
            <Link href={`/products/${ep_slug}`} legacyBehavior>
              <StatusButton className="py-2 text-xs w-32">
                View Bundle
              </StatusButton>
            </Link>
          )}

          {!display_price && <LoginToSeePriceButton className="text-xs mt-2" />}
        </div>
      </div>

      {showInventoryOnPLP &&
        useMultiLocation &&
        locations &&
        locations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold mb-3 text-gray-700">
              Inventory by Location:
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {locations.map((location: any) => {
                const locSlug = location.attributes?.slug;
                const locName = location.attributes?.name || locSlug;
                const inventory =
                  productInventory && productInventory[locSlug] !== undefined
                    ? productInventory[locSlug]
                    : "N/A";
                const isSelected = locSlug === selectedLocationSlug;

                // Check if this location is a Make and Ship warehouse
                const isMakeAndShipWarehouse = (() => {
                  if (
                    !makeToShipWarehouses ||
                    typeof makeToShipWarehouses !== "string"
                  )
                    return false;
                  const warehouses = makeToShipWarehouses
                    .split(",")
                    .map((w: string) => w.trim());
                  return warehouses.includes(locSlug);
                })();

                return (
                  <div
                    key={location.id}
                    className={`text-xs p-3 rounded-md border transition-all ${
                      isSelected
                        ? "bg-brand-primary/10 border-brand-primary shadow-sm"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onLocationSelect?.(objectID, locSlug)}
                      className="w-full text-left"
                    >
                      <div
                        className={`font-semibold mb-1 ${
                          isSelected ? "text-brand-primary" : "text-gray-700"
                        }`}
                      >
                        {locName}
                      </div>
                      <div
                        className={`text-sm font-bold ${
                          inventory === "N/A" || Number(inventory) === 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {inventory === "N/A"
                          ? "Out of Stock"
                          : `${inventory} units`}
                      </div>
                    </button>
                    {isMakeAndShipWarehouse && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Trigger make and ship with the specific location from this card
                            onMakeAndShip?.(objectID, locSlug);
                          }}
                          disabled={quantity === 0}
                          className="w-full inline-flex items-center justify-center gap-1 bg-blue-50 border border-blue-300 px-2 py-1 rounded-md text-xs font-semibold text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                            />
                          </svg>
                          Make & Ship
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
    </div>
  );
}
