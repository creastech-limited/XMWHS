import React from 'react';
import { Outlet } from 'react-router-dom';
import DidAgentSidebar from '../components/Agent/DidAgentSidebar';
import StoreHeader from '../components/StoreHeader';
import Footer from '../components/Footer';

const DidAgentLayout: React.FC = () => {
  return (
    <div className="text-gray-600 flex min-h-screen flex-col bg-[#F7F8FC]">
      <StoreHeader />
      <div className="z-100">
        <DidAgentSidebar />
      </div>

      <main className="flex-grow min-w-0 p-4 lg:p-6 lg:ml-[240px] transition-all duration-300">
        <Outlet />
      </main>

      <div className="fixed bottom-0 left-0 w-full">
        <Footer />
      </div>
    </div>
  );
};

export default DidAgentLayout;