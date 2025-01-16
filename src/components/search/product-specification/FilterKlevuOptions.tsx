import { clsx } from "clsx";
import { useFacetClicked } from "../ProductsProviderKlevu";
import { KlevuFilterResultOptions } from "@klevu/core";
import { Facet } from "../product-specification/Facets";

function MenuItem({
  item,
  filter,
}: {
  item: KlevuFilterResultOptions | Facet;
  filter?: KlevuFilterResultOptions;
}): JSX.Element {
  const activeItem = "selected" in item ? item.selected : false;
  const facetClicked = useFacetClicked();
  const label = "label" in item ? item.label : item.name;
  const options = "options" in item ? item.options : [];
  return (
    <li
      className={clsx(
        "ais-HierarchicalMenu-item cursor-pointer",
        activeItem && clsx("ais-HierarchicalMenu-item--selected"),
      )}
    >
      {filter && (
        <label className="mr-2 cursor-pointer">
          <input
            className="mr-2"
            type="checkbox"
            checked={activeItem}
            onChange={() => {
              if (filter) facetClicked(filter, item as Facet);
              if (label === "All Products")
                facetClicked((item as any).categoryFilter, {
                  name: "all",
                } as Facet);
            }}
          />
          {label}
        </label>
      )}
      {!!options.length && (
        <div>
          <MenuList items={options} filter={item as KlevuFilterResultOptions} />
        </div>
      )}
    </li>
  );
}

function MenuList({
  items,
  filter,
}: {
  items: KlevuFilterResultOptions[] | Facet[];
  filter?: KlevuFilterResultOptions;
}) {
  return (
    <ul className="ms-2 grid list-none gap-2">
      {items.map((item) =>
        item ? (
          <MenuItem
            key={"key" in item ? item.key : item.value}
            item={item}
            filter={filter}
          />
        ) : (
          <></>
        ),
      )}
    </ul>
  );
}

function isSelectedFacet(options: KlevuFilterResultOptions[]) {
  return options?.some((option) =>
    option?.options?.some((facet) => facet.selected),
  );
}

type FilterKlevuOptionsProps = {
  filters: any;
  filter: any;
};

export default function FilterKlevuOptions({
  filters,
  filter,
}: FilterKlevuOptionsProps): JSX.Element {
  const navWithAllProducts = [
    {
      key: "all",
      selected: !isSelectedFacet(filters as KlevuFilterResultOptions[]),
      filter,
    } as any,
    filter,
  ];
  return (
    <div className="mt-2">
      <h3 className="font-semibold">{filter.label}</h3>
      <div className={clsx("ais-HierarchicalMenu block")}>
        <MenuList items={navWithAllProducts} />
      </div>
    </div>
  );
}
