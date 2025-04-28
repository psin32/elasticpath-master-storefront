"use server";

import { getServerSideCredentialsClientWihoutAccountToken } from "../../lib/epcc-server-side-credentials-client";
import { cookies } from "next/headers";
import { COOKIE_PREFIX_KEY } from "../../lib/resolve-cart-env";
import { getContractById } from "../../app/(checkout)/create-quote/contracts-service";

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

    // Instead of setting to null, just don't include the contract_term_id
    const cartRequest = {
      data: {
        custom_attributes: {
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

    const credentials = client.config.storage?.get(
      `${COOKIE_PREFIX_KEY}_ep_credentials`,
    );

    const parsedCredentials = JSON.parse(credentials);

    const response = await fetch(
      `https://${client.config.host}/v2/carts/${cartId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${parsedCredentials?.access_token}`,
        },
        next: {
          revalidate: 0,
          tags: ["active-contract"],
        },
      },
    );

    const data = await response.json();

    const customAttributes = data?.custom_attributes || {};

    console.log("customAttributes", customAttributes);

    return {
      success: true,
      contractId: customAttributes?.contract_term_id?.value || null,
      contractApplied: !!customAttributes?.contract_applied?.value,
    };
  } catch (error) {
    console.error("Error getting current contract:", error);
    return { success: false, contractId: null, error };
  }
}

export async function getContractDetails(contractId: string) {
  if (!contractId) {
    return { success: false, error: "No contract ID provided" };
  }

  try {
    const contract = await getContractById(contractId);
    console.log("contract", contract);
    return {
      success: true,
      contractName: contract.data.display_name || "Contract",
      contractData: contract.data || null,
    };
  } catch (error) {
    console.error("Error getting contract details:", error);
    return { success: false, contractName: null, error };
  }
}
