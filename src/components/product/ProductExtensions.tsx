import { Extensions } from "@moltin/sdk";
import { isSupportedExtension } from "../../lib/is-supported-extension";

interface IProductExtensions {
  extensions: Extensions;
}

const ProductExtensions = ({ extensions }: IProductExtensions): JSX.Element => {
  return (
    <>
      {Object.keys(extensions).map((extension: any) => {
        const extensionKeys = Object.keys(extensions[extension]);
        const regex = /\(([^)]+)\)/;
        const match = extension.match(regex);
        const extensionName = match ? match[1] : null;
        const extensionConfig = process.env.NEXT_PUBLIC_EXTENSIONS || "";
        const extensionList = extensionConfig.split(",");
        return (
          extensionList.includes(extensionName) && (
            <div className="flex flex-col w-full" key={extension}>
              <div className="flex bg-gray-100 text-gray-800 font-bold">
                <div className="w-1/4 p-3 basis-1/2 uppercase">
                  {extensionName}
                </div>
              </div>
              {extensionKeys.map((key) => {
                const value = extensions[extension][key];

                if (!isSupportedExtension(value)) {
                  console.warn(
                    `Unsupported product extension unable to render "${key}" key`,
                    value,
                  );
                  return;
                }

                if (!value) {
                  return;
                }

                return (
                  <Extension
                    key={`${key}-${value}`}
                    extKey={key}
                    value={value}
                  />
                );
              })}
            </div>
          )
        );
      })}
    </>
  );
};

function Extension({
  extKey,
  value,
}: {
  extKey: string;
  value: string | number | boolean;
}) {
  let decoratedValue = value;
  if (typeof value === "boolean") {
    decoratedValue = value ? "Yes" : "No";
  }

  return (
    <div className="flex bg-white border-b border-gray-200" key={extKey}>
      <div className="w-1/4 p-3 basis-1/3 capitalize text-sm font-normal text-gray-700">
        {extKey.replaceAll("-", " ")}
      </div>
      <div className="w-1/4 p-3 basis-3/4 text-sm text-gray-700">
        {decoratedValue}
      </div>
    </div>
  );
}

export default ProductExtensions;
