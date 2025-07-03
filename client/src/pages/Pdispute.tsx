import React from 'react';
import Psidebar from '../components/Psidebar';
import Footer from '../components/Footer';
import { Header } from '../components/Header';
import RaiseDispute from '../components/RaiseDispute';

const Pdispute: React.FC = () => {
  return (
      <div className="bg-gray-50 min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col min-h-screen">
          <div className="flex flex-grow gap-6">
            <div className="z-[100] fixed top-20 left-0 h-[calc(100vh-6rem)]">
              <Psidebar />
            </div>
        {/* Main Content Area */}
        <div className="flex-1">
          {/* Content Container */}
          <div className="flex flex-col min-h-full">
            {/* Main Content */}
            <main className="flex-1">
              <RaiseDispute />
            </main>
            
            {/* Footer */}
            <Footer />
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pdispute;