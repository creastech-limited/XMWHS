// src/components/shared/LoadingScreen.tsx
import React from 'react';
import { Header } from '../../components/Header';
import { Sidebar as Asidebar } from '../../components/Sidebar';
import Footer from '../../components/Footer';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...'
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header PsettingsPage="/settings" />
      <div className="flex flex-grow">
        <div className="hidden md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-0 bg-white shadow z-10">
          <Asidebar />
        </div>
        <main className="flex-1 p-4 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-r-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-indigo-800">{message}</p>
        </main>
      </div>
      <Footer />
    </div>
  );
};