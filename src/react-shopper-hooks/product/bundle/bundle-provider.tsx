import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  BundleComponents,
  BundleConfiguration,
  BundleConfigurationSelectedOptions,
  ComponentProduct,
  BundleProduct,
  configureBundle as _configureBundle,
  createBundleConfigureValidator,
} from "../../../shopper-common/src";
import type {
  ElasticPath as EpccClient,
  ProductResponse,
  File,
} from "@elasticpath/js-sdk";
import { useStore } from "../../store";

interface BundleProductState {
  configuredProduct: BundleProduct;
  setConfiguredProduct: Dispatch<SetStateAction<BundleProduct>>;
  components: BundleComponents;
  setComponents: Dispatch<SetStateAction<BundleComponents>>;
  componentProducts: ProductResponse[];
  setComponentProducts: Dispatch<SetStateAction<ComponentProduct[]>>;
  componentProductImages: File[];
  setComponentProductImages: Dispatch<SetStateAction<File[]>>;
  bundleConfiguration: BundleConfiguration;
  setBundleConfiguration: Dispatch<SetStateAction<BundleConfiguration>>;
  selectedOptions: BundleConfigurationSelectedOptions;
  setSelectedOptions: Dispatch<
    SetStateAction<BundleConfigurationSelectedOptions>
  >;
  client: EpccClient;
}

export const BundleProductContext = createContext<BundleProductState | null>(
  null,
);

export function BundleProductProvider({
  children,
  bundleProduct,
  client: overrideClient,
}: {
  bundleProduct: BundleProduct;
  children: ReactNode;
  client?: EpccClient;
}) {
  const { client: storeClient } = useStore();

  const [client] = useState(overrideClient ?? storeClient) as any;

  const [configuredProduct, setConfiguredProduct] =
    useState<BundleProduct>(bundleProduct);

  const {
    componentProductResponses,
    response: {
      attributes: { components: srcComponents },
      meta: { bundle_configuration: initBundleConfiguration },
    },
    componentProductImages: srcComponentProductImages,
  } = configuredProduct;

  if (!initBundleConfiguration) {
    throw new Error(
      "bundle_configuration on bundle product was unexpectedly undefined!",
    );
  }

  const [components, setComponents] = useState<BundleComponents>(srcComponents);
  const [bundleConfiguration, setBundleConfiguration] =
    useState<BundleConfiguration>(initBundleConfiguration);
  const [componentProducts, setComponentProducts] = useState<
    ComponentProduct[]
  >(componentProductResponses);

  const [componentProductImages, setComponentProductImages] = useState<File[]>(
    srcComponentProductImages,
  );

  const validator = useCallback(createBundleConfigureValidator(srcComponents), [
    components,
  ]);

  const [selectedOptionsState, setSelectedOptionsRaw] =
    useState<BundleConfigurationSelectedOptions>(
      initBundleConfiguration.selected_options,
    );

  // Wrapper to filter out parent product options when setting selected options
  const setSelectedOptions = useCallback(
    (
      value:
        | BundleConfigurationSelectedOptions
        | ((
            prev: BundleConfigurationSelectedOptions,
          ) => BundleConfigurationSelectedOptions),
    ) => {
      setSelectedOptionsRaw((prev) => {
        const newOptions = typeof value === "function" ? value(prev) : value;

        // Filter out parent product options (those with product_should_be_substituted_with_child === true)
        const filteredOptions: BundleConfigurationSelectedOptions = {};

        for (const [componentKey, componentSelectedOptions] of Object.entries(
          newOptions,
        )) {
          if (!componentSelectedOptions) {
            filteredOptions[componentKey] = componentSelectedOptions;
            continue;
          }

          const component = srcComponents[componentKey];
          if (!component) {
            filteredOptions[componentKey] = componentSelectedOptions;
            continue;
          }

          const filteredComponentOptions: Record<string, number> = {};

          // Only keep options that are NOT parent products
          for (const [optionId, quantity] of Object.entries(
            componentSelectedOptions,
          )) {
            const option = component.options?.find(
              (opt: any) => opt.id === optionId,
            );
            const shouldSubstituteWithChild =
              (option as any)?.product_should_be_substituted_with_child ===
              true;

            // Only include if it's NOT a parent product that should be substituted
            if (!shouldSubstituteWithChild) {
              filteredComponentOptions[optionId] = quantity;
            }
          }

          filteredOptions[componentKey] = filteredComponentOptions;
        }

        // Check if the filtered options are actually different from previous state
        // to prevent unnecessary re-renders and infinite loops
        const prevKeys = Object.keys(prev || {});
        const filteredKeys = Object.keys(filteredOptions);

        if (prevKeys.length !== filteredKeys.length) {
          return filteredOptions;
        }

        // Deep comparison of the options
        for (const key of filteredKeys) {
          const prevOptions = prev?.[key] || {};
          const filteredOpts = filteredOptions[key] || {};
          const prevOptKeys = Object.keys(prevOptions);
          const filteredOptKeys = Object.keys(filteredOpts);

          if (prevOptKeys.length !== filteredOptKeys.length) {
            return filteredOptions;
          }

          for (const optKey of filteredOptKeys) {
            if (prevOptions[optKey] !== filteredOpts[optKey]) {
              return filteredOptions;
            }
          }
        }

        // If nothing changed, return previous state to prevent re-render
        return prev;
      });
    },
    [srcComponents],
  );

  // Use the state value for selectedOptions
  const selectedOptions = selectedOptionsState;

  const isConfiguringRef = useRef(false);
  const lastConfiguredOptionsRef = useRef<string>("");

  const configureBundle = useCallback(
    async (selectedOptions: BundleConfigurationSelectedOptions) => {
      // Prevent concurrent calls
      if (isConfiguringRef.current) {
        return;
      }

      // Create a stable string representation for comparison
      const optionsKey = JSON.stringify(selectedOptions);

      // Skip if we're configuring the same options
      if (lastConfiguredOptionsRef.current === optionsKey) {
        return;
      }

      const { success: isValid } = validator(selectedOptions);

      if (isValid) {
        isConfiguringRef.current = true;
        lastConfiguredOptionsRef.current = optionsKey;

        try {
          const updatedBundleProduct = await _configureBundle(
            configuredProduct.response.id,
            selectedOptions,
            client,
          );
          setConfiguredProduct((prevState) => ({
            ...prevState,
            response: updatedBundleProduct,
          }));
        } finally {
          isConfiguringRef.current = false;
        }
      }
    },
    [configuredProduct, setConfiguredProduct, validator, client],
  );

  // Sync the configured product details when selected options change
  useEffect(() => {
    configureBundle(selectedOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOptions]);

  return (
    <BundleProductContext.Provider
      value={{
        setComponentProductImages,
        componentProductImages,
        client,
        configuredProduct,
        setConfiguredProduct,
        components,
        setComponents,
        bundleConfiguration,
        setBundleConfiguration,
        componentProducts,
        setComponentProducts,
        selectedOptions,
        setSelectedOptions,
      }}
    >
      {children}
    </BundleProductContext.Provider>
  );
}
