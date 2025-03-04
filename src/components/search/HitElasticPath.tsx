import Link from "next/link";
import Price from "../product/Price";
import StrikePrice from "../product/StrikePrice";
import { EP_CURRENCY_CODE } from "../../lib/resolve-ep-currency-code";
import Image from "next/image";
import { EyeSlashIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { LockClosedIcon } from "@heroicons/react/20/solid";

export default function HitComponentElasticPath({
  hit,
}: {
  hit: any;
}): JSX.Element {
  const {
    main_image,
    response: {
      meta: { display_price, original_display_price, variation_matrix },
      attributes: { name, description, components, slug, extensions },
      id,
    },
  } = hit;
  const gatedSetting = extensions?.["products(gated)"]?.setting;
  const ep_main_image_url = main_image?.link.href;

  // const currencyPrice = ep_price?.[EP_CURRENCY_CODE];
  const currencyPrice =
    display_price?.without_tax?.formatted || display_price?.with_tax?.formatted;

  return (
    <>
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
            {"tiers" in hit.response.attributes && (
              <div className="absolute bg-red-600 text-white top-1 rounded-md pr-1 pl-1 left-2 text-sm">
                <h4>Bulk Buy Offer</h4>
              </div>
            )}
          </div>
          <div className="flex h-full flex-col gap-2 rounded-b-lg border-b border-l border-r p-4">
            <div className="h-full">
              <Link href={`/products/${slug}`} passHref legacyBehavior>
                <h3 className="text-sm font-bold">{name}</h3>
              </Link>
              {gatedSetting != "fully_gated" && (
                <span
                  className="mt-2 line-clamp-6 text-xs font-medium leading-5 text-gray-500"
                  dangerouslySetInnerHTML={{ __html: description }}
                ></span>
              )}
            </div>
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
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </LinkWrapper>
    </>
  );
}

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
