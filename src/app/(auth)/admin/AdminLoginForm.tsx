"use client";

import { Label } from "../../../components/label/Label";
import { Input } from "../../../components/input/Input";
import { FormStatusButton } from "../../../components/button/FormStatusButton";
import { useState } from "react";
import { useTranslation } from "../../i18n/client";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export function AdminLoginForm({ returnUrl }: { returnUrl?: string }) {
  const [error, setError] = useState<string | undefined>(undefined);
  const { t } = useTranslation(getCookie("locale") || "en", "auth", {});
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    if (res?.error) {
      setError(res.error);
    } else {
      router.push("/admin/dashboard");
    }
  };

  return (
    <div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="email">{t("login.label.email")}</Label>
          <div className="mt-2">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("login.label.password")}</Label>
          </div>
          <div className="mt-2">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              onChange={(e) => setPassword(e.target.value)}
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
    </div>
  );
}
