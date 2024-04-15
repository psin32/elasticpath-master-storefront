'use client'

import { Label } from "../../../components/label/Label";
import { Input } from "../../../components/input/Input";
import { FormStatusButton } from "../../../components/button/FormStatusButton";
import { useState } from 'react'
import { Switch } from '@headlessui/react'
import { addCustomItemToCart } from "./actions";
import { useCart } from "../../../react-shopper-hooks";
import { EP_CURRENCY_CODE } from "../../../lib/resolve-ep-currency-code";

export default function CustomItem() {
  const [enabled, setEnabled] = useState(false)
  const { useScopedUpdateCartItem } = useCart();
  const { mutate, isPending } = useScopedUpdateCartItem();

  const addCart = async (data: FormData) => {
    const response = await addCustomItemToCart(data)
    mutate({
      itemId: response.data[0].id,
      quantity: response.data[0].quantity,
    })
  }

  return (
    <div className="mt-10 sm:mx-auto w-full sm:max-w-2xl mb-10">
      <form className="space-y-4" action={addCart}>
        <div className="grid grid-rows-4 grid-flow-col gap-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <div className="mt-1">
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Product Description</Label>
            <div className="mt-1">
              <Input
                id="description"
                name="description"
                type="text"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="sku">SKU</Label>
            <div className="mt-1">
              <Input
                id="sku"
                name="sku"
                type="text"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <div className="mt-1">
              <Input
                id="quantity"
                name="quantity"
                type="number"
                required
                defaultValue={1}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="price">Price ({EP_CURRENCY_CODE})</Label>
            <div className="mt-1">
              <Input
                id="price"
                name="price"
                type="number"
                defaultValue={100}
                required
              />
              <div className="flex flex-row gap-3 mt-2 justify-end">
                <div>Include Tax</div>
                <Switch
                  checked={enabled}
                  onChange={setEnabled}
                  className={`${enabled ? 'bg-blue-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full`}
                  name="include_tax"
                >
                  <span
                    className={`${enabled ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                  />
                </Switch>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="quantity">Tax Rate</Label>
            <div className="mt-1">
              <Input
                id="tax_rate"
                name="tax_rate"
                type="number"
                defaultValue={0.20}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="quantity">Image URL</Label>
            <div className="mt-1">
              <Input
                id="image_url"
                name="image_url"
                type="text"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="quantity">Variations</Label>
            <div className="mt-1">
              <Input
                id="options"
                name="options"
                type="text"
              />
            </div>
          </div>
        </div>

        <div>
          <FormStatusButton className="w-full uppercase">Add To Cart</FormStatusButton>
        </div>
      </form>

    </div>
  );
}
