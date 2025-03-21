// Tooltip.js
import React from "react";

const Tooltip = ({ children, text }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-gray-900 text-gray-200 text-xs rounded-md px-2 py-1 z-10 shadow-lg border border-gray-700">
        {text}
      </div>
    </div>
  );
};

export default Tooltip;