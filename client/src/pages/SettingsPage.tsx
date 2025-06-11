import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import Footer from '../components/Footer';
import SettingsPanel from '../components/SettingsPanel';

const SettingsPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
         <Header />
         <div className="flex flex-grow">
          <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-none">
                           <Sidebar />
                         </aside>
                 
        {/* Settings panel fills remaining space, scrollable if needed */}
<main className="flex-1 p-4 md:p-6 overflow-x-auto">
          <div className="p-4 md:p-6">
            <SettingsPanel />
          </div>
        </main>
      </div>

     
        <Footer />

    </div>
  );
};

export default SettingsPage;