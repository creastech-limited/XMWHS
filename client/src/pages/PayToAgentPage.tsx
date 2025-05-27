import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Psidebar from '../components/Psidebar';
import Footer from '../components/Footer';
import { Header } from '../components/Header';

const PayToAgentPage: React.FC = () => {
  // Unique QR code data for the parent
  const uniqueQRData = "parent-john-doe-unique-id-12345";

  // Create a ref for the QRCodeCanvas element
  const qrRef = useRef<HTMLDivElement>(null);

  // Function to download the QR Code image
  const handleDownload = () => {
    if (qrRef.current) {
      // Get the canvas element and its data URL
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        const pngUrl = canvas.toDataURL("image/png");
        // Create a temporary link element
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = "qr-code.png";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header - Full width at the top */}
      <Header />
      
      {/* Main content area with sidebar and content */}
      <div className="flex flex-grow">
        {/* Sidebar - Fixed width */}
        <div className="w-64 bg-white shadow-md">
          <Psidebar />
        </div>
        
        {/* Main content - Flexible width */}
        <div className="flex-grow p-6">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-center mb-2">
              Pay to Agent
            </h1>
            <p className="text-center mb-4">
              Use your unique QR Code to pay for goods and services at the agent.
            </p>
            <div 
              ref={qrRef}
              className="flex flex-col items-center mt-8"
            >
              <QRCodeCanvas 
                value={uniqueQRData} 
                size={256} 
                level="H" 
                includeMargin={true} 
              />
              <p className="text-sm text-center mt-4">
                Show this QR Code to the agent to complete your payment.
              </p>
              <button 
                className="mt-6 bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded-md transition-colors"
                onClick={handleDownload}
              >
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer - Full width at the bottom */}
      <Footer />
    </div>
  );
};

export default PayToAgentPage;