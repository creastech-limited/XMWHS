import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import Footer from '../components/Footer';

const SchoolLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header PsettingsPage="/settings" />

      <div className="flex flex-grow">
        <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-0 bg-none">
          <Sidebar />
        </aside>

        <Outlet />
      </div>

      <Footer />
    </div>
  );
};

export default SchoolLayout;