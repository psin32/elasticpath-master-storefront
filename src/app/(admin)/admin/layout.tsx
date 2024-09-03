import NextAuthSessionProvider from "../../../components/header/admin/SessionProviders";
import { AdminLayout } from "../../../components/header/admin/AdminLayout";

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
  return (
    <NextAuthSessionProvider>
      <html className="h-full bg-white">
        <body className="h-full">
          <AdminLayout>{children}</AdminLayout>
        </body>
      </html>
    </NextAuthSessionProvider>
  );
}
