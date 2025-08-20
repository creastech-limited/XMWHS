import React from 'react';
import StoreSidebar from '../../components/StoreSidebar';
import StoreHeader from '../../components/StoreHeader';
import Footer from '../../components/Footer';
import RaiseDispute from '../../components/RaiseDispute';

const Storedispute: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <StoreHeader />
      
      <div className="flex flex-1">
        {/* Sidebar */}
      <div className="z-100">
      <StoreSidebar />  
      </div>
        
        {/* Main Content Area */}
        <div className="flex-1">
          {/* Content Container */}
          <div className="flex flex-col min-h-full">
            {/* Main Content */}
            <main className="flex-1 mb-20 md:mb-10">
              <RaiseDispute />
            </main>
            
            {/* Footer */}
            <div className="fixed bottom-0 left-0 w-full">
        <Footer />
      </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Storedispute;