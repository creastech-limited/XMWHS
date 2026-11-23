import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  History,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  House,
  AlertTriangle,
  ChevronDown,
  Download,
  CircleDollarSign,
  ChartColumn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConfirmLogoutModal } from '../components/shared/ConfirmLogoutModal';

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  route: string;
  badge?: number;
  badgeTone?: 'neutral' | 'danger';
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    label: 'Overview',
    items: [
      { text: 'Dashboard', icon: <LayoutDashboard size={18} />, route: '/store' },
      { text: 'Agents', icon: <Users size={18} />, route: '/agents', badgeTone: 'neutral' },
      { text: 'DID Number', icon: <Users size={18} />, route: '/add-did-number', badgeTone: 'neutral' },
      { text: 'CDR Import', icon: <Download size={18} />, route: '/store/cdr-import', badgeTone: 'neutral' },
      { text: 'Reports', icon: <ChartColumn size={18} />, route: '/store/reports', badgeTone: 'neutral' },
      { text: 'Invoices', icon: <CircleDollarSign size={18} />, route: '/store/invoices', badgeTone: 'neutral' },
      { text: 'Transactions', icon: <History size={18} />, route: '/stransactions' },
      { text: 'Withdrawals', icon: <CreditCard size={18} />, route: '/Swithdrawal' }
    ]
  },
  {
    label: 'Support',
    items: [
      { text: 'Disputes', icon: <AlertTriangle size={18} />, route: '/Storedispute', badgeTone: 'danger' },
      { text: 'Settings', icon: <Settings size={18} />, route: '/store/settings' }
    ]
  }
];

const capitalizeWords = (value: string): string =>
  value
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

const StoreUserMenu: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const logout = auth?.logout;

  const user = auth?.user as
    | { firstName?: string; lastName?: string; name?: string; email?: string }
    | null
    | undefined;

  const storeName: string = user?.firstName && user?.lastName
    ? capitalizeWords(`${user.firstName} ${user.lastName}`)
    : user?.name
      ? capitalizeWords(user.name)
      : user?.firstName
        ? capitalizeWords(user.firstName)
        : user?.email || 'Store Portal';

  // Initials from the store name, e.g. "Tee Store" -> "TS"
  const initials: string = storeName
    .split(' ')
    .filter(Boolean)
    .map((word: string) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const [open, setOpen] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Step 1: the Logout item only asks for confirmation
  const handleLogoutClick = (): void => {
    setOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = (): void => {
    setShowLogoutConfirm(false);
    if (logout) logout();
    navigate('/login');
  };

  return (
    <div ref={ref} className="relative p-4">
      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-full left-4 right-4 mb-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          <button
            type="button"
            onClick={handleLogoutClick}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl bg-slate-100/80 p-3 text-left transition-colors hover:bg-slate-100"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#0f1535] text-sm font-bold text-white">
          {initials}
        </div>
        <span className="flex-1 truncate text-sm font-semibold text-[#0f1535]">
          {storeName}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {createPortal(
        <ConfirmLogoutModal
          open={showLogoutConfirm}
          onConfirm={handleConfirmLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />,
        document.body
      )}
    </div>
  );
};

const StoreSidebar: React.FC = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const handleDrawerToggle = (): void => {
    setMobileOpen(!mobileOpen);
  };

  const renderMenuItem = (item: MenuItem) => {
    const isActive = location.pathname === item.route;

    return (
      <Link
        key={item.text}
        to={item.route}
        onClick={() => mobileOpen && setMobileOpen(false)}
        className={`
          mx-3 my-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 no-underline
          transition-colors duration-200
          ${isActive
            ? 'bg-[#0B1437] text-white'
            : 'text-[#2A3352] hover:bg-slate-100'}
        `}
      >
        <span className={isActive ? 'text-white' : 'text-slate-600'}>{item.icon}</span>
        <span className={`flex-1 text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>
          {item.text}
        </span>
        {item.badge !== undefined && (
          <span
            className={`
              flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 text-xs font-semibold
              ${item.badgeTone === 'danger'
                ? 'bg-red-100 text-red-600'
                : 'bg-slate-100 text-slate-500'}
            `}
          >
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between border-r border-slate-200 bg-white shadow-xl">
      <div>
        {/* Logo & Title (unchanged) */}
        <div className="flex flex-col items-start px-6 py-8 mb-6 border-b border-[#F2F4F9] text-black">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#0B1437] rounded-2xl flex items-center justify-center shadow-lg">
              <House className="h-7 w-7 text-white" />
            </div>
            <span className="text-xl font-bold tracking-wide opacity-95">Store Portal</span>
          </div>
        </div>

        {/* Menu sections */}
        <nav>
          {menuSections.map((section) => (
            <div key={section.label} className="mb-5">
              <p className="px-6 pb-2 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                {section.label}
              </p>
              {section.items.map(renderMenuItem)}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom card */}
      <StoreUserMenu />
    </div>
  );

  return (
    <>
      {/* Mobile & Tablet Menu Button */}
      <button
        onClick={handleDrawerToggle}
        className="
          fixed top-4 left-4 z-50
          bg-indigo-900 text-white p-2 rounded-lg
          hover:bg-indigo-900 transition-colors
          lg:hidden
        "
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-[280px] flex-shrink-0">
        <div className="fixed top-0 left-0 w-[240px] h-full">
          {sidebarContent}
        </div>
      </div>

      {/* Mobile & Tablet Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={handleDrawerToggle}
          ></div>

          <div className="fixed top-0 left-0 w-64 h-full transform transition-transform duration-300 ease-in-out">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default StoreSidebar;