import StoreHeader from "../components/StoreHeader";
import StoreSidebar from "../components/StoreSidebar";
import Footer from "../components/Footer";
import SettingsPanel from "../components/SettingsPanel";

const StoreSettingsPage = () => {
  return (
    <div className="text-gray-700 flex flex-col min-h-screen bg-gray-50">
      <StoreHeader />
      
      <div className="flex flex-col lg:flex-row flex-1">
        {/* Sidebar - hidden on mobile, shown on lg screens and up */}
        <div className="z-100 lg:w-64">
          <StoreSidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-grow p-4 lg:p-8 transition-all duration-300">
          <div className="max-w-4xl mx-auto"> {/* Centering container */}
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm">
              <div className="space-y-6">
                <SettingsPanel />
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <div className="fixed bottom-0 left-0 w-full">
        <Footer />
      </div>
    </div>
  );
};

export default StoreSettingsPage;