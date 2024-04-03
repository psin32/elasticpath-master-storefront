import FilterCheckbox from "./FilterCheckbox";
import FilterRadio from "./FilterRadio";

const ProductSpecification = () => {
  const data = process.env.NEXT_PUBLIC_FILTER_ITEMS || ""
  return (
    <>
      {data.split(",").map((item: string) => {
        const attribute = item.split("|")
        if (attribute.length === 3) {
          if (attribute[2] === "checkbox") {
            return <FilterCheckbox attribute={attribute[0]} name={attribute[1]} key={attribute[0]} />
          }

          if (attribute[2] === "radio") {
            return <FilterRadio attribute={attribute[0]} name={attribute[1]} key={attribute[0]} />
          }
        }
        return <></>
      })}
    </>
  );
};

export default ProductSpecification;
