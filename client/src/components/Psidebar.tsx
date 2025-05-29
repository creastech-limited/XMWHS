import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  RectangleGroupIcon,
  UserIcon, 
  WalletIcon, 
  CreditCardIcon, 
  ClockIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  route: string;
}

const Psidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [collapsed ] = useState<boolean>(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Top menu items with routes
  const topMenuItems: MenuItem[] = [
    { text: 'Overview', icon: <RectangleGroupIcon className="h-5 w-5" />, route: '/parent' },
    { text: 'Fund Wallet', icon: <WalletIcon className="h-5 w-5" />, route: '/fundwallet' },
    { text: 'School Fees', icon: <CreditCardIcon className="h-5 w-5" />, route: '/payschoolbills' },
    { text: 'Payment History', icon: <ClockIcon className="h-5 w-5" />, route: '/ptransactionhistory' },
  ];

  // Bottom menu items
  const bottomMenuItems: MenuItem[] = [
    { text: 'Settings', icon: <Cog6ToothIcon className="h-5 w-5" />, route: '/Psettings' },
    { text: 'Logout', icon: <ArrowRightOnRectangleIcon className="h-5 w-5" />, route: '/login' },
  ];

  // Menu item component with active state styling
  const MenuItem = ({ item }: { item: MenuItem }) => {
    const isActive = location.pathname.startsWith(item.route);
    
    return (
      <Link
        to={item.route}
        className="block text-decoration-none"
        onClick={() => {
          if (item.text === 'Logout') {
            handleLogout();
          }
          if (mobileOpen) {
            setMobileOpen(false);
          }
        }}
      >
        <div className={`
          flex items-center px-4 py-3 my-1 mx-2 rounded-lg
          transition-all duration-200 ease-in-out
          ${isActive 
            ? 'bg-white/10 text-white font-medium shadow-md' 
            : 'text-white/80 hover:bg-white/5 hover:text-white'
          }
          ${collapsed ? 'justify-center' : ''}
        `}>
          <span className="flex items-center justify-center">
            {item.icon}
          </span>
          {!collapsed && (
            <span className="ml-3 text-sm">
              {item.text}
            </span>
          )}
          {isActive && !collapsed && (
            <span className="absolute right-0 top-0 h-full w-1 bg-white rounded-l-lg" />
          )}
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile menu button */}
      <button 
        onClick={handleDrawerToggle}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-indigo-700 text-white shadow-lg hover:bg-indigo-600 transition-colors"
      >
        {mobileOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>
      
      {/* Overlay for mobile */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" 
          onClick={handleDrawerToggle}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`
          fixed top-0 left-0 h-full bg-gradient-to-b from-indigo-800 to-indigo-900 text-white z-30
          transition-all duration-300 ease-in-out shadow-xl
          ${windowWidth < 768 ? (mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64') : 
            collapsed ? 'w-20' : 'w-64'}
        `}
      >
        <div className="flex flex-col h-full justify-between py-4">
          {/* Top section */}
          <div>
            {/* Logo/Title */}
           <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <UserIcon className="mt-15 h-8 w-8 text-white" />
            <div className="mt-15 font-bold text-xl tracking-tight">Parent Portal</div>
          </div>
        )}
        {/* <button
          onClick={() => setCollapsed(!collapsed)}
          className={`mt-10 text-gray-400 hover:text-white focus:outline-none ${collapsed ? 'mx-auto' : ''}`}
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
        </button> */}
      </div>
            
            {/* Current route indicator */}
            {!collapsed && (
              <div className="px-4 py-3 text-sm text-gray-400">
                <span>Current:</span> <span className="font-medium text-white">
                  {location.pathname === '/' ? 'Overview' : 
                    topMenuItems.find(item => location.pathname.startsWith(item.route))?.text || 'Overview'}
                </span>
              </div>
            )}
            
            {/* Top menu items */}
            <nav className="px-1">
              {topMenuItems.map((item) => (
                <MenuItem key={item.text} item={item} />
              ))}
            </nav>
          </div>
          
          {/* Bottom section */}
          <div className="mb-2">
            <div className="h-px bg-white/20 my-2 mx-3" />
            <nav className="px-1">
              {bottomMenuItems.map((item) => (
                <MenuItem key={item.text} item={item} />
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Psidebar;