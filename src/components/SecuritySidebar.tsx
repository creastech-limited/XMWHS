import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, X } from 'lucide-react';

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  route: string;
}

const topMenuItems: MenuItem[] = [
  { text: 'Dashboard', icon: <LayoutDashboard size={20} />, route: '/security' },
  { text: 'Settings', icon: <Settings size={20} />, route: '/security/settings' },
];

const SecuritySidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState<string>(() => {
    const currentPath = window.location.pathname;
    const activeMenuItem = topMenuItems.find((item) => item.route === currentPath);
    return activeMenuItem ? activeMenuItem.text : topMenuItems[0].text;
  });
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  useEffect(() => {
    const activeMenuItem = topMenuItems.find((item) => item.route === location.pathname);
    setActiveItem(activeMenuItem ? activeMenuItem.text : topMenuItems[0].text);
  }, [location.pathname]);

  const handleDrawerToggle = (): void => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuItemClick = (item: MenuItem): void => {
    setActiveItem(item.text);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
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
          ${isActive ? 'text-white bg-blue-600 hover:bg-blue-700' : 'text-white bg-transparent'}
        `}
      >
        <div className="flex items-center">
          <div className="text-white min-w-[40px] mr-3">
            {item.icon}
          </div>
          <span className={`${isActive ? 'font-semibold' : 'font-normal'} text-[0.95rem]`}>
            {item.text}
          </span>
        </div>
        {isActive && (
          <div className="absolute right-0 top-0 h-full w-1 rounded-l bg-white"></div>
        )}
      </div>
    </Link>
  );

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-gradient-to-b from-blue-900 via-slate-950 to-blue-950 text-white shadow-xl">
      <div>
        <div className="mb-6 flex flex-col items-center border-b border-white/10 py-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 to-blue-500 shadow-lg">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <span className="text-xl font-bold tracking-wide opacity-95">Security Portal</span>
          </div>
        </div>

        <nav className="px-2">
          {topMenuItems.map((item) => renderMenuItem(item, activeItem === item.text))}
        </nav>
      </div>

      <div className="px-2 pb-6">
        <div className="my-4 h-px bg-white/10"></div>
        <button
          type="button"
          onClick={handleLogout}
          className="mx-4 my-2 flex w-[calc(100%-2rem)] items-center rounded-xl p-3 text-white transition-all duration-300 ease-in-out hover:translate-x-1 hover:bg-red-500/20"
        >
          <div className="min-w-[40px] mr-3 text-white">
            <LogOut size={20} />
          </div>
          <span className="text-[0.95rem]">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={handleDrawerToggle}
        className="fixed left-4 top-4 z-50 rounded-lg bg-blue-900 p-2 text-white transition-colors hover:bg-blue-800 lg:hidden"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className="hidden w-[280px] flex-shrink-0 lg:block">
        <div className="fixed left-0 top-0 h-full w-[280px] border-r-0">
          {sidebarContent}
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={handleDrawerToggle}
          ></div>
          <div className="fixed left-0 top-0 h-full w-56 transform transition-transform duration-300 ease-in-out sm:w-[220px]">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default SecuritySidebar;
