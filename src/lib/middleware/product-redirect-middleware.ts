import { NextRequest, NextResponse } from "next/server";
import { NextResponseFlowResult } from "./middleware-runner";
const cookiePrefixKey = process.env.NEXT_PUBLIC_COOKIE_PREFIX_KEY;

export async function productRedirectMiddleware(
  req: NextRequest,
  previousResponse: NextResponse,
): Promise<NextResponseFlowResult> {
  // Check if redirect is enabled via cookie
  const redirectEnabled = req.cookies.get("redirect_enabled")?.value === "true";

  if (!redirectEnabled) {
    return {
      shouldReturn: false,
      resultingResponse: previousResponse,
    };
  }

  // Only check product pages
  const pathname = req.nextUrl.pathname;
  const productPageMatch = pathname.match(/^\/products\/(.+)$/);

  if (!productPageMatch) {
    return {
      shouldReturn: false,
      resultingResponse: previousResponse,
    };
  }

  try {
    const token = req.cookies.get(`${cookiePrefixKey}_ep_credentials`)?.value;
    const accessToken = token ? JSON.parse(token).access_token : null;
    const epccEndpoint = process.env.NEXT_PUBLIC_EPCC_ENDPOINT_URL;
    // Check for redirect
    const redirectResponse = await fetch(
      `https://${epccEndpoint}/v2/extensions/seo_redirects?filter=eq(redirect_from,${pathname}):eq(enabled,true)`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    if (!redirectResponse.ok) {
      return {
        shouldReturn: false,
        resultingResponse: previousResponse,
      };
    }
    const redirectData = await redirectResponse.json();
    if (redirectData.data.length > 0) {
      return {
        shouldReturn: true,
        resultingResponse: NextResponse.redirect(
          `${req.nextUrl.origin}${redirectData.data[0].redirect_to}`,
          {
            status: 302,
          },
        ),
      };
    }
    return {
      shouldReturn: false,
      resultingResponse: previousResponse,
    };
  } catch (error) {
    console.error("Error checking redirect in middleware:", error);
    return {
      shouldReturn: false,
      resultingResponse: previousResponse,
    };
  }
}
