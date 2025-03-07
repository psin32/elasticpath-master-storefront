import * as readline from "node:readline";
import { PropertiesEditor } from "properties-file/editor";
import {
  AccountAuthenticationSettings,
  gateway,
  ElasticPath,
  PasswordProfileBody,
} from "@elasticpath/js-sdk";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const inputValue = (text: string) => {
  return new Promise<string>((resolve) => rl.question(text, resolve));
};

const mutation = `
  mutation {
    addModel(
      body: {
        id: "58726043578943c09a70996b8dc546c7",
        name: "navigation",
        kind: "data",
        showTargeting: true,
        allowHeatmap: true,
        showMetrics: true,
        publicReadable: true,
        helperText: "Navigation",
        bigData: false,
        strictPrivateWrite: false,
        showScheduling: true,
        showAbTests: true,
        pathPrefix: "/",
        componentsOnlyMode: false,
        fields: [
          {
            type: "list",
            name: "data",
            required: false,
            subFields: [
              {
                type: "text",
                name: "name",
              },
              {
                type: "text",
                name: "slug",
              },
              {
                type: "url",
                name: "href",
              },
              {
                type: "boolean",
                name: "enabled",
                defaultValue: true,
              },
              {
                type: "file",
                name: "image",
              },
              {
                type: "list",
                name: "children",
                subFields: [
                  {
                    type: "text",
                    name: "name",
                  },
                  {
                    type: "text",
                    name: "slug",
                  },
                  {
                    type: "boolean",
                    name: "enabled",
                    defaultValue: true,
                  },
                  {
                    type: "url",
                    name: "href",
                  },
                  {
                    type: "file",
                    name: "image",
                  },
                  {
                    type: "list",
                    name: "children",
                    subFields: [
                      {
                        type: "text",
                        name: "name",
                      },
                      {
                        type: "text",
                        name: "slug",
                      },
                      {
                        type: "boolean",
                        name: "enabled",
                        defaultValue: true,
                      },
                      {
                        type: "url",
                        name: "href",
                      },
                      {
                        type: "file",
                        name: "image",
                      },
                      {
                        type: "list",
                        name: "children",
                        subFields: [
                          {
                            type: "text",
                            name: "name",
                          },
                          {
                            type: "text",
                            name: "slug",
                          },
                          {
                            type: "boolean",
                            name: "enabled",
                            defaultValue: true,
                          },
                          {
                            type: "url",
                            name: "href",
                          },
                          {
                            type: "file",
                            name: "image",
                          },
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
      }
    ) {
      id
      name
      kind
      publicReadable
    }
  }`;

