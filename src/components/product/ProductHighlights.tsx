import { Extensions } from "@moltin/sdk";
import { isSupportedExtension } from "../../lib/is-supported-extension";

interface IProductHighlights {
  extensions: Extensions;
}

const ProductHighlights = ({ extensions }: IProductHighlights): JSX.Element => {
  const highlights: (string | number | boolean)[] =
    extensions?.["products(highlights)"] &&
    Object.values(extensions?.["products(highlights)"])?.flat();
  return (
    highlights && (
      <div className="flex flex-col gap-4 sm:gap-6">
        <div>
          <span className="mb-4 text-base font-medium uppercase text-gray-800 lg:text-lg">
            Product Highlights
          </span>
          <dl>
            <ul className="list-disc ml-6 mt-4 text-gray-700" key="highlights">
              {highlights.map(
                (highlight: string | number | boolean, index: number) => {
                  return highlight && <li key={index}>{highlight}</li>;
                },
              )}
            </ul>
          </dl>
        </div>
      </div>
    )
  );
};

export default ProductHighlights;
