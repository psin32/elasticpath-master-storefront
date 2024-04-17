import MobileNavBar from "./navigation/MobileNavBar";
import NavBar from "./navigation/NavBar";
import { Suspense } from "react";
import { AccountMenu } from "./account/AccountMenu";
import { AccountSwitcher } from "./account/AccountSwitcher";
import { Cart } from "../cart/CartSheet";
import Logo from "./Logo";
import { getBanner } from "../../services/storyblok";
import Content from "../storyblok/Content";
import CurrencySelector from "./CurrencySelector";
import CatalogSelector from "./CatalogSelector";

const Header = async () => {
  const content = await getBanner();
  return (
    <div className="sticky z-40 border-b border-gray-200 bg-white">
      <Content content={content}></Content>
      <Suspense>
        <MobileNavBar />
      </Suspense>
      <div className="hidden w-full items-center justify-between md:flex p-4">
        <Logo />
        <div className="w-full max-w-base-max-width">
          <Suspense>
            <div>
              <NavBar />
            </div>
          </Suspense>
        </div>
        <div className="flex items-center self-center gap-x-2">
          <CatalogSelector />
          <CurrencySelector />
          <AccountMenu accountSwitcher={<AccountSwitcher />} />
          <Cart />
        </div>
      </div>
    </div>
  );
};

export default Header;
