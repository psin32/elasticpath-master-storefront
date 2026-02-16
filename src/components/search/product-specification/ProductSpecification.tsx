import { reviewsEnv } from "../../../lib/resolve-reviews-field-env";
import FilterCheckbox from "./FilterCheckbox";
import FilterRadio from "./FilterRadio";
import RatingRefinement from "./RatingRefinement";
import PriceRangeSliderWrapper from "../price-range-slider/PriceRangeSliderWrapper";
import { useRefinementList } from "react-instantsearch";

const ProductSpecification = () => {
  const data = process.env.NEXT_PUBLIC_FILTER_ITEMS || "";
  return (
    <>
      {reviewsEnv.enable && (
        <RatingRefinement attribute={reviewsEnv.avgRatingField} />
      )}
      {data.split(",").map((item: string) => {
        const attribute = item.split("|");
        if (attribute.length === 3) {
          const attributeName = attribute[0];

          // Checkbox: only render if refinement list has items
          if (attribute[2] === "checkbox") {
            return (
              <CheckboxIfHasItems
                attribute={attributeName}
                name={attribute[1]}
                key={attributeName}
              />
            );
          }

          // Radio: render directly (toggle refinement has no items list)
          if (attribute[2] === "radio") {
            return (
              <FilterRadio
                attribute={attributeName}
                name={attribute[1]}
                key={attributeName}
              />
            );
          }

          // Slider: PriceRangeSliderWrapper already checks for range validity
          if (attribute[2] === "slider") {
            return (
              <PriceRangeSliderWrapper
                attribute={attributeName}
                name={attribute[1]}
                key={attributeName}
              />
            );
          }
        }
        return <></>;
      })}
    </>
  );
};

export default ProductSpecification;

function CheckboxIfHasItems({
  attribute,
  name,
}: {
  attribute: string;
  name: string;
}): JSX.Element | null {
  const { items } = useRefinementList({ attribute });
  if (!items || items.length === 0) return null;
  return <FilterCheckbox attribute={attribute} name={name} />;
}
