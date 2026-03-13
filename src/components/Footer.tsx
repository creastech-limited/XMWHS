// src/components/Footer.tsx
import React from 'react';
import logo from '/xpay.jpeg';
const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-gray-100 py-4 flex flex-col sm:flex-row items-center justify-center text-center">
      <img
        src={logo}
        alt="Logo"
        className="w-10 sm:w-10 mb-2 sm:mb-0 sm:mr-3"
      />
      <p className="text-sm text-gray-600">
        © {year} Creastech. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
