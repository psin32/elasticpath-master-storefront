import { ShopperProduct, useBundle } from "../../../react-shopper-hooks";
import { ProductComponent } from "./ProductComponent";
import { useFormikContext } from "formik";
import { useEffect, useState } from "react";
import {
  FormSelectedOptions,
  FormQuantities,
  formSelectedOptionsToData,
} from "./form-parsers";

interface IProductComponentsProps {
  product: ShopperProduct["response"];
}

const ProductComponents = ({
  product,
}: IProductComponentsProps): JSX.Element => {
  const { components, updateSelectedOptions } = useBundle();
  const [bundle, setBundle] = useState<any>();

  const { values } = useFormikContext<{
    selectedOptions: FormSelectedOptions;
    quantities?: FormQuantities;
  }>();

  useEffect(() => {
    // Extract quantities from form values
    const quantities: FormQuantities = {};
    if (values.quantities) {
      Object.keys(values.quantities).forEach((componentKey) => {
        quantities[componentKey] = {};
        const componentQuantities = values.quantities![componentKey];
        if (componentQuantities) {
          Object.keys(componentQuantities).forEach((optionId) => {
            const quantity = componentQuantities[optionId];
            if (quantity !== undefined && quantity > 0) {
              quantities[componentKey][optionId] = quantity;
            }
          });
        }
      });
    }

    // Parse selected options and apply quantities
    const selectedOptionsData = formSelectedOptionsToData(
      values.selectedOptions,
      quantities,
    );
    updateSelectedOptions(selectedOptionsData);

    const temp: any = [];
    Object.keys(components).map((key) => {
      temp.push({
        ...components[key],
        key,
      });
    });
    setBundle(temp);
  }, [values, updateSelectedOptions]);

  const sortComponents = (a: any, b: any) => {
    return a.sort_order - b.sort_order;
  };

  return (
    <div className="flex flex-row flex-wrap">
      {bundle &&
        bundle.sort(sortComponents).map((item: any) => {
          return (
            <ProductComponent
              key={item.key}
              component={item}
              componentLookupKey={item.key}
              product={product}
            />
          );
        })}
    </div>
  );
};

export default ProductComponents;
