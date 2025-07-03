import React from 'react';
import Psidebar from '../components/Psidebar';
import Footer from '../components/Footer';
import { Header } from '../components/Header';
import RaiseDispute from '../components/RaiseDispute';

const Pdispute: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
         <Header profilePath="/psettings"/>
         <div className="z-[100] flex flex-1">
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

  );
};

export default Pdispute;