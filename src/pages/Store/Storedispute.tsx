import React from 'react';
import RaiseDispute from '../../components/RaiseDispute';

const Storedispute: React.FC = () => {
  return (
    <>
      {/* Content Container */}
      <div className="flex flex-col min-h-full">
        {/* Main Content */}
        <main className="flex-1 mb-20 md:mb-10">
          <RaiseDispute />
        </main>
      </div>
    </>
  );
};

export default Storedispute;