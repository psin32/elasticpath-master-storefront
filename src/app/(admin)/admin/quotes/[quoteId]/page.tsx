import { Metadata } from "next";
import QuoteDetails from "./QuoteDetails";

export const metadata: Metadata = {
  title: "Quote",
};

export default async function Page({
  params,
}: {
  params: { quoteId: string };
}) {
  return <QuoteDetails quoteId={params.quoteId} />;
}
