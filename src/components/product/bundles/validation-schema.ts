import { z } from "zod";
import type {
  BundleComponent,
  BundleComponents,
} from "../../../react-shopper-hooks";

export const createBundleComponentSchema = (component: BundleComponent) => {
  let schema: z.ZodType<string[]> = z.array(z.string());

  const { min, max } = component;

  // Add refinement to filter out parent products before counting
  schema = schema.refine(
    (options) => {
      // Filter out parent product options (those with product_should_be_substituted_with_child === true)
      const filteredOptions = options.filter((optionStr) => {
        try {
          const parsed = JSON.parse(optionStr);
          const optionId = Object.keys(parsed)[0];
          const option = component.options.find(
            (opt: any) => opt.id === optionId,
          );
          const shouldSubstituteWithChild =
            (option as any)?.product_should_be_substituted_with_child === true;
          return !shouldSubstituteWithChild;
        } catch {
          return true; // Keep if parsing fails
        }
      });

      // Validate against filtered count
      const filteredCount = filteredOptions.length;

      if (min != null && filteredCount < min) {
        return false;
      }

      if (max != null && filteredCount > max) {
        return false;
      }

      return true;
    },
    (options) => {
      // Filter to get actual count
      const filteredOptions = options.filter((optionStr) => {
        try {
          const parsed = JSON.parse(optionStr);
          const optionId = Object.keys(parsed)[0];
          const option = component.options.find(
            (opt: any) => opt.id === optionId,
          );
          const shouldSubstituteWithChild =
            (option as any)?.product_should_be_substituted_with_child === true;
          return !shouldSubstituteWithChild;
        } catch {
          return true;
        }
      });

      const filteredCount = filteredOptions.length;
      const { min, max } = component;

      if (min != null && filteredCount < min) {
        return { message: `Must select at least ${min} options` };
      }

      if (max != null && filteredCount > max) {
        return { message: `Must select no more than ${max} options` };
      }

      return { message: "Invalid selection" };
    },
  );

  return schema;
};

export const createBundleQuantitiesSchema = (component: BundleComponent) => {
  const quantitiesSchema: Record<string, z.ZodNumber> = {};

  component.options.forEach((option) => {
    const minQuantity = (option as any).min || 1;
    const maxQuantity = (option as any).max || 99;

    quantitiesSchema[option.id] = z
      .number()
      .min(minQuantity, `Quantity must be at least ${minQuantity}`)
      .max(maxQuantity, `Quantity cannot exceed ${maxQuantity}`);
  });

  return z.object(quantitiesSchema);
};

export const createBundleFormSchema = (bundleComponents: BundleComponents) => {
  const selectedOptionsSchema = Object.keys(bundleComponents).reduce(
    (acc, componentKey) => {
      return {
        ...acc,
        [componentKey]: createBundleComponentSchema(
          bundleComponents[componentKey],
        ),
      };
    },
    {} as Record<string, ReturnType<typeof createBundleComponentSchema>>,
  );

  const quantitiesSchema = Object.keys(bundleComponents).reduce(
    (acc, componentKey) => {
      return {
        ...acc,
        [componentKey]: createBundleQuantitiesSchema(
          bundleComponents[componentKey],
        ),
      };
    },
    {} as Record<string, ReturnType<typeof createBundleQuantitiesSchema>>,
  );

  return z.object({
    selectedOptions: z.object(selectedOptionsSchema),
    quantities: z.object(quantitiesSchema).optional(),
  });
};
