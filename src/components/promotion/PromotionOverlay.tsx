"use client";

import { XMarkIcon } from "@heroicons/react/20/solid";
import RecommendationCarousel from "../product/RecommendationCarousel";

interface PromotionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  promotionSuggestions: any[];
}

const PromotionOverlay = ({
  isOpen,
  onClose,
  promotionSuggestions,
}: PromotionOverlayProps) => {
  if (!isOpen) return null;

  // Check if at least one suggestion has SKUs in its targets
  const hasAnySkus = promotionSuggestions.some((suggestion: any) => {
    if (Array.isArray(suggestion.targets)) {
      return suggestion.targets.some(
        (target: any) => Array.isArray(target.skus) && target.skus.length > 0,
      );
    }
    return false;
  });
  if (!hasAnySkus) return null;

  // Handler for clicking outside the overlay content
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-5xl relative border-2 border-brand-primary max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-bold mb-4 text-brand-primary pl-3">
          Product Offers
        </h2>
        <div className="pl-3">
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
            <span className="font-semibold">Note:</span> Promotion will be
            applied after the item is added into the cart.
          </div>
        </div>
        {promotionSuggestions.length > 0 ? (
          promotionSuggestions.map((suggestion: any, idx: number) => {
            // Gather all unique SKUs for this suggestion
            const allSkus: string[] = [];
            if (Array.isArray(suggestion.targets)) {
              suggestion.targets.forEach((target: any) => {
                if (Array.isArray(target.skus)) {
                  allSkus.push(...target.skus);
                }
              });
            }
            const uniqueSkus = Array.from(new Set(allSkus));
            return uniqueSkus.length > 0 ? (
              <div key={idx} className="mb-8">
                <div className="flex items-center gap-2 mb-2 uppercase">
                  {suggestion.info && (
                    <span className="text-base font-semibold text-brand-primary pl-3">
                      {suggestion.info}
                    </span>
                  )}
                </div>
                <RecommendationCarousel skus={uniqueSkus} title={undefined} />
              </div>
            ) : null;
          })
        ) : (
          <div className="text-gray-500">No recommendations found.</div>
        )}
        <div className="flex justify-end mt-6">
          <button
            className="bg-brand-primary text-white px-4 py-2 rounded hover:bg-brand-primary/90"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionOverlay;
