import type {
  RangeConnectorParams,
  RangeWidgetDescription,
} from "instantsearch.js/es/connectors/range/connectRange";
import connectRange from "instantsearch.js/es/connectors/range/connectRange";
import { useConnector } from "react-instantsearch";
import PriceRangeSliderComponent from "./PriceRangeSlider";

export type UseRangeSliderProps = RangeConnectorParams & {
  name?: string;
};

export default function PriceRangeSliderWrapper(
  props: UseRangeSliderProps,
): JSX.Element {
  const { name, ...rangeProps } = props;

  const useRangeSlider = (props?: RangeConnectorParams) => {
    return useConnector<RangeConnectorParams, RangeWidgetDescription>(
      connectRange,
      props,
    );
  };

  const data = useRangeSlider(rangeProps);
  if (!data.range.max) return <></>;

  return (
    <>
      <h3 className="mt-5 pb-1 font-semibold">{name || "Price"}</h3>
      <PriceRangeSliderComponent {...data} />
    </>
  );
}
