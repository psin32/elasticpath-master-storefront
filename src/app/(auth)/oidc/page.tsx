"use client";

import React, { useEffect } from "react";
import { generateRedirectUri } from "../OidcUtilities";
import { oidcLogin } from "../actions";
import { setCookie } from "cookies-next";
import { CART_COOKIE_NAME } from "../../../lib/cookie-constants";

export default function OIDCHandler({
  searchParams,
}: {
  searchParams: { code: string; state: string };
}) {
  const { code, state } = searchParams;

  useEffect(() => {
    async function setCustomerDataFromOidcCallback() {
      const codeVerifier = localStorage.getItem("code_verifier");

      if (code !== undefined && state !== undefined) {
        if (
          state === localStorage.getItem("state") &&
          typeof codeVerifier === "string"
        ) {
          await oidcLogin(code!, generateRedirectUri(), codeVerifier);
        } else {
          alert("Unable to validate identity");
        }

        localStorage.removeItem("location");
        localStorage.removeItem("state");
      }
    }

    setCustomerDataFromOidcCallback();
  }, [code, state]);

  return <div className="epminiLoader --center" />;
}
