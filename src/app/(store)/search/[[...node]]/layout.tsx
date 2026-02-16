import { ReactNode } from "react";
import Breadcrumb from "../../../../components/breadcrumb";
import { StorefrontProvider } from "../../../../lib/epcc-storefront-client";

export default function SearchLayout({ children }: { children: ReactNode }) {
  return (
    <StorefrontProvider>
      <div className="px-4 py-4 mx-auto max-w-[85%]">
        <Breadcrumb />
        {children}
      </div>
    </StorefrontProvider>
  );
}
