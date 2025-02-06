import React, { useEffect, useState } from "react";
import { getEpccImplicitClient } from "../../../../lib/epcc-implicit-client";
import { ProductDetailsComponent } from "../../../../app/(store)/products/[productId]/product-display";
import {
  getProductById,
  getSubscriptionOfferingByProductId,
} from "../../../../services/products";
import { parseProductResponse } from "../../../../react-shopper-hooks";

const ProductView: React.FC<{
  product: string | any;
  renderSeo?: boolean;
  description?: string;
  title?: string;
}> = ({ product }) => {
  const [productDetails, setProductDetails] = useState<any>();
  const [shopperProduct, setShopperProduct] = useState<any>();
  const [offerings, setOfferings] = useState<any>();
  useEffect(() => {
    const fetchProduct = async () => {
      const client: any = getEpccImplicitClient();
      const result: any = await getProductById(
        product?.options?.product,
        client,
      );
      setProductDetails(result);
      const productShopper = await parseProductResponse(result, client);
      const offer = await getSubscriptionOfferingByProductId(
        result?.data?.id,
        client,
      );
      setOfferings(offer);
      setShopperProduct(productShopper);
    };
    fetchProduct();
  }, [product]);

  const param = {
    productId: productDetails?.attributes?.slug,
  };
  const breadcrumb: any = [];
  const content = null;
  return (
    shopperProduct && (
      <ProductDetailsComponent
        product={shopperProduct}
        breadcrumb={breadcrumb}
        offerings={offerings}
        content={content}
        relationship={[]}
      />
    )
  );
};

export default ProductView;
