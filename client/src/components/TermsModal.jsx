import React from 'react';

const TermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div id="termsModal" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white max-w-lg w-full p-6 rounded-lg shadow-lg relative mx-4 animate-fadeIn">
        <h3 className="text-xl font-bold mb-4">Terms and Conditions</h3>
        <div className="max-h-60 overflow-y-auto text-sm text-gray-700 pr-2">
          <p className="mb-2">Welcome to our Blood Bank and Hospitals Management System. By using this site, you agree to the following terms...</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>You must be an authorized representative to register.</li>
            <li>Do not misuse the platform or provide false data.</li>
            <li>Your information is used to operate this service and is not shared without consent.</li>
            <li>We are not responsible for data inaccuracies or misuse.</li>
            <li>These terms may be updated anytime.</li>
          </ul>
          <p className="mt-2">Please contact us for any questions or clarifications.</p>
        </div>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Close
        </button>
      </div>
    </div>
  );
};

export default TermsModal;