export const main = async () => {
  // const builderIOPrivateAPIKey = await inputValue(
  //   "Enter Builder.IO private key - ",
  // );
  // await createModel(builderIOPrivateAPIKey);

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

  const epcc: ElasticPath = gateway({
    client_id: clientId,
    client_secret: clientSecret,
    host,
  });
  await epcc.Authenticate().catch((err) => {
    console.log("Invalid Credentials", err);
    rl.close();
    process.exit(1);
  });
  const accountAuthSettings = await epcc.AccountAuthenticationSettings.Get();
  const realmId =
    accountAuthSettings.data.relationships.authentication_realm.data.id;
  const passwordProfileId = await generatePasswordProfile(realmId, epcc);
  await updateAccountAuthenticationSettings(epcc);

  const purchaseOrderInput = await inputValue(
    "Enable Purchase Order in Checkout: <true/false>, default value is false \nNote:- If you select true then manual payment will be enabled - ",
  );
  const purchaseOrder =
    purchaseOrderInput.toLowerCase() === "true" ? true : false;

  if (purchaseOrder) {
    await epcc.Gateways.Enabled("manual", true).catch((err) => {
      console.error("Error while enabled manual gateway", err);
    });
    const flows = await epcc.Flows.All().catch((err) => {
      console.error("Error while getting all flows", err);
      return err;
    });
    const ordersFlow = flows.data.find((flow: any) => flow.slug === "orders");
    let flowId = "";
    if (ordersFlow?.name) {
      flowId = ordersFlow.id;
    } else {
      const orders = await epcc.Flows.Create({
        type: "flow",
        slug: "orders",
        name: "Orders Extension",
        description: "Orders Extension",
        enabled: true,
      }).catch((err) => {
        console.error("Error while creating flow", err);
        return err;
      });
      flowId = orders.data.id;
    }
    const fieldRequest: any = {
      type: "field",
      field_type: "string",
      name: "Purchase Order Number",
      slug: "purchase_order_number",
      description: "Purchase Order Number",
      validation_rules: [],
      required: false,
      default: "",
      enabled: true,
      order: 1,
      omit_null: false,
      relationships: {
        flow: {
          data: {
            type: "flow",
            id: flowId,
          },
        },
      },
    };
    await epcc.Fields.Create(fieldRequest).catch((err) => {
      console.error("Error while creating fields", err);
    });
  }

  const clickAndCollectInput = await inputValue(
    "Enable Click And Collect: <true/false>, default value is false - ",
  );
  const clickAndCollect =
    clickAndCollectInput.toLowerCase() === "true" ? "true" : "false";

  const plpInput = await inputValue(
    "Select PLP View: <grid/list>, default value is grid - ",
  );
  let plpView = "grid";
  if (plpInput.toLowerCase() === "list") {
    plpView = "list";
  }

  const stripeAccountId = await inputValue("Enter Stripe Account ID - ");

  const stripePublishableKey = await inputValue(
    "Enter Stripe Publishable Key - ",
  );

  await epcc.Gateways.Update("elastic_path_payments_stripe", {
    enabled: true,
    stripe_account: stripeAccountId,
    test: true,
  }).catch((err) => {
    console.error("Error while enabling stripe account", err);
  });

  const siteNameInput = await inputValue(
    "Enter site name e.g. Clothing - Elastic Path, default value Elastic Path - ",
  );
  const siteName = siteNameInput || "Elastic Path";

  const currencyInput = await inputValue(
    "Enter currency e.g. USD, GBP, CAD, EUR etc., default is USD -  ",
  );
  const currency = currencyInput || "USD";

  const properties = new PropertiesEditor("");
  properties.insert("NEXT_PUBLIC_EPCC_CLIENT_ID", clientId);
  properties.insert("EPCC_CLIENT_SECRET", clientSecret);
  properties.insert("NEXT_PUBLIC_EPCC_ENDPOINT_URL", host);
  properties.insert("NEXT_PUBLIC_AUTHENTICATION_REALM_ID", realmId);
  properties.insert("NEXT_PUBLIC_PASSWORD_PROFILE_ID", passwordProfileId);
  properties.insert(
    "NEXT_PUBLIC_ENABLE_CLICK_AND_COLLECT",
    clickAndCollect.toString(),
  );
  properties.insert("NEXT_PUBLIC_DEFAULT_PLP_VIEW", plpView);
  properties.insert("NEXT_PUBLIC_COOKIE_PREFIX_KEY", "_store");
  properties.insert("NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION", "true");
  properties.insert("SITE_NAME", siteName);
  properties.insert("NEXT_PUBLIC_DEFAULT_CURRENCY_CODE", currency);
  properties.insert(
    "NEXT_PUBLIC_ENABLE_PURCHASE_ORDER_CHECKOUT",
    purchaseOrder.toString(),
  );
  properties.insert("NEXT_PUBLIC_STRIPE_ACCOUNT_ID", stripeAccountId);
  properties.insert("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", stripePublishableKey);
  properties.insert("NEXTAUTH_URL", "http://localhost:3000");
  properties.insert("NEXTAUTH_SECRET", "your-secret-key");
  properties.insert("NEXT_PUBLIC_ENABLE_KLEVU", "false");
  properties.insert("NEXT_PUBLIC_ENABLE_YOTPO", "false");
  properties.insert("NEXT_PUBLIC_ENABLE_RATING", "false");
  properties.insert("NEXT_PUBLIC_ENABLE_ALGOLIA", "false");
  console.log("========================================================");
  console.log(properties.format());
  console.log("========================================================");
  rl.close();
};

const updateAccountAuthenticationSettings = async (epcc: ElasticPath) => {
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
  epcc: ElasticPath,
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

const getIntegrationHubAccessToken = async (epcc: ElasticPath) => {
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

const createModel = async (apiKey: string) => {
  try {
    const response = await fetch("https://builder.io/api/v2/admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query: mutation }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Response:", data);
    } else {
      console.error("Error:", data);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
};

main();
