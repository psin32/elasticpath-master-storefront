"use client";
import { useRouter } from "next/navigation";

const BulkOrderButton = () => {
  const router = useRouter();
  return (
    <div className="text-sm ml-2 mt-1">
      <button
        className="px-4 py-2 min-w-32 bg-white text-black rounded-md hover:text-brand-primary border border-input border-black/40 hover:border-brand-primary focus-visible:ring-0 focus-visible:border-black"
        onClick={() => router.push("/bulk-order", { scroll: false })}
      >
        Bulk Order
      </button>
    </div>
  );
};

export default BulkOrderButton;
