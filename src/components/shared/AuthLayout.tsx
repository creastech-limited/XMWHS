import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  linkText?: string;
  linkTo?: string;
  linkLabel?: string;
  logo: string;
  bgImage: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  linkText,
  linkTo,
  linkLabel,
  logo,
  bgImage
}) => {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-indigo-900/60 z-0" />

      <div className="z-10 w-full max-w-md p-8 bg-white bg-opacity-95 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 hover:shadow-indigo-200">
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg mb-4 border-4 border-indigo-100">
            <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
          </div>

          <h1 className="text-2xl font-bold text-indigo-900">{title}</h1>

          {subtitle && (
            <p className="text-gray-600 text-center mt-1">{subtitle}</p>
          )}

          {linkText && linkTo && (
            <p className="text-gray-600 mt-2">
              {linkText}{' '}
              <RouterLink to={linkTo} className="text-indigo-700 font-semibold hover:underline">
                {linkLabel || linkText}
              </RouterLink>
            </p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
};