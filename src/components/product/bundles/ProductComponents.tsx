import { ShopperProduct, useBundle } from "../../../react-shopper-hooks";
import { ProductComponent } from "./ProductComponent";
import { useFormikContext } from "formik";
import { useEffect, useState } from "react";
import {
  FormSelectedOptions,
  FormQuantities,
  formSelectedOptionsToData,
} from "./form-parsers";
import { ProductComponentOption, ProductResponse } from "@elasticpath/js-sdk";
import { getChildProductsByParentId } from "../../../services/products";
import { getEpccImplicitClient } from "../../../lib/epcc-implicit-client";

interface IProductComponentsProps {
  product: ShopperProduct["response"];
}

const ProductComponents = ({
  product,
}: IProductComponentsProps): JSX.Element => {
  const {
    components,
    updateSelectedOptions,
    setComponents,
    setComponentProducts,
    setComponentProductImages,
    componentProducts,
    componentProductImages,
  } = useBundle();
  const [bundle, setBundle] = useState<any>();
  const [expandedComponents, setExpandedComponents] = useState<any>(null);

  const { values } = useFormikContext<{
    selectedOptions: FormSelectedOptions;
    quantities?: FormQuantities;
  }>();

  // Expand parent products to child products on component mount and when components change
  useEffect(() => {
    const expandParentProducts = async () => {
      const client = getEpccImplicitClient();
      const expandedComps: any = { ...components };
      const expandedProds: ProductResponse[] = [...componentProducts];
      const expandedImgs: any[] = [...componentProductImages];
      let hasChanges = false;

      // Check each component for parent products
      for (const [componentKey, component] of Object.entries(components)) {
        const typedComponent = component as any;
        const expandedOptions: ProductComponentOption[] = [];
        const parentProductIds: string[] = [];

        // Identify parent products in options based on product_should_be_substituted_with_child field
        for (const option of typedComponent.options) {
          // Check if option has product_should_be_substituted_with_child field set to true
          const shouldSubstituteWithChild =
            (option as any)?.product_should_be_substituted_with_child === true;

          if (shouldSubstituteWithChild) {
            // Option ID is the parent product ID
            parentProductIds.push(option.id);
          } else {
            // Keep non-parent options as-is
            expandedOptions.push(option);
          }
        }

        // Fetch child products for each parent
        if (parentProductIds.length > 0) {
          hasChanges = true;
          for (const parentId of parentProductIds) {
            try {
              const childProductsResponse = await getChildProductsByParentId(
                parentId,
                client,
              );

              // Create options for each child product
              for (const childProduct of childProductsResponse.data) {
                // Create a new option for the child product
                const childOption = {
                  id: childProduct.id,
                  type: "product_component_option",
                  quantity: 1,
                  sort_order: 0,
                  meta: {},
                } as ProductComponentOption;

                expandedOptions.push(childOption);
                expandedProds.push(childProduct);

                // Add child product images
                if (childProductsResponse.included?.main_images) {
                  expandedImgs.push(
                    ...childProductsResponse.included.main_images,
                  );
                }
                if (childProductsResponse.included?.files) {
                  expandedImgs.push(...childProductsResponse.included.files);
                }
              }
            } catch (error) {
              console.error(
                `Error fetching child products for parent ${parentId}:`,
                error,
              );
              // If fetching fails, keep the parent option
              const parentOption = typedComponent.options.find(
                (opt: ProductComponentOption) => opt.id === parentId,
              );
              if (parentOption) {
                expandedOptions.push(parentOption);
              }
            }
          }

          // Update component with expanded options
          expandedComps[componentKey] = {
            ...typedComponent,
            options: expandedOptions,
          };
        } else {
          // No parent products, keep component as-is
          expandedComps[componentKey] = typedComponent;
        }
      }

      if (hasChanges) {
        setComponents(expandedComps);
        setComponentProducts(expandedProds);
        setComponentProductImages(expandedImgs);
        setExpandedComponents(expandedComps);
      } else {
        setExpandedComponents(components);
      }
    };

    expandParentProducts();
  }, [
    components,
    componentProducts,
    componentProductImages,
    setComponents,
    setComponentProducts,
    setComponentProductImages,
  ]);

  useEffect(() => {
    // Use expanded components if available, otherwise use original components
    const componentsToUse = expandedComponents || components;

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
    Object.keys(componentsToUse).map((key) => {
      temp.push({
        ...componentsToUse[key],
        key,
      });
    });
    setBundle(temp);
  }, [values, updateSelectedOptions, expandedComponents, components]);

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
