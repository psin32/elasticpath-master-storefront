import { XMarkIcon } from "@heroicons/react/24/outline";

const ErrorOverlay = ({ errors, onClose }: any) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-2xl max-w-5xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-red-600">Errors</h2>
          <XMarkIcon
            className="h-6 w-6 text-red-500 hover:text-red-700 cursor-pointer"
            aria-hidden="true"
            onClick={onClose}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white mb-12">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">SKU</th>
                <th className="py-3 px-6 text-left">Title</th>
                <th className="py-3 px-6 text-left">Detail</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {errors.map((error: any, index: number) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 hover:bg-gray-100"
                >
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    {error.meta.sku}
                  </td>
                  <td className="py-3 px-6 text-left">{error.title}</td>
                  <td className="py-3 px-6 text-left">{error.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ErrorOverlay;
