"use server";

import { getServerSideCredentialsClientWihoutAccountToken } from "../../lib/epcc-server-side-credentials-client";
import { cookies } from "next/headers";
import { COOKIE_PREFIX_KEY } from "../../lib/resolve-cart-env";

export async function updateCartWithContract(contractId: string) {
  const cookieStore = cookies();
  const cartId = cookieStore.get(`${COOKIE_PREFIX_KEY}_ep_cart`)?.value;

  if (!cartId) {
    return { success: false, error: "No cart found" };
  }

  try {
    const client = getServerSideCredentialsClientWihoutAccountToken();

    // Update cart with custom attributes
    const cartRequest = {
      data: {
        custom_attributes: {
          contract_term_id: {
            type: "string",
            value: contractId,
          },
          contract_applied: {
            type: "boolean",
            value: true,
          },
        },
      },
    };

    await client.request.send(
      `carts/${cartId}`,
      "PUT",
      cartRequest,
      undefined,
      client,
      false,
      "v2",
    );

    return { success: true, cartId };
  } catch (error) {
    console.error("Error updating cart with contract:", error);
    return { success: false, error: "Failed to update cart with contract" };
  }
}

export async function removeContractFromCart() {
  const cookieStore = cookies();
  const cartId = cookieStore.get(`${COOKIE_PREFIX_KEY}_ep_cart`)?.value;

  if (!cartId) {
    return { success: false, error: "No cart found" };
  }

  try {
    const client = getServerSideCredentialsClientWihoutAccountToken();

    // Remove contract custom attributes
    const cartRequest = {
      data: {
        custom_attributes: {
          contract_term_id: null,
          contract_applied: {
            type: "boolean",
            value: false,
          },
        },
      },
    };

    await client.request.send(
      `carts/${cartId}`,
      "PUT",
      cartRequest,
      undefined,
      client,
      false,
      "v2",
    );

    return { success: true, cartId };
  } catch (error) {
    console.error("Error removing contract from cart:", error);
    return { success: false, error: "Failed to remove contract from cart" };
  }
}

export async function getCurrentCartContract() {
  const cookieStore = cookies();
  const cartId = cookieStore.get(`${COOKIE_PREFIX_KEY}_ep_cart`)?.value;

  if (!cartId) {
    return { success: false, error: "No cart found" };
  }

  try {
    const client = getServerSideCredentialsClientWihoutAccountToken();
    const response = await client.request.send(
      `carts/${cartId}`,
      "GET",
      undefined,
      undefined,
      client,
      false,
      "v2",
    );

    const customAttributes = response?.data?.custom_attributes || {};

    return {
      success: true,
      contractId: customAttributes?.contract_term_id?.value || null,
      contractApplied: !!customAttributes?.contract_applied?.value,
    };
  } catch (error) {
    console.error("Error getting cart contract:", error);
    return { success: false, error: "Failed to get cart contract" };
  }
}
