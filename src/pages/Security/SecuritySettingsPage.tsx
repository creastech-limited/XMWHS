import SecurityHeader from '../../components/SecurityHeader';
import SecuritySidebar from '../../components/SecuritySidebar';
import Footer from '../../components/Footer';
import SettingsPanel from '../../components/SettingsPanel';

const SecuritySettingsPage = () => {
  return (
    <div className="text-gray-700 flex min-h-screen flex-col bg-gray-50">
      <SecurityHeader />
      <div className="z-100">
        <SecuritySidebar />
      </div>

      <main className="flex-grow p-4 lg:ml-[280px] lg:p-8 transition-all duration-300">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 md:p-8">
            <div className="space-y-6">
              <SettingsPanel />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SecuritySettingsPage;
