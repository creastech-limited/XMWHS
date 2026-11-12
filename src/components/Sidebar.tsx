import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  HomeIcon as DashboardIcon,
  UsersIcon as PeopleIcon,
  ShoppingBagIcon as StorefrontIcon,
  CurrencyDollarIcon as PaymentIcon,
  ArrowsRightLeftIcon as TransferIcon,
  ReceiptRefundIcon as ReceiptLongIcon,
  WalletIcon as AccountBalanceWalletIcon,
  ExclamationTriangleIcon as WarningIcon,
  Cog6ToothIcon as SettingsIcon,
  ArrowLeftOnRectangleIcon as LogoutIcon,
  Bars3Icon as MenuIcon,
  XMarkIcon as CloseIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { ConfirmLogoutModal } from './shared/ConfirmLogoutModal';
import { useAuth } from '../context/AuthContext';

interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number | null;
  badgeTone?: 'neutral' | 'danger';
  tag?: string; // e.g. "PRO"
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const [collapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { logout } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  const menuSections: MenuSection[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', path: '/schools', icon: <DashboardIcon className="h-5 w-5" /> },
        { label: 'Students', path: '/students', icon: <PeopleIcon className="h-5 w-5" /> },
        { label: 'Stores', path: '/stores', icon: <StorefrontIcon className="h-5 w-5" /> },
        { label: 'School Fees', path: '/schoolfees', icon: <PaymentIcon className="h-5 w-5" /> },
        { label: 'Transactions', path: '/transactions', icon: <ReceiptLongIcon className="h-5 w-5" /> },
        { label: 'Withdrawal', path: '/withdrawal', icon: <AccountBalanceWalletIcon className="h-5 w-5" /> },
        { label: 'Transfer', path: '/schooltransfer', icon: <TransferIcon className="h-5 w-5" />, tag: 'PRO' },
        { label: 'Security', path: '/attendance/security', icon: <ShieldCheckIcon className="h-5 w-5" /> },
        { label: 'Attendance', path: '/attendance/report', icon: <ClipboardDocumentListIcon className="h-5 w-5" /> },
      ],
    },
    {
      title: 'Support',
      items: [
        { label: 'Disputes', path: '/Sdisputes', icon: <WarningIcon className="h-5 w-5" />, badgeTone: 'danger' },
        { label: 'Settings', path: '/settings', icon: <SettingsIcon className="h-5 w-5" /> },
      ],
    },
  ];

  const handleLogout = () => logout();

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const handleMenuItemClick = () => {
    if (isMobile) setMobileMenuOpen(false);
  };

  const isItemActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <>
      {/* Mobile menu button - only visible on mobile  */}
      <button
        onClick={toggleMobileMenu}
        className="mt-[-8px] md:hidden fixed top-4 left-4 p-2 rounded-md bg-indigo-700 text-white shadow-lg hover:bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Toggle menu"
        style={{ zIndex: 100 }}
      >
        {mobileMenuOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
      </button>
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-0" onClick={toggleMobileMenu} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          bg-white text-slate-900 transition-all duration-300 flex flex-col h-screen shadow-2xl border-r border-slate-200
          ${isMobile
            ? (mobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64')
            : (collapsed ? 'w-20' : 'w-64')}
        `}
        aria-label="Sidebar"
      >
        {/* Logo section (unchanged) */}
        <div className="mt-[-70px] p-4 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 border-b border-blue-700/50 flex items-center justify-between relative">
          {!collapsed && (
            <div className={`flex items-center space-x-3 ${window.innerWidth < 768 ? 'mt-[50px]' : 'mt-[0px]'}`}>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <DashboardIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">
                  School Panel
                </div>
                <div className="text-xs text-blue-300 opacity-80">Management System</div>
              </div>
            </div>
          )}
        </div>

        {/* Nav menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {menuSections.map((section) => (
            <div key={section.title} className="mb-6">
              {!collapsed && (
                <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
              )}

              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = isItemActive(item.path);

                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={handleMenuItemClick}
                        className={`group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${isActive
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-900 hover:bg-slate-100'
                          } ${collapsed ? 'justify-center' : 'gap-3'}`}
                      >
                        <span className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-700'}`}>
                          {item.icon}
                        </span>

                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>

                            {item.tag && (
                              <span className="rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                {item.tag}
                              </span>
                            )}

                            {item.badge ? (
                              <span
                                className={`min-w-[22px] rounded-full px-2 py-0.5 text-center text-[11px] font-semibold ${item.badgeTone === 'danger'
                                    ? 'bg-red-100 text-red-600'
                                    : isActive
                                      ? 'bg-white/20 text-white'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                              >
                                {item.badge}
                              </span>
                            ) : null}
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer with logout */}
        <div className="border-t border-slate-200 bg-white p-3">
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`group flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 transition-colors duration-200 hover:bg-red-50 hover:text-red-600 ${collapsed ? 'justify-center' : 'gap-3'
              }`}
          >
            <LogoutIcon className="h-5 w-5 shrink-0 text-slate-700 group-hover:text-red-600" />
            {!collapsed && <span className="whitespace-nowrap">Logout</span>}
          </button>

          {!collapsed && (
            <div className="px-3 pt-2 text-center">
              <div className="text-xs font-medium text-slate-500">School Panel</div>
              <div className="text-xs text-slate-400">Version 1.0.0</div>
            </div>
          )}
        </div>
      </aside>

      <ConfirmLogoutModal
        open={showLogoutModal}
        onConfirm={() => {
          setShowLogoutModal(false);
          handleLogout();
        }}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
};
export default Sidebar;