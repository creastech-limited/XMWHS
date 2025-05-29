import StoreHeader from "../components/StoreHeader";
import StoreSidebar from "../components/StoreSidebar";
import Footer from "../components/Footer";
import SettingsPanel from "../components/SettingsPanel";

const StoreSettingsPage = () => {
  return (
    <div className="text-gray-700 flex flex-col min-h-screen bg-gray-50">
      <StoreHeader />
      
      <div className="flex flex-col md:flex-row flex-1">
        {/* Sidebar - hidden on mobile, shown on md screens and up */}
        <div className="md:w-64">
          <StoreSidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">
          <div className="bg-gray-50 p-6 md:p-8 rounded-xl shadow-sm">
                      
            <div className="space-y-6">
              <SettingsPanel  />
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default StoreSettingsPage;