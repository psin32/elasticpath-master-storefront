import { z } from "zod";
import type {
  BundleComponent,
  BundleComponents,
} from "../../../react-shopper-hooks";

export const createBundleComponentSchema = (component: BundleComponent) => {
  let schema = z.array(z.string());

  const { min, max } = component;

  if (min) {
    schema = schema.min(min, `Must select at least ${min} options`);
  }

  if (max) {
    schema = schema.max(max, `Must select no more than ${max} options`);
  }
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
