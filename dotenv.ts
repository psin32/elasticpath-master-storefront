import * as readline from "node:readline";
import { PropertiesEditor } from "properties-file/editor";
import {
  AccountAuthenticationSettings,
  gateway,
  Moltin,
  PasswordProfileBody,
} from "@moltin/sdk";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const inputValue = (text: string) => {
  return new Promise<string>((resolve) => rl.question(text, resolve));
};

export const main = async () => {
  const region = await inputValue(
    "Enter Elastic Path Store Region: <EU/US> - ",
  );
  let host = "euwest.api.elasticpath.com";
  if (region.toLowerCase() === "eu") {
    host = "euwest.api.elasticpath.com";
  } else if (region.toLowerCase() === "us") {
    host = "useast.api.elasticpath.com";
  } else {
    console.error("Invalid region selected");
    rl.close();
    process.exit(1);
  }
  const clientId = await inputValue("Enter Elastic Path Store Client Id: ");
  const clientSecret = await inputValue(
    "Enter Elastic Path Store Client Secret: ",
  );

  const epcc: Moltin = gateway({
    client_id: clientId,
    client_secret: clientSecret,
    host,
  });
  const accountAuthSettings = await epcc.AccountAuthenticationSettings.Get();
  const realmId =
    accountAuthSettings.data.relationships.authentication_realm.data.id;
  const passwordProfileId = await generatePasswordProfile(realmId, epcc);
  await updateAccountAuthenticationSettings(epcc);
  //   await getIntegrationHubAccessToken(epcc);

  const properties = new PropertiesEditor("");
  properties.insert("NEXT_PUBLIC_EPCC_CLIENT_ID", clientId);
  properties.insert("EPCC_CLIENT_SECRET", clientSecret);
  properties.insert("NEXT_PUBLIC_EPCC_ENDPOINT_URL", host);
  properties.insert("NEXT_PUBLIC_AUTHENTICATION_REALM_ID", realmId);
  properties.insert("NEXT_PUBLIC_PASSWORD_PROFILE_ID", passwordProfileId);
  console.log(properties.format());
  rl.close();
};

const updateAccountAuthenticationSettings = async (epcc: Moltin) => {
  const request: Partial<AccountAuthenticationSettings> = {
    type: "account_authentication_settings",
    enable_self_signup: true,
    auto_create_account_for_account_members: true,
    account_member_self_management: "update_only",
  };

  await epcc.AccountAuthenticationSettings.Update(request);
};

const generatePasswordProfile = async (
  realmId: string,
  epcc: Moltin,
): Promise<string> => {
  let profileId = "";
  const passwordProfiles = await epcc.PasswordProfile.All(realmId);
  if (passwordProfiles.data.length > 0) {
    profileId = passwordProfiles.data[0].id;
  } else {
    const data: PasswordProfileBody = {
      type: "password_profile",
      name: "password profile",
      username_format: "email",
    };
    const response = await epcc.PasswordProfile.Create(realmId, { data });
    profileId = response.data.id;
  }
  return profileId;
};

const getIntegrationHubAccessToken = async (epcc: Moltin) => {
  const response = await epcc.request.send(
    `/platform-integrations/authentication-token`,
    "GET",
    null,
    undefined,
    epcc,
    undefined,
    "v2",
  );
  console.log("response", response);
};

main();
