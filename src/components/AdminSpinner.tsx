import React from "react";

const AdminSpinner: React.FC = () => {
  return (
    <div className="relative h-24 w-24">
      <div
        className="absolute inset-0 rounded-full border-8 border-transparent animate-spin" // Thicker border
        style={{
          background:
            "conic-gradient(from 0deg, #FFB3BA, #FFDFBA, #FFFFBA, #BAFFC9, #BAE1FF, #FFB3BA)",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 8px), black 0)", // Adjusted mask for thicker border
          WebkitMask:
            "radial-gradient(farthest-side, transparent calc(100% - 8px), black 0)",
        }}
      ></div>
    </div>
  );
};

export default AdminSpinner;
