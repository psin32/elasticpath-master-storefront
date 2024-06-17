"use client";

import { getCookie, setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { Trans } from "react-i18next/TransWithoutContext";
import { useTranslation } from "../../../app/i18n/client";

export default function LanguageSelector(): JSX.Element {
  const { t } = useTranslation(getCookie("locale") || "en", "header", {});
  const router = useRouter();

  const changeLocale = (locale: string) => {
    setCookie("locale", locale);
    router.refresh();
  };

  return (
    <select
      id="locale"
      name="locale"
      defaultValue={getCookie("locale") || "en"}
      className="bg-gray-800 border-none mt-1 block rounded-md py-1.5 pl-3 pr-10 uppercase text-[12px]"
      onChange={(e) => {
        changeLocale(e.target.value);
      }}
    >
      <option value="en">
        <Trans t={t} i18nKey="language.english" />
      </option>
      <option value="fr">
        <Trans t={t} i18nKey="language.french" />
      </option>
    </select>
  );
}
