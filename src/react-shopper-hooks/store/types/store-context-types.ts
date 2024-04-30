import type { Cart, CartIncluded, ResourceIncluded } from "@moltin/sdk"
import { ReactNode } from "react"
import { NavigationNode } from "../../../shopper-common/src"

export interface StoreProviderProps {
  initialState?: InitialState
  children: ReactNode
  cartId?: string
}

export interface InitialState {
  nav?: NavigationNode[]
  cart?: ResourceIncluded<Cart, CartIncluded>
}
