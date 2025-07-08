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
import { useState, useEffect } from "react";
import { parseProductResponse } from "../../../../shopper-common/src/products/util/shopper-product-helpers";
import {
  ProductDetailsComponent,
  ProductProvider,
} from "../../../../app/(store)/products/[productId]/product-display";
import { getEpccImplicitClient } from "../../../../lib/epcc-implicit-client";

export interface ProductCardProps {
  product: any;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
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

  useEffect(() => {
    const init = async () => {
      const client = getEpccImplicitClient();
      const result = await client.ShopperCatalog.Products.With([
        "main_image",
        "files",
        "component_products",
      ])
        .Filter({
          eq: {
            sku: product.response.attributes.sku,
          },
        })
        .All();
      setShopperProduct(await parseProductResponse(result, client));
    };
    init();
  }, [product]);

  return (
    <div className="max-w-full sm:max-w-lg p-3 flex flex-col">
      <LinkWrapper href={`/products/${slug}`} passHref disabled={gatedSetting}>
        <div
          className="group flex h-full cursor-pointer flex-col items-stretch"
          data-testid={id}
        >
          <div className="relative  overflow-hidden rounded-t-lg border-l border-r border-t pb-[100%]">
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
          <div className="flex h-full flex-col gap-2 rounded-b-lg border-b border-l border-r p-4">
            <div className="h-full">
              <Link href={`/products/${slug}`} passHref legacyBehavior>
                <p className="pointer-events-none mt-2 block truncate text-md font-medium text-gray-900">
                  {name}
                </p>
              </Link>
            </div>
            {/* <Ratings product={product.response} displayFromProduct={true} /> */}
            {gatedSetting != "fully_gated" && (
              <div>
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
                {isStandardProduct && gatedSetting !== "fully_gated" && (
                  <div className="flex justify-center mt-4">
                    <StatusButton
                      status={isPending ? "loading" : "idle"}
                      className="w-full p-2 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        mutate({
                          productId: id,
                          quantity: quantity || 1,
                          data: {
                            custom_inputs: {
                              additional_information: [],
                            },
                          },
                        });
                      }}
                    >
                      Add to Cart
                    </StatusButton>
                  </div>
                )}
                {!isStandardProduct && (
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
