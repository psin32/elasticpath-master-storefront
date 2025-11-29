"use client";

import Link from "next/link";
import Image from "next/image";
import { EyeSlashIcon } from "@heroicons/react/24/outline";
import StrikePrice from "../../../product/StrikePrice";
import Price from "../../../product/Price";
import clsx from "clsx";
import { LockClosedIcon } from "@heroicons/react/20/solid";
import {
  useAuthedAccountMember,
  useCart,
} from "../../../../react-shopper-hooks";
import { StatusButton } from "../../../button/StatusButton";
import { Sheet, SheetContent } from "../../../sheet/Sheet";
import { useState, useEffect, useRef } from "react";
import { parseProductResponse } from "../../../../shopper-common/src/products/util/shopper-product-helpers";
import {
  ProductDetailsComponent,
  ProductProvider,
} from "../../../../app/(store)/products/[productId]/product-display";
import { getEpccImplicitClient } from "../../../../lib/epcc-implicit-client";
import LoginToSeePriceButton from "../../../product/LoginToSeePriceButton";
import { usePathname } from "next/navigation";
import { getCookie } from "cookies-next";
import { COOKIE_PREFIX_KEY } from "../../../../lib/resolve-cart-env";
import { getAllInventoriesByProductId } from "../../../../services/multi-location-inventory";

// Cache to prevent duplicate API calls for the same product SKU
const productCache = new Map<string, Promise<any>>();

