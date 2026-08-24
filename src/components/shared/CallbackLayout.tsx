import React from 'react';

interface CallbackLayoutProps {
  children: React.ReactNode;
  bgColor?: string;
}

export const CallbackLayout: React.FC<CallbackLayoutProps> = ({
  children,
  bgColor = 'bg-gray-50'
}) => {
  return (
    <div className={`min-h-screen ${bgColor} flex items-center justify-center px-4`}>
      {children}
    </div>
  );
};