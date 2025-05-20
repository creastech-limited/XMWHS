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
} from '@heroicons/react/24/outline';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: number | null;
}

// Removed duplicate Sidebar declaration
export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  
  // Define menu items with your provided list
  const menuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/schools', icon: <DashboardIcon className="h-5 w-5" /> },
    { name: 'Students', path: '/students', icon: <PeopleIcon className="h-5 w-5" /> },
    { name: 'Stores', path: '/stores', icon: <StorefrontIcon className="h-5 w-5" /> },
    { name: 'School Fees', path: '/schoolfees', icon: <PaymentIcon className="h-5 w-5" /> },
    { name: 'Transactions', path: '/transactions', icon: <ReceiptLongIcon className="h-5 w-5" /> },
    { name: 'Withdrawal', path: '/withdrawal', icon: <AccountBalanceWalletIcon className="h-5 w-5" /> },
    { name: 'Disputes', path: '/disputes', icon: <WarningIcon className="h-5 w-5" /> },
    { name: 'Settings', path: '/settings', icon: <SettingsIcon className="h-5 w-5" /> },
  ];
  
  // Now you can safely use menuItems in any function
  const handleLogout = () => {
    // Handle logout logic here
    localStorage.removeItem('token');
    // Remove any other stored user data if needed
    navigate('/login');
  };

  return (
    <aside className={`bg-gray-800 text-white transition-all duration-300 flex flex-col h-screen ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo section */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {!collapsed && (
          <div className="font-bold text-xl tracking-tight">Admin Panel</div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`text-gray-400 hover:text-white focus:outline-none ${collapsed ? 'mx-auto' : ''}`}
        >
          {collapsed ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Current route indicator */}
      {!collapsed && (
        <div className="px-4 py-3 text-sm text-gray-400">
          <span>Current:</span> <span className="font-medium text-white">
            {location.pathname === '/' ? 'Dashboard' : 
              menuItems.find(item => location.pathname.startsWith(item.path))?.name || 'Dashboard'}
          </span>
        </div>
      )}
      
      {/* Nav menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
              
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                  } ${collapsed ? 'justify-center' : 'space-x-3'}`}
                >
                  <div className={isActive ? 'text-white' : 'text-gray-400'}>{item.icon}</div>
                  
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500 text-xs font-medium">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  
                  {/* Show badge in collapsed mode as a dot */}
                  {collapsed && item.badge && (
                    <div className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-500"></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Footer section with logout button */}
      <div className="border-t border-gray-700"> 
        {/* Logout button */}
        <button
          onClick={() => {
            handleLogout();
          }}
          className={`flex items-center text-red-400 hover:text-red-300 hover:bg-gray-700 w-full ${
            collapsed ? 'justify-center py-4 px-4' : 'px-4 py-3 space-x-3'
          }`}
        >
          <LogoutIcon className="h-5 w-5" />
          {!collapsed && <span>Logout</span>}
        </button>

         {/* Admin version */}
        {!collapsed && (
          <div className="px-4 py-2 text-sm text-gray-400">
            <div>Admin v1.0</div>
          </div>
        )}
      </div>
    </aside>
  );
};