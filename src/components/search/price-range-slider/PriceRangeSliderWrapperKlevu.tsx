import PriceRangeSliderComponent from "./PriceRangeSliderKlevu";

export default function PriceRangeSliderWrapper({
  min,
  max,
}: {
  min?: string;
  max?: string;
}): JSX.Element {
  return (
    <>
      <h3 className="mt-5 pb-1 font-semibold">Price</h3>
      <PriceRangeSliderComponent min={min} max={max} />
    </>
  );
}
