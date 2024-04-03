"use client";
import type { SimpleProduct } from "@elasticpath/react-shopper-hooks";
import {
  SimpleProductProvider,
  useCart,
  useSimpleProduct,
} from "@elasticpath/react-shopper-hooks";
import ProductCarousel from "./carousel/ProductCarousel";
import ProductSummary from "./ProductSummary";
import ProductDetails from "./ProductDetails";
import ProductExtensions from "./ProductExtensions";
import { StatusButton } from "../button/StatusButton";
import PersonalisedInfo from "./PersonalisedInfo";

interface ISimpleProductDetail {
  simpleProduct: SimpleProduct;
}

function SimpleProductDetail({
  simpleProduct,
}: ISimpleProductDetail): JSX.Element {
  return (
    <SimpleProductProvider simpleProduct={simpleProduct}>
      <SimpleProductContainer />
    </SimpleProductProvider>
  );
}

function SimpleProductContainer(): JSX.Element {
  const { product } = useSimpleProduct() as any;
  const { useScopedAddProductToCart } = useCart();
  const { mutate, isPending } = useScopedAddProductToCart();

  const { main_image, response, otherImages } = product;
  const { extensions } = response.attributes;
  const {
    meta: { original_display_price },
  } = response;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data: any = {
      custom_inputs: {
        additional_information: []
      }
    }
    {
      response?.attributes?.custom_inputs && Object.keys(response?.attributes?.custom_inputs).map(input => {
        const value = formData.get(input)
        if (value) {
          const info = {
            key: response.attributes.custom_inputs[input].name,
            value
          }
          data.custom_inputs.additional_information.push(info)
        }
      })
    }
    mutate({ productId: response.id, quantity: 1, data })
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
        <div className="basis-full lg:basis-1/2">
          {main_image && (
            <ProductCarousel images={otherImages} mainImage={main_image} />
          )}
        </div>
        <div className="basis-full lg:basis-1/2">
          <form onSubmit={(e: any) => handleSubmit(e)}>
            {original_display_price && (
              <span className="uppercase inline-flex items-center rounded-sm bg-white px-2 py-1 text-sm font-medium text-pink-700 ring-1 ring-inset ring-pink-700 mb-6 mr-2">
                {response.meta.sale_id}
              </span>
            )}
            <div className="flex flex-col gap-6 md:gap-10">
              <ProductSummary product={response} />
              <PersonalisedInfo custom_inputs={response.attributes?.custom_inputs} />
              <ProductDetails product={response} />
              {extensions && <ProductExtensions extensions={extensions} />}
              <StatusButton
                type="submit"
                status={isPending ? "loading" : "idle"}
              >
                ADD TO CART
              </StatusButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SimpleProductDetail;
