'use client'

import { Label } from "../../../components/label/Label";
import { Input } from "../../../components/input/Input";
import { FormStatusButton } from "../../../components/button/FormStatusButton";
import { useState } from 'react'
import { Switch } from '@headlessui/react'
import { addCustomItemToCart } from "./actions";

export default function CustomItem() {
  const [enabled, setEnabled] = useState(false)
  return (
    <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md mb-10">
      <form className="space-y-6" action={addCustomItemToCart}>
        <div>
          <Label htmlFor="name">Product Name</Label>
          <div className="mt-2">
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
          <div className="mt-2">
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
          <div className="mt-2">
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
          <div className="mt-2">
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
          <Label htmlFor="price">Price ({process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_CODE})</Label>
          <div className="mt-2">
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
          <div className="mt-2">
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
          <div className="mt-2">
            <Input
              id="image_url"
              name="image_url"
              type="text"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="quantity">Variations</Label>
          <div className="mt-2">
            <Input
              id="options"
              name="options"
              type="text"
            />
          </div>
        </div>

        <div>
          <FormStatusButton className="w-full uppercase">Add To Cart</FormStatusButton>
        </div>
      </form>

    </div>
  );
}
