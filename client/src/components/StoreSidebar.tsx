import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  History,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  route: string;
}

const StoreSidebar: React.FC = () => {
  const [activeItem, setActiveItem] = useState<string>('Dashboard');
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const handleDrawerToggle = (): void => {
    setMobileOpen(!mobileOpen);
  };

  // Top menu items with updated routes
  const topMenuItems: MenuItem[] = [
    { text: 'Dashboard', icon: <LayoutDashboard size={20} />, route: '/store' },
    { text: 'Manage Agents', icon: <Users size={20} />, route: '/agents' },
    { text: 'Transaction History', icon: <History size={20} />, route: '/stransactions' },
    { text: 'Withdrawal', icon: <CreditCard size={20} />, route: '/Swithdrawal' }
  ];

  // Bottom menu items with updated routes
  const bottomMenuItems: MenuItem[] = [
    { text: 'Settings', icon: <Settings size={20} />, route: '/store/settings' },
    { text: 'Logout', icon: <LogOut size={20} />, route: '/login' }
  ];

  const handleMenuItemClick = (item: MenuItem): void => {
    setActiveItem(item.text);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const renderMenuItem = (item: MenuItem, isActive: boolean) => (
    <Link
      key={item.text}
      to={item.route}
      className="block text-white no-underline"
      onClick={() => handleMenuItemClick(item)}
    >
      <div 
        className={`
          mx-4 my-2 p-3 rounded-xl relative cursor-pointer
          transition-all duration-300 ease-in-out
          hover:bg-white/10 hover:translate-x-1
          ${isActive ? 'bg-white/10' : 'bg-transparent'}
        `}
      >
        <div className="flex items-center">
          <div className="text-white min-w-[40px] mr-3">
            {item.icon}
          </div>
          <span 
            className={`
              text-[0.95rem] 
              ${isActive ? 'font-semibold' : 'font-normal'}
            `}
          >
            {item.text}
          </span>
        </div>
        {isActive && (
          <div className="absolute right-0 top-0 w-1 h-full bg-white rounded-l"></div>
        )}
      </div>
    </Link>
  );

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-indigo-900 text-white">
      <div>
        {/* Logo Container */}
        <div className="flex flex-col items-center p-6 mb-4">
          <h6 className="text-lg font-semibold opacity-90">
            Store Portal
          </h6>
        </div>

        {/* Top Menu Items */}
        <nav className="px-1">
          {topMenuItems.map((item) => 
            renderMenuItem(item, activeItem === item.text)
          )}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-3">
        <div className="h-px bg-white/10 my-2"></div>
        <nav className="px-1">
          {bottomMenuItems.map((item) => 
            renderMenuItem(item, activeItem === item.text)
          )}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={handleDrawerToggle}
        className="
          fixed top-4 left-4 z-50
          bg-indigo-900 text-white p-2 rounded-lg
          hover:bg-indigo-900 transition-colors
          md:hidden
        "
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-[280px] flex-shrink-0">
        <div className="fixed top-0 left-0 w-[280px] h-full border-r-0">
          {sidebarContent}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={handleDrawerToggle}
          ></div>
          
          {/* Sidebar */}
          <div className="fixed top-0 left-0 w-56 sm:w-[220px] h-full transform transition-transform duration-300 ease-in-out">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default StoreSidebar;