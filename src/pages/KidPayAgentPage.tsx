import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import KidsHeader from '../components/KidsHeader';
import Footer from '../components/Footer';

// Icons
import { 
  ArrowLeft, 
  Download, 
  RefreshCcw, 
  User, 
  CreditCard, 
  History, 
  GraduationCap, 
  Settings
} from 'lucide-react';

// Define type for kid data
interface KidData {
  kidName: string;
  balance: number;
  qrCodeId: string;
  hasNotifications: boolean;
  avatar: string | null;
}

const KidPayAgentPage: React.FC = () => {
  // Dummy kid data - replace with real API data in production
  const kidData: KidData = {
    kidName: "Kid John Doe",
    balance: 15000,
    qrCodeId: "kid-john-doe-unique-id-67890",
    hasNotifications: true,
    avatar: null
  };

  // Ref for the QR code element
  const qrRef = useRef<HTMLDivElement>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [qrAnimating, setQrAnimating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(1); // Pay Agent tab active by default

  // Define navigation items
  const navItems = [
    { label: "Dashboard", icon: <User className="w-5 h-5" />, route: "/kidswallet" },
    { label: "Pay Agent", icon: <CreditCard className="w-5 h-5" />, route: "/kidpayagent" },
    { label: "History", icon: <History className="w-5 h-5" />, route: "/kidpaymenthistory" },
    { label: "School Bills", icon: <GraduationCap className="w-5 h-5" />, route: "/schoolbills" },
    { label: "Settings", icon: <Settings className="w-5 h-5" />, route: "/ksettings" },
  ];

  const handleDownloadQRCode = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `${kidData.kidName.replace(/\s+/g, '-').toLowerCase()}-qr-code.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        setSnackbarOpen(true);
        
        // Auto-hide snackbar after 3 seconds
        setTimeout(() => setSnackbarOpen(false), 3000);
      }
    }
  };

  const refreshQRCode = () => {
    setQrAnimating(true);
    // Simulate refreshing the QR code (in production, regenerate the QR code)
    setTimeout(() => setQrAnimating(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 md:py-8">
      <div className="container mx-auto max-w-5xl px-4 flex flex-col min-h-screen">
        {/* Using imported KidsHeader component */}
        <KidsHeader 
          profile={{
            name: kidData.kidName
          }}
          wallet={{
            balance: kidData.balance
          }}
        />

        {/* Navigation Tabs */}
        <div className="mb-6 bg-white rounded-xl overflow-hidden shadow-md">
          <div className="flex overflow-x-auto scrollbar-hide">
            {navItems.map((item, index) => (
              <Link 
                key={item.label} 
                to={item.route}
                className={`flex-shrink-0 flex flex-col md:flex-row items-center px-4 md:px-6 py-4 md:py-3 min-w-[80px] md:min-w-[120px] gap-2 border-b-2 transition-all ${
                  index === activeTab 
                    ? "border-indigo-600 text-indigo-600 font-semibold" 
                    : "border-transparent text-gray-600 hover:bg-indigo-50"
                }`}
                onClick={() => setActiveTab(index)}
              >
                <div className="text-center md:text-left">
                  {item.icon}
                </div>
                <span className="text-xs md:text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8 text-center relative overflow-hidden">
          <h1 className="text-2xl md:text-3xl font-bold text-indigo-800 inline-block relative mb-6">
            Pay to Agent
            <div className="absolute h-1 w-1/3 bg-gradient-to-r from-indigo-600 to-transparent bottom-[-8px] left-1/3 rounded-full"></div>
          </h1>
          
          <p className="text-gray-600 max-w-xl mx-auto mb-8 text-lg">
            Present this QR Code to the agent. The agent will scan your unique QR Code to process your payment safely.
          </p>
          
          <div 
            ref={qrRef}
            className={`flex flex-col items-center my-8 p-6 rounded-xl bg-gradient-to-br from-white to-indigo-50 shadow-md max-w-sm mx-auto relative transition-all duration-300 ${
              qrAnimating ? 'scale-95 opacity-80' : 'scale-100 opacity-100'
            }`}
          >
            <div className="p-4 bg-white rounded-lg shadow-sm mb-4">
              <QRCodeCanvas 
                value={kidData.qrCodeId} 
                size={240} 
                level="H" 
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#4338ca" 
              />
            </div>
            
            <p className="text-sm text-gray-500 mt-2">
              Unique ID: <span className="font-bold text-indigo-700">{kidData.qrCodeId}</span>
            </p>
            
            <button 
              onClick={refreshQRCode}
              className="absolute top-3 right-3 p-2 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition-colors"
              title="Refresh QR Code"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex justify-center mt-6">
            <button 
              onClick={handleDownloadQRCode}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-700 to-indigo-600 text-white font-medium shadow-md hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300"
            >
              <Download className="w-5 h-5" />
              Download QR Code
            </button>
          </div>
        </div>

        {/* Back to Dashboard Button */}
        <div className="text-center mt-2 mb-12">
          <Link 
            to="/kidswallet"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-indigo-600 text-indigo-600 font-medium hover:bg-indigo-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>

        {/* Toast notification for download success */}
        {snackbarOpen && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg bg-green-600 text-white shadow-lg flex items-center gap-2 animate-fade-in-up">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>QR Code downloaded successfully!</span>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
};

export default KidPayAgentPage;