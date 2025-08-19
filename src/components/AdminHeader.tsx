import { Menu, Bell } from 'lucide-react';

interface AdminHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeMenu: string;
}

const AdminHeader = ({ sidebarOpen, setSidebarOpen, activeMenu }: AdminHeaderProps) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Menu size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 capitalize">
              {activeMenu.replace('-', ' ')}
            </h2>
            <p className="text-sm text-gray-600">Manage your {activeMenu.replace('-', ' ')} settings</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Bell className="w-6 h-6 text-gray-600 cursor-pointer hover:text-gray-900 transition-colors" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </div>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">AD</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;