import clsx from "clsx";
import { colorLookup } from "../../../lib/color-lookup";
import { imageLookup } from "../../../lib/image-lookup";
import { SWATCH_CONFIG } from "../../../lib/swatch-config";
import type { useVariationProduct } from "../../../react-shopper-hooks";

interface ProductVariationOption {
  id: string;
  description: string;
  name: string;
}

interface IProductVariation {
  variation: {
    id: string;
    name: string;
    options: ProductVariationOption[];
  };
  updateOptionHandler: ReturnType<
    typeof useVariationProduct
  >["updateSelectedOptions"];
  selectedOptionId?: string;
  swatchMode?: 'color' | 'image'; // Optional prop to override default mode
}

const ProductVariationColor = ({
  variation,
  selectedOptionId,
  updateOptionHandler,
  swatchMode,
}: IProductVariation): JSX.Element => {
  // Determine the swatch mode: use prop, then variation override, then global config
  const resolvedMode = swatchMode || 
    SWATCH_CONFIG.overrides[variation.name.toLowerCase() as keyof typeof SWATCH_CONFIG.overrides] || 
    SWATCH_CONFIG.mode;
    
  const getDisplayName = (optionName: string) => {
    // Convert snake_case and other formats to readable titles
    return optionName
      .replace(/[_-]/g, ' ')  // Replace underscores and hyphens with spaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  const getSwatchStyle = (optionName: string) => {
    const key = optionName.toLowerCase();
    
    if (resolvedMode === 'image') {
      const imageUrl = imageLookup[key];
      return imageUrl ? {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      } : {};
    } else {
      // Default to color mode
      return {};
    }
  };
  
  const getSwatchClassName = (optionName: string) => {
    const key = optionName.toLowerCase();
    
    if (resolvedMode === 'image') {
      return "rounded-full border border-gray-200 p-4 bg-gray-100"; // fallback bg if image fails to load
    } else {
      return clsx(
        colorLookup[key] || "bg-gray-100", // fallback color if not found
        "rounded-full border border-gray-200 p-4"
      );
    }
  };
  return (
    <div className="grid gap-2">
      <h2>{variation.name}</h2>
      <div className="flex flex-wrap items-center gap-2">
        {variation.options.map((o) => (
          <div
            className={clsx(
              o.id === selectedOptionId ? "border-2 border-brand-primary" : "",
              "rounded-full p-0.5",
            )}
            key={o.id}
          >
            <button
              type="button"
              className={getSwatchClassName(o.name)}
              style={getSwatchStyle(o.name)}
              onClick={() => updateOptionHandler(variation.id, o.id)}
              title={getDisplayName(o.name)} // Tooltip showing formatted color name
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductVariationColor;
