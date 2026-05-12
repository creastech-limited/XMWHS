import React from "react";
import { useNavigate } from "react-router-dom";

const SuccessPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="mb-4 text-blue-800">Success!</h1>
        <p className="mb-7 text-gray-600">
          Your Account has been created successfully.
        </p>
        <button
          type="button"
          onClick={handleBackToLogin}
          className="w-full py-3 px-4.5 rounded-md bg-indigo-900 text-white text-base cursor-pointer"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default SuccessPage;
