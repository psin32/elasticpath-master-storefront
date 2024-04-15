import { ShopperProduct, useBundle } from "../../../react-shopper-hooks";
import { ProductComponent } from "./ProductComponent";
import { useFormikContext } from "formik";
import { useEffect, useState } from "react";
import { FormSelectedOptions, formSelectedOptionsToData } from "./form-parsers";

interface IProductComponentsProps {
  product: ShopperProduct["response"];
}

const ProductComponents = ({ product }: IProductComponentsProps): JSX.Element => {
  const { components, updateSelectedOptions } = useBundle();
  const [bundle, setBundle] = useState<any>();

  const { values } = useFormikContext<{
    selectedOptions: FormSelectedOptions;
  }>();

  useEffect(() => {
    updateSelectedOptions(formSelectedOptionsToData(values.selectedOptions));
    const temp: any = []
    Object.keys(components).map((key) => {
      temp.push({
        ...components[key],
        key
      })
    })
    setBundle(temp)
  }, [values, updateSelectedOptions]);

  const sortComponents = (a: any, b: any) => {
    return a.sort_order - b.sort_order
  }

  return (
    <div className="flex flex-row flex-wrap">
      {bundle && bundle.sort(sortComponents).map((item: any) => {
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
