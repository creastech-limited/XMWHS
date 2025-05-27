import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  HomeIcon as DashboardIcon,
  UsersIcon as PeopleIcon,
  ShoppingBagIcon as StorefrontIcon,
  CurrencyDollarIcon as PaymentIcon,
  ReceiptRefundIcon as ReceiptLongIcon,
  WalletIcon as AccountBalanceWalletIcon,
  ExclamationTriangleIcon as WarningIcon,
  Cog6ToothIcon as SettingsIcon,
  ArrowLeftOnRectangleIcon as LogoutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: number | null;
}

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  
  // Define menu items with your provided list
  const menuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/schools', icon: <DashboardIcon className="h-5 w-5" /> },
    { name: 'Students', path: '/students', icon: <PeopleIcon className="h-5 w-5" />, badge: 3 },
    { name: 'Stores', path: '/stores', icon: <StorefrontIcon className="h-5 w-5" /> },
    { name: 'School Fees', path: '/schoolfees', icon: <PaymentIcon className="h-5 w-5" /> },
    { name: 'Transactions', path: '/transactions', icon: <ReceiptLongIcon className="h-5 w-5" />, badge: 12 },
    { name: 'Withdrawal', path: '/withdrawal', icon: <AccountBalanceWalletIcon className="h-5 w-5" /> },
    { name: 'Disputes', path: '/disputes', icon: <WarningIcon className="h-5 w-5" />, badge: 2 },
    { name: 'Settings', path: '/settings', icon: <SettingsIcon className="h-5 w-5" /> },
  ];
  
  const handleLogout = () => {
    // Handle logout logic here
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getCurrentPageName = () => {
    if (location.pathname === '/') return 'Dashboard';
    const currentItem = menuItems.find(item => location.pathname.startsWith(item.path));
    return currentItem?.name || 'Dashboard';
  };

  return (
    <aside className={`bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white transition-all duration-300 flex flex-col h-screen shadow-2xl border-r border-blue-700/50 ${collapsed ? 'w-16' : 'w-72'}`}>
      {/* Logo section */}
      <div className="p-4 border-b border-blue-700/50 flex items-center justify-between relative">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <DashboardIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">
                Admin Panel
              </div>
              <div className="text-xs text-blue-300 opacity-80">Management System</div>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-2 rounded-lg bg-blue-800/50 hover:bg-blue-700/70 text-blue-200 hover:text-white transition-all duration-200 backdrop-blur-sm border border-blue-600/30 ${collapsed ? 'mx-auto' : ''}`}
        >
          {collapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4" />
          )}
        </button>
      </div>
      
      {/* Current route indicator */}
      {!collapsed && (
        <div className="px-4 py-3 bg-blue-800/30 border-b border-blue-700/30">
          <div className="text-xs text-blue-300 mb-1">Current Page</div>
          <div className="font-semibold text-blue-100 flex items-center">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
            {getCurrentPageName()}
          </div>
        </div>
      )}
      
      {/* Nav menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
              
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`group relative flex items-center px-3 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg border border-blue-400/30 backdrop-blur-sm'
                      : 'text-blue-200 hover:text-white hover:bg-blue-800/50 hover:shadow-md hover:backdrop-blur-sm' 
                  } ${collapsed ? 'justify-center' : 'space-x-3'}`}
                >
                  <div className={`relative p-2 rounded-lg transition-colors duration-200 ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'text-blue-300 group-hover:bg-white/10 group-hover:text-white'
                  }`}>
                    {item.icon}
                    
                    {/* Badge for collapsed mode */}
                    {collapsed && item.badge && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold shadow-lg animate-pulse">
                        {item.badge > 9 ? '9+' : item.badge}
                      </div>
                    )}
                  </div>

                  {!collapsed && (
                    <>
                      <span className="flex-1 font-medium">{item.name}</span>
                      {item.badge && (
                        <div className="flex items-center">
                          <span className="bg-red-500 text-white inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold shadow-lg animate-pulse">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        </div>
                      )}
                      
                      {/* Arrow indicator for active item */}
                      {isActive && (
                        <ChevronRightIcon className="h-4 w-4 text-blue-200" />
                      )}
                    </>
                  )}
                  
                  {/* Active indicator line */}
                  {isActive && (
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-300 to-blue-400 rounded-l-full shadow-glow" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Footer section with logout button */}
      <div className="border-t border-blue-700/50 bg-blue-900/50 backdrop-blur-sm"> 
        {/* Logout button */}
        <button
          onClick={handleLogout}
          className={`group flex items-center w-full transition-all duration-300 hover:scale-[1.02] ${
            collapsed 
              ? 'justify-center py-4 px-3' 
              : 'px-4 py-3 space-x-3'
          } text-red-300 hover:text-red-200 hover:bg-red-500/20 hover:shadow-md rounded-lg mx-2 my-2`}
        >
          <div className="p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors duration-200">
            <LogoutIcon className="h-5 w-5" />
          </div>
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>

        {/* Admin version */}
        {!collapsed && (
          <div className="px-4 py-3 text-center">
            <div className="text-xs text-blue-400 font-medium">Admin Panel</div>
            <div className="text-xs text-blue-500 opacity-80">Version 1.0.0</div>
          </div>
        )}
      </div>
    </aside>
  );
};