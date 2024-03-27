import Link from "next/link";
import { NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuTrigger } from "../navigation-menu/NavigationMenu";

const buildStack = (item: any) => {
  return (
    <div key={item._uid} className="flex flex-col gap-3 text-sm text-gray-500">
      <span className="font-semibold text-black">{item.name}</span>
      {item.menu.map((child: any) => (
        <Link
          key={child._uid}
          href={child.link.url}
          legacyBehavior
          passHref
        >
          <NavigationMenuLink className="hover:text-brand-primary hover:underline">
            {child.name}
          </NavigationMenuLink>
        </Link>
      ))}
    </div>
  );
};

const MenuLink = ({ blok }: any) => {
  return (
    <NavigationMenuItem key={blok._uid}>
      <NavigationMenuTrigger className="p-0 ui-focus-visible:ring-2 ui-focus-visible:ring-offset-2 mr-4 text-sm font-medium text-black hover:underline focus:text-brand-primary focus:outline-none active:text-brand-primary">
        <Link
          href={blok.link.url}
          legacyBehavior
          passHref
        >
          {blok.name}
        </Link>
      </NavigationMenuTrigger>
      {blok.menu.length > 0 && (
        <NavigationMenuContent className="bg-white">
          <div className="flex flex-col w-[400px] md:w-[500px] lg:w-[600px] px-8 pt-8">
            <div className="grid grid-cols-2 gap-y-12 md:grid-cols-3 w-full">
              {blok.menu.map(
                (parent: any, index: number) => {
                  return <div key={index}>{buildStack(parent)}</div>;
                },
              )}
            </div>
            <hr className="my-6"></hr>
          </div>
        </NavigationMenuContent>
      )}
    </NavigationMenuItem>
  )
}

export default MenuLink
