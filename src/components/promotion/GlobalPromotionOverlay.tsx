"use client";

import { useCart } from "../../react-shopper-hooks/cart";
import PromotionOverlay from "./PromotionOverlay";

const GlobalPromotionOverlay = () => {
  const { isPromotionOverlayOpen, promotionSuggestions, hidePromotionOverlay } =
    useCart();

  return (
    <PromotionOverlay
      isOpen={isPromotionOverlayOpen}
      onClose={hidePromotionOverlay}
      promotionSuggestions={promotionSuggestions}
    />
  );
};

export default GlobalPromotionOverlay;
