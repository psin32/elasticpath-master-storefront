import { useContext } from "react";
import clsx from "clsx";
import type { ShopperProduct } from "../../react-shopper-hooks";
import { ProductContext } from "../../lib/product-context";

interface IProductDetails {
  product: ShopperProduct["response"];
}

const ProductDetails = ({ product }: IProductDetails): JSX.Element => {
  const context = useContext(ProductContext);

  return (
    <>
      <span className="text-base font-medium uppercase lg:text-lg text-gray-800">
        Product Details
      </span>

      <div
        dangerouslySetInnerHTML={{ __html: product.attributes.description }}
        className={clsx(
          "flex flex-col gap-4 sm:gap-6 [&>ul]:list-disc [&>ul]:list-inside [&>ul>li]:leading-8 [&>ul]:my-4 text-gray-700",
          context?.isChangingSku && "opacity-20 cursor-default",
        )}
      ></div>
    </>
  );
};

export default ProductDetails;
