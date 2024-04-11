import { useConnector } from 'react-instantsearch';
import connectRatingMenu from 'instantsearch.js/es/connectors/rating-menu/connectRatingMenu';

import type {
  RatingMenuConnectorParams,
  RatingMenuWidgetDescription,
} from 'instantsearch.js/es/connectors/rating-menu/connectRatingMenu';
import StarRatings from 'react-star-ratings';

export type UseRatingMenuProps = RatingMenuConnectorParams;

export function useRatingMenu(props?: UseRatingMenuProps) {
  return useConnector<RatingMenuConnectorParams, RatingMenuWidgetDescription>(
    connectRatingMenu,
    props
  );
}

const RatingRefinement = ({ attribute }: { attribute: string }) => {
  const { items, refine } = useRatingMenu({ attribute, max: 6 });

  return (
    <div className="flex flex-col gap-2" key={attribute}>
      <h3 className="mt-5 pb-1 font-semibold">Ratings</h3>
      {items.map((item) => (
        <div className="flex items-center" key={item.value}>
          <label className="mr-2 cursor-pointer">
            <input
              className="mr-2"
              type="checkbox"
              checked={item.isRefined}
              onChange={() => refine(item.value)}
            />
            <StarRatings
              rating={Number(item.label)}
              starDimension="18px"
              starSpacing="0px"
              starRatedColor="orange"
            />
          </label>
          <div className="ml-1 flex items-center justify-center rounded-md border bg-gray-200 px-1.5 py-0.5 text-xs font-medium">
            {item.count}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RatingRefinement;