export interface ProductCardProps {
  product: any;
  locationInventory?: number;
  useMultiLocation?: boolean;
  selectedLocationSlug?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  locationInventory: propLocationInventory,
  useMultiLocation: propUseMultiLocation,
  selectedLocationSlug: propSelectedLocationSlug,
}) => {
  const {
    main_image,
    response: {
      meta: { display_price, original_display_price, variation_matrix },
      attributes: { name, components, slug, extensions },
      quantity,
      id,
    },
  } = product;
  const { selectedAccountToken } = useAuthedAccountMember();
  const gatedSetting = selectedAccountToken?.account_id
    ? undefined
    : extensions?.["products(gated)"]?.setting;
  const ep_main_image_url = main_image?.link.href;

  const currencyPrice =
    display_price?.without_tax?.formatted || display_price?.with_tax?.formatted;

  const { useScopedAddProductToCart } = useCart();
  const { mutate, isPending } = useScopedAddProductToCart();
  const isStandardProduct =
    product.kind === "simple-product" && !components && !variation_matrix;
  const [open, setOpen] = useState(false);
  const isVariationProduct = !!variation_matrix;

  const [shopperProduct, setShopperProduct] = useState<any>(null);
  const pathname = usePathname();
  const loginUrl = `/login?returnUrl=${encodeURIComponent(pathname)}`;
  const sku = product.response.attributes.sku;
  const fetchedSkuRef = useRef<string | null>(null);

  // Multi-location inventory state
  // Use props if provided (from ProductGrid), otherwise fetch individually
  const [useMultiLocation, setUseMultiLocation] = useState<boolean>(
    propUseMultiLocation !== undefined ? propUseMultiLocation : false,
  );
  const [selectedLocationSlug, setSelectedLocationSlug] = useState<string>(
    propSelectedLocationSlug || "",
  );
  const [selectedLocationName, setSelectedLocationName] = useState<string>("");
  const [locationInventory, setLocationInventory] = useState<number | null>(
    propLocationInventory !== undefined ? propLocationInventory : null,
  );
  const [inventoryLoaded, setInventoryLoaded] = useState<boolean>(
    propLocationInventory !== undefined,
  );

  useEffect(() => {
    // Skip if already fetched for this SKU
    if (!sku || fetchedSkuRef.current === sku) {
      return;
    }

    const init = async () => {
      // Check if there's already a pending request for this SKU
      let fetchPromise = productCache.get(sku);

      if (!fetchPromise) {
        // Create a new fetch promise and cache it
        fetchPromise = (async () => {
          const client = getEpccImplicitClient();
          const result = await client.ShopperCatalog.Products.With([
            "main_image",
            "files",
            "component_products",
          ])
            .Filter({
              eq: {
                sku: sku,
              },
            })
            .All();
          return await parseProductResponse(result, client);
        })();

        productCache.set(sku, fetchPromise);
      }

      try {
        const parsedProduct = await fetchPromise;
        setShopperProduct(parsedProduct);
        fetchedSkuRef.current = sku;
      } catch (error) {
        console.error("Error fetching product:", error);
        // Remove from cache on error so it can be retried
        productCache.delete(sku);
        fetchedSkuRef.current = null;
      }
    };

    init();
  }, [sku]);

  // Update state when props change (from ProductGrid)
  useEffect(() => {
    if (propLocationInventory !== undefined) {
      setLocationInventory(propLocationInventory);
      setInventoryLoaded(true);
    }
    if (propUseMultiLocation !== undefined) {
      setUseMultiLocation(propUseMultiLocation);
    }
    if (propSelectedLocationSlug) {
      setSelectedLocationSlug(propSelectedLocationSlug);
      setSelectedLocationName(propSelectedLocationSlug); // Use slug as name fallback
    }
  }, [propLocationInventory, propUseMultiLocation, propSelectedLocationSlug]);

  // Check multi-location inventory setting and fetch inventory (only if props not provided)
  useEffect(() => {
    // Skip if inventory was already provided via props
    if (
      propLocationInventory !== undefined ||
      propUseMultiLocation !== undefined
    ) {
      return;
    }

    const initInventory = async () => {
      // Check if multi-location is enabled
      const multiLocationValue = getCookie("use_multi_location_inventory");
      const isEnabled = multiLocationValue !== "false";
      setUseMultiLocation(isEnabled);

      if (!isEnabled || !isStandardProduct) {
        setInventoryLoaded(true);
        return;
      }

      // Get selected location from cookie
      const locationSlug = getCookie(`${COOKIE_PREFIX_KEY}_ep_location`);
      if (!locationSlug) {
        setInventoryLoaded(true);
        return;
      }

      try {
        const client = getEpccImplicitClient();
        const inventoriesResponse = await getAllInventoriesByProductId(
          id,
          client,
        );
        const inventories = inventoriesResponse?.data as any;

        if (!inventories || !inventories?.attributes?.locations) {
          // Multi-location not configured for this product
          setInventoryLoaded(true);
          return;
        }

        const locationData =
          inventories?.attributes?.locations?.[locationSlug as string];
        if (locationData) {
          setSelectedLocationSlug(locationSlug as string);
          setSelectedLocationName(locationSlug as string); // Use slug as fallback
          setLocationInventory(locationData.available || 0);
        } else {
          setLocationInventory(0);
        }
      } catch (error) {
        console.error("Error fetching inventory for product card:", error);
      } finally {
        setInventoryLoaded(true);
      }
    };

    initInventory();
  }, [id, isStandardProduct, propLocationInventory, propUseMultiLocation]);

  return (
    <div className="max-w-full sm:max-w-lg p-3 flex flex-col h-full">
      <LinkWrapper
        href={display_price ? `/products/${slug}` : loginUrl}
        passHref
        disabled={gatedSetting}
      >
        <div
          className="group flex h-full cursor-pointer flex-col items-stretch bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          data-testid={id}
        >
          <div className="relative overflow-hidden rounded-t-lg border-l border-r border-t pb-[100%]">
            {ep_main_image_url ? (
              <div>
                <Image
                  className={clsx(
                    "relative h-full w-full transition duration-300 ease-in-out group-hover:scale-105",
                    gatedSetting && "blur-sm",
                  )}
                  src={ep_main_image_url}
                  alt={name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{
                    objectFit: "contain",
                    objectPosition: "center",
                  }}
                />
                {gatedSetting && (
                  <div className="absolute top-2 left-2 bg-black/50 text-white p-2 rounded-full">
                    <LockClosedIcon className="w-3 h-3" />
                  </div>
                )}
              </div>
            ) : (
              <div className="absolute flex h-full w-full items-center justify-center bg-gray-200">
                <EyeSlashIcon width={10} height={10} />
              </div>
            )}
            {components && (
              <div className="absolute bg-red-600 text-white top-1 rounded-md pr-1 pl-1 right-2 text-sm">
                <h4>Bundle</h4>
              </div>
            )}
            {variation_matrix && (
              <div className="absolute bg-red-600 text-white top-1 rounded-md pr-1 pl-1 right-2 text-sm">
                <h4>Variation</h4>
              </div>
            )}
          </div>
          <div className="flex h-full flex-col gap-2 rounded-b-lg border-b border-l border-r p-4 flex-grow">
            <div className="h-16 flex-shrink-0">
              <Link href={`/products/${slug}`} passHref legacyBehavior>
                <p className="pointer-events-none mt-2 block text-sm font-medium text-gray-900 line-clamp-2 h-12 leading-6">
                  {name}
                </p>
              </Link>
            </div>
            {/* <Ratings product={product.response} displayFromProduct={true} /> */}
            {gatedSetting != "fully_gated" && (
              <div className="flex flex-col justify-end flex-grow">
                {currencyPrice && (
                  <div className="mt-1 flex items-center">
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
                        size="text-lg"
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
                {isStandardProduct &&
                  gatedSetting !== "fully_gated" &&
                  display_price && (
                    <>
                      <div className="flex justify-center mt-4">
                        <StatusButton
                          status={isPending ? "loading" : "idle"}
                          className="w-full p-2 text-sm"
                          disabled={
                            useMultiLocation &&
                            inventoryLoaded &&
                            selectedLocationSlug &&
                            locationInventory !== undefined &&
                            locationInventory !== null
                              ? locationInventory === 0
                              : false
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();

                            // Don't add if explicitly out of stock (inventory = 0)
                            // But allow if inventory is undefined/null (MLI not configured)
                            if (
                              useMultiLocation &&
                              selectedLocationSlug &&
                              locationInventory !== undefined &&
                              locationInventory !== null &&
                              locationInventory === 0
                            ) {
                              return;
                            }

                            const data: any = {
                              custom_inputs: {
                                additional_information: [],
                              },
                            };

                            // Add location data if multi-location is enabled and location is selected
                            if (
                              useMultiLocation &&
                              selectedLocationSlug &&
                              locationInventory !== undefined &&
                              locationInventory !== null
                            ) {
                              data.custom_inputs.location = {
                                location_name: selectedLocationName,
                                available_quantity: locationInventory,
                              };
                              data.location = selectedLocationSlug;
                            }

                            mutate({
                              productId: id,
                              quantity: quantity || 1,
                              data,
                            });
                          }}
                        >
                          {useMultiLocation &&
                          inventoryLoaded &&
                          selectedLocationSlug &&
                          locationInventory !== undefined &&
                          locationInventory !== null &&
                          locationInventory === 0
                            ? "Out of Stock"
                            : "Add to Cart"}
                        </StatusButton>
                      </div>
                    </>
                  )}
                {!isStandardProduct && display_price && (
                  <div className="flex justify-center mt-4">
                    <StatusButton
                      className="w-full p-2 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setOpen(true);
                      }}
                    >
                      {isVariationProduct ? "View Product" : "View Bundle"}
                    </StatusButton>
                  </div>
                )}
                {!display_price && (
                  <LoginToSeePriceButton className="text-xs mt-2" />
                )}
              </div>
            )}
          </div>
        </div>
      </LinkWrapper>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side={undefined}
          className="w-[60vw] sm:max-w-full max-h-screen overflow-y-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fixed rounded-lg shadow-lg bg-white mt-5"
        >
          <div className="p-2">
            <ProductProvider>
              <ProductDetailsComponent
                product={shopperProduct}
                breadcrumb={[]}
                offerings={{
                  links: {},
                  meta: {
                    page: { current: 1, limit: 0, offset: 0, total: 0 },
                    results: { total: 0 },
                  },
                  data: [],
                }}
                content={null}
                relationship={[]}
                purchaseHistory={[]}
              />
            </ProductProvider>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

interface LinkWrapperProps {
  href: string;
  disabled?: boolean;
  children?: any;
  passHref?: boolean;
  className?: string;
}

const LinkWrapper = ({
  children,
  href,
  disabled,
  passHref,
  ...props
}: LinkWrapperProps) => {
  if (disabled) return children;

  return (
    <Link href={href} passHref={passHref} {...props}>
      {children}
    </Link>
  );
};

export default ProductCard;
