import React from "react";

interface OverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80">
        <h3 className="text-lg font-bold mb-4">Confirm Action</h3>
        <p className="mb-4">
          You will be redirected to the shopping experience with this user
          logged in. Do you want to continue?
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onConfirm}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition"
          >
            Continue
          </button>
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Overlay;
