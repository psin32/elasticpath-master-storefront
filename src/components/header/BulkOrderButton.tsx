"use client";
import { useRouter } from "next/navigation";

const BulkOrderButton = () => {
  const router = useRouter();
  return (
    <div className="text-sm ml-2 mt-1">
      <button
        className="px-4 py-2 bg-white text-black rounded-md hover:bg-brand-highlight border border-input border-black/40 focus-visible:ring-0 focus-visible:border-black"
        onClick={() => router.push("/bulk-order", { scroll: false })}
      >
        Bulk Order
      </button>
    </div>
  );
};

export default BulkOrderButton;
