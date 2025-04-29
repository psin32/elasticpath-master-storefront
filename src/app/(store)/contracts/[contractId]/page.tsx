import { cookies } from "next/headers";
import {
  getSelectedAccount,
  retrieveAccountMemberCredentials,
} from "../../../../lib/retrieve-account-member-credentials";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../../../../lib/cookie-constants";
import { redirect } from "next/navigation";
import { ContractDetails } from "../../../../components/contracts/ContractDetails";
import {
  ContractLineItem,
  getContractById,
} from "../../../(checkout)/create-quote/contracts-service";
import { getServerSideImplicitClient } from "../../../../lib/epcc-server-side-implicit-client";
import { ProductResponse } from "@elasticpath/js-sdk";

type Props = {
  params: {
    contractId: string;
  };
};

export default async function Page({ params }: Props) {
  const { contractId } = params;
  const cookieStore = cookies();

  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookieStore,
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  if (!accountMemberCookie) {
    return redirect("/login");
  }

  const contract = await getContractById(contractId);

  const selectedAccount = getSelectedAccount(accountMemberCookie);

  const client = getServerSideImplicitClient();

  const lineItemIds = contract.data.line_items?.data.map(
    (item: ContractLineItem) => item.product_id,
  );
  const lineItemProducts = await client.ShopperCatalog.Products.Filter({
    in: {
      id: lineItemIds,
    },
  }).All();

  const productLookup = lineItemProducts.data.reduce(
    (acc, product) => {
      acc[product.id] = product;
      return acc;
    },
    {} as Record<string, ProductResponse>,
  );

  console.log("contract", contract);
  console.log("lineItemProducts", lineItemProducts);
  return (
    <ContractDetails
      contractResponse={contract}
      productLookup={productLookup}
      account={selectedAccount}
    />
  );
}
