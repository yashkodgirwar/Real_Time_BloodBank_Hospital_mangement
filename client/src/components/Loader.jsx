import React from 'react';

const Loader = ({ message = "Loading BloodLink..." }) => {
  return (
    <div id="loaderOverlay" className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        {/* SVG Blood Drop */}
        <svg className="h-20 w-20 animate-bounce" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 2C32 2 10 26 10 40C10 53.25 20.75 62 32 62C43.25 62 54 53.25 54 40C54 26 32 2 32 2Z" fill="#dc2626" />
        </svg>
        <p className="text-red-600 font-semibold text-lg animate-pulse">{message}</p>
      </div>
    </div>
  );
};

export default Loader;
