import { ReactNode } from "react";
import { Inter } from "next/font/google";
import { getServerSideImplicitClient } from "../../lib/epcc-server-side-implicit-client";
import { getStoreInitialState } from "../../lib/get-store-initial-state";
import { Providers } from "../providers";
import NextAuthSessionProvider from "../../components/header/admin/SessionProviders";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../../styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default async function PlasmicHostLayout({
  children,
}: {
  children: ReactNode;
}) {
  const client = getServerSideImplicitClient();
  const initialState = await getStoreInitialState(client);

  return (
    <NextAuthSessionProvider>
      <html lang="en" className={inter.variable}>
        <body>
          <Providers initialState={initialState}>{children}</Providers>
        </body>
      </html>
    </NextAuthSessionProvider>
  );
}
