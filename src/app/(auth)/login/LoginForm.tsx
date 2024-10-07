"use client";

import { login } from "../actions";
import { Label } from "../../../components/label/Label";
import { Input } from "../../../components/input/Input";
import { FormStatusButton } from "../../../components/button/FormStatusButton";
import { useEffect, useState } from "react";
import { getOidcProfile, loadOidcProfiles } from "../actions";
import { Profile, ResourcePage } from "@moltin/sdk";
import { generateOidcLoginRedirectUrl } from "../OidcUtilities";
import { StatusButton } from "../../../components/button/StatusButton";
import { useAuthentication } from "../../../react-shopper-hooks/authentication";
import { useTranslation } from "../../i18n/client";
import { getCookie } from "cookies-next";

export function LoginForm({ returnUrl }: { returnUrl?: string }) {
  const [error, setError] = useState<string | undefined>(undefined);
  const [authenticationRealmId, setAuthenticationRealmId] = useState<
    string | undefined
  >(undefined);
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [oidcProfiles, setOidcProfiles] =
    useState<ResourcePage<Profile, never>>();
  const { data } = useAuthentication() as any;
  const { t } = useTranslation(getCookie("locale") || "en", "auth", {});

  async function loginAction(formData: FormData) {
    const result = await login(formData);

    if ("error" in result) {
      setError(result.error);
    }
  }

  useEffect(() => {
    const init = async () => {
      if (data) {
        const realmId = data?.relationships.authentication_realm?.data?.id;
        const profiles = await loadOidcProfiles(realmId);
        setClientId(data?.meta?.client_id);
        setAuthenticationRealmId(realmId);
        setOidcProfiles(profiles);
      }
    };
    init();
  }, [data]);

  const handleOidcButtonClicked = async (profile: any, cId: any) => {
    if (authenticationRealmId) {
      const { links } = await getOidcProfile(authenticationRealmId, profile.id);
      const baseRedirectUrl = links["authorization-endpoint"];

      window.location.href = await generateOidcLoginRedirectUrl(
        baseRedirectUrl,
        cId,
        location.pathname,
      );
    }
  };

  return (
    <div>
      <form className="space-y-6" action={loginAction}>
        <div>
          <Label htmlFor="email">{t("login.label.email")}</Label>
          <div className="mt-2">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("login.label.password")}</Label>
            <div className="text-sm">
              <a
                href="#"
                className="font-light text-brand-primary hover:text-brand-highlight"
              >
                {t("login.link.forgot-password")}
              </a>
            </div>
          </div>
          <div className="mt-2">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
        </div>
        {returnUrl && (
          <input
            id="returnUrl"
            readOnly
            name="returnUrl"
            type="text"
            className="hidden"
            value={returnUrl}
          />
        )}
        {error && (
          <div className="mt-2">
            <span className="text-sm text-red-500">{error}</span>
          </div>
        )}

        <div>
          <FormStatusButton className="w-full">
            {t("login.button.login")}
          </FormStatusButton>
        </div>
      </form>
      {oidcProfiles &&
        oidcProfiles.data.map((profile: any) => {
          return (
            <>
              <FormStatusButton
                type="button"
                className="w-full mt-4"
                onClick={() => handleOidcButtonClicked(profile, clientId)}
              >
                {t("login.button.login-with")} {profile.name}
              </FormStatusButton>
            </>
          );
        })}
    </div>
  );
}
