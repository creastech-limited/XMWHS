// src/components/shared/ErrorDisplay.tsx
import React from 'react';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import Footer from '../../components/Footer';

interface ErrorDisplayProps {
  title: string;
  message: string;
  onRetry?: () => void;
  onLogin?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  message,
  onRetry,
  onLogin,
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header PsettingsPage="/settings" />
      <div className="flex flex-grow">
        <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-none">
          <Sidebar />
        </aside>
        <main className="flex-1 p-4 md:p-6 overflow-hidden md:ml-64">
          <div className="flex flex-col justify-center items-center h-64">
            <div className="text-red-500 text-center max-w-md">
              <p className="text-lg font-semibold mb-2">{title}</p>
              <p className="text-sm mb-4">{message}</p>
              {onLogin && (
                <button
                  onClick={onLogin}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Go to Login
                </button>
              )}
              {onRetry && !onLogin && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};