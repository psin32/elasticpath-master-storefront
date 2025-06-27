import { Inter } from "next/font/google";
import { ReactNode } from "react";
import { getStoreInitialState } from "../../lib/get-store-initial-state";
import { getServerSideImplicitClient } from "../../lib/epcc-server-side-implicit-client";
import { Providers } from "../providers";
import clsx from "clsx";
import NextAuthSessionProvider from "../../components/header/admin/SessionProviders";
import { CheckoutProvider } from "./checkout/checkout-provider";
import { cookies } from "next/headers";
import { COOKIE_PREFIX_KEY } from "../../lib/resolve-cart-env";
import { getServerSideCredentialsClient } from "../../lib/epcc-server-side-credentials-client";

const { SITE_NAME } = process.env;
const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SITE_NAME!,
    template: `%s | ${SITE_NAME}`,
  },
  robots: {
    follow: true,
    index: true,
  },
};

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default async function CheckoutLayout({
  children,
}: {
  children: ReactNode;
}) {
  const client = getServerSideImplicitClient();
  const initialState = await getStoreInitialState(client);

  // Get cart data for CheckoutProvider
  const cookieStore = cookies();
  const cartCookie = cookieStore.get(`${COOKIE_PREFIX_KEY}_ep_cart`);
  const epccClient = getServerSideCredentialsClient();
  const cart = await epccClient.Cart(cartCookie?.value).With("items").Get();

  return (
    <NextAuthSessionProvider>
      <html lang="en" className={clsx(inter.variable, "h-full bg-white")}>
        <body className="h-full">
          {/* headless ui needs this div - https://github.com/tailwindlabs/headlessui/issues/2752#issuecomment-1745272229 */}
          <div className="h-full">
            <Providers initialState={initialState}>
              <CheckoutProvider cart={cart}>
                <main className="h-full">{children}</main>
              </CheckoutProvider>
            </Providers>
          </div>
        </body>
      </html>
    </NextAuthSessionProvider>
  );
}
