import NextAuthSessionProvider from "../../../components/header/admin/SessionProviders";
import { AdminLayout } from "../../../components/header/admin/AdminLayout";
import { getServerSideImplicitClient } from "../../../lib/epcc-server-side-implicit-client";
import { getStoreInitialState } from "../../../lib/get-store-initial-state";
import { Providers } from "../../providers";
import { cmsConfig } from "../../../lib/resolve-cms-env";
import { Content as BuilderContent } from "@builder.io/sdk-react";
import { builder } from "@builder.io/sdk";
import { getLogo } from "../../../services/storyblok";
import Content from "../../../components/storyblok/Content";
import { builderComponent } from "../../../components/builder-io/BuilderComponents";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Admin Console - Elastic Path",
    template: `%s | Admin Console - Elastic Path`,
  },
  robots: {
    follow: true,
    index: true,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = getServerSideImplicitClient();
  const initialState = await getStoreInitialState(client);
  const { enableBuilderIO, enabledStoryblok } = cmsConfig;
  const contentData = async () => {
    if (enableBuilderIO) {
      const content = await builder
        .get("logo", {
          prerender: false,
        })
        .toPromise();
      return content;
    }

    if (enabledStoryblok) {
      return await getLogo("en");
    }
  };
  const content = await contentData();
  return (
    <Providers initialState={initialState}>
      <NextAuthSessionProvider>
        <html className="h-full bg-white">
          <body className="h-full">
            <AdminLayout content={content}>{children}</AdminLayout>
          </body>
        </html>
      </NextAuthSessionProvider>
    </Providers>
  );
}
