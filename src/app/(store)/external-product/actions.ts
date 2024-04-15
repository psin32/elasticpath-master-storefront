"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { getServerSideCredentialsClient } from "../../../lib/epcc-server-side-credentials-client";
import { COOKIE_PREFIX_KEY } from "../../../lib/resolve-cart-env";

const addCustomItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  sku: z.string(),
  price: z.string(),
  quantity: z.string(),
  include_tax: z.any(),
  tax_rate: z.any(),
  image_url: z.any(),
  options: z.any(),
});

export async function addCustomItemToCart(data: FormData) {
  const client = getServerSideCredentialsClient();
  const cookie = cookies();
  const cartId = cookie.get(`${COOKIE_PREFIX_KEY}_ep_cart`)?.value
  const validatedProps = addCustomItemSchema.safeParse(
    Object.fromEntries(data.entries()),
  );

  if (!validatedProps.success) {
    throw new Error("Invalid details");
  }

  const { name, description, sku, price, quantity, include_tax, tax_rate, image_url, options } = validatedProps.data;

  const tax = [
    {
      type: "tax_item",
      name: "Tax name",
      jurisdiction: "UK",
      code: "TAX01",
      rate: Number(tax_rate)
    }
  ]
  const request: any = {
    type: "custom_item",
    name,
    sku,
    description,
    quantity: Number(quantity),
    price: {
      amount: Number(price),
      includes_tax: include_tax ? true : false
    },
    custom_inputs: {

    }
  }

  tax_rate ? request.tax = tax : {}
  image_url ? request.custom_inputs.image_url = image_url : {}
  options ? request.custom_inputs.options = options : {}

  return await client.Cart(cartId).AddCustomItem(request)
}
