"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { redirect } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  returnUrl: z.string().optional(),
});

const loginErrorMessage =
  "Failed to login, make sure your email and password are correct";

export async function login(props: FormData) {
  const rawEntries = Object.fromEntries(props.entries());

  const validatedProps = loginSchema.safeParse(rawEntries);

  if (!validatedProps.success) {
    return {
      error: loginErrorMessage,
    };
  }

  const { email, password, returnUrl } = validatedProps.data;
  const response = await fetch(
    `https://${process.env.NEXT_PUBLIC_EPCC_ENDPOINT_URL}/oauth/access_token`,
    {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "password",
        username: email,
        password: password,
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  const result = await response.json();
  const cookieStore = cookies();
  cookieStore.set({
    name: "",
    value: result.access_token,
    path: "/",
    sameSite: "strict",
  });

  redirect(returnUrl ?? "/admin/dashboard");
}
