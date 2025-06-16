import { Header } from '../components/Header';
import Psidebar from '../components/Psidebar';
import Footer from '../components/Footer';
import SettingsPanel from '../components/SettingsPanel';

const SettingsPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
         <Header />
         <div className="z-[100] flex flex-1">
           <Psidebar />
</div>
        {/* Settings panel fills remaining space, scrollable if needed */}
     <main className="flex-1 p-4 md:p-6 overflow-x-auto">
          <div className="p-4 md:p-6">
            <SettingsPanel />
          </div>
        </main>
      

      <Footer />

    </div>
  );
};

export default SettingsPage;