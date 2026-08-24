import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { ErrorAlert } from './ErrorAlert';

interface InvalidTokenPageProps {
  errorMessage: string;
  logo: string;
  bgImage: string;
  linkTo: string;
  linkText: string;
  title?: string;
  description?: string;
}

export const InvalidTokenPage: React.FC<InvalidTokenPageProps> = ({
  errorMessage,
  logo,
  bgImage,
  linkTo,
  linkText,
  title = 'Invalid Reset Link',
  description = 'This password reset link is invalid or has expired.'
}) => {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-indigo-900/60 z-0" />

      <div className="z-10 w-full max-w-md p-8 bg-white bg-opacity-95 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 hover:shadow-indigo-200">
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center shadow-lg mb-6 border-4 border-indigo-100">
            <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">{title}</h1>
          <p className="text-gray-600 mb-6 text-center">{description}</p>
        </div>

        <ErrorAlert message={errorMessage} />

        <div className="mt-6 text-center">
          <RouterLink
            to={linkTo}
            className="text-indigo-900 font-medium hover:text-indigo-700 transition-colors duration-200 inline-block"
          >
            {linkText}
          </RouterLink>
        </div>
      </div>
    </div>
  );
};