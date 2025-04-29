import { NextRequest, NextResponse } from "next/server";
import { NextResponseFlowResult } from "./middleware-runner";
import { applySetCookie } from "./apply-set-cookie";

const cookiePrefixKey = process.env.NEXT_PUBLIC_COOKIE_PREFIX_KEY;
const contextTagParam = process.env.NEXT_PUBLIC_CONTEXT_TAG;

export async function jamfContextTagMiddleware(
  req: NextRequest,
  previousResponse: NextResponse,
): Promise<NextResponseFlowResult> {
  if (
    typeof cookiePrefixKey !== "string" ||
    typeof contextTagParam !== "string"
  ) {
    return {
      shouldReturn: false,
      resultingResponse: previousResponse,
    };
  }

  // Check for context tag in query parameters using the env var name
  const catalogTagCookieName = `${cookiePrefixKey}_ep_catalog_tag`;
  const existingCookieTag = req.cookies.get(catalogTagCookieName);

  // Only set the cookie if context tag is in URL and cookie isn't already set
  if (contextTagParam && !existingCookieTag) {
    // Set the context tag cookie
    previousResponse.cookies.set(catalogTagCookieName, contextTagParam, {
      sameSite: "strict",
      // Set expiry to a reasonable time (30 days)
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Apply cookies to the request
    // Workaround for - https://github.com/vercel/next.js/issues/49442#issuecomment-1679807704
    applySetCookie(req, previousResponse);
  }

  return {
    shouldReturn: false,
    resultingResponse: previousResponse,
  };
}
