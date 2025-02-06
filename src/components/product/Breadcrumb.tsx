import { Node } from "@elasticpath/js-sdk";

interface IBreadcrumb {
  productName: string;
  breadcrumb: Node[];
}

const Breadcrumb = ({ productName, breadcrumb }: IBreadcrumb): JSX.Element => {
  let breadcrumbUrl = "/search";
  return (
    <nav aria-label="Breadcrumb" className="pb-6">
      <ol
        role="list"
        className="mx-auto flex max-w-2xl items-center space-x-2 lg:max-w-7xl"
      >
        {breadcrumb &&
          breadcrumb.map((node: Node) => {
            breadcrumbUrl = breadcrumbUrl + "/" + node.attributes.slug;
            return (
              <li key={node.id}>
                <div className="flex items-center">
                  <a
                    href={breadcrumbUrl}
                    className="mr-2 text-sm font-medium text-gray-900"
                  >
                    {node.attributes.name}
                  </a>
                  <svg
                    width="16"
                    height="20"
                    viewBox="0 0 16 20"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-5 w-4 text-gray-300"
                  >
                    <path d="M5.697 4.34L8.98 16.532h1.327L7.025 4.341H5.697z" />
                  </svg>
                </div>
              </li>
            );
          })}

        <li className="text-sm">
          <a
            href="#"
            aria-current="page"
            className="font-medium text-gray-500 hover:text-gray-600"
          >
            {productName}
          </a>
        </li>
      </ol>
    </nav>
  );
};

export default Breadcrumb;
