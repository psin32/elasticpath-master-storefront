import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { cookies } from "next/headers";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      id: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials) {
          console.error("req", req);
          return null;
        }

        const { username, password } = credentials;

        const authentication = await fetch(
          `https://${process.env.NEXT_PUBLIC_EPCC_ENDPOINT_URL}/oauth/access_token`,
          {
            method: "POST",
            body: new URLSearchParams({
              grant_type: "password",
              username: username,
              password: password,
            }),
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          },
        );
        const response = await authentication.json();
        if (!authentication.ok) {
          throw new Error(response.message);
        }
        if (authentication.ok && response) {
          const user = await fetch(
            `https://${process.env.NEXT_PUBLIC_EPCC_ENDPOINT_URL}/v2/user`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${response.access_token}`,
              },
            },
          );
          const userResponse = await user.json();
          response.details = userResponse;

          return response;
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/admin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }: any) {
      session.user.image = token.avatar.small;
      return session;
    },
    async jwt({ token, user, account }: any) {
      if (account && user) {
        const cookieStore = cookies();
        cookieStore.set(
          `${process.env.NEXT_PUBLIC_COOKIE_PREFIX_KEY}_access_token`,
          user.access_token,
        );
        cookieStore.set(
          `${process.env.NEXT_PUBLIC_COOKIE_PREFIX_KEY}_refresh_token`,
          user.refresh_token,
        );
        return {
          name: user.details.data.name,
          email: user.details.data.email,
          avatar: user.details.data.avatar,
          accessToken: user.access_token,
          accessTokenExpires: Date.now() + user.expires! * 1000,
        };
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
