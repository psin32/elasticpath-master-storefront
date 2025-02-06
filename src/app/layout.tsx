import { ReactNode } from "react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../styles/globals.css";

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
