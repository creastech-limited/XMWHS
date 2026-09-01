import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  Users,
  LogOut,
  ChevronDown,
  ChevronRight,
  Settings,
  AlertCircle,
  UserCog,
  User,
  IdCard,
  ArrowLeftRight,
  Home,
  X
} from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUserDetails } from '../services';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path?: string;
  hasSubMenu?: boolean;
  subItems?: MenuItem[];
}

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
}

interface UserProfile {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  role: string;
}


const getStoredSubMenus = (): Record<string, boolean> => {
  try {
    const saved = sessionStorage.getItem('admin_open_submenus');
    if (saved) return JSON.parse(saved);
  } catch (error) {
    console.debug('Failed to read submenus from session storage', error);
  }
  return { wallet: true, management: true };
};

const saveStoredSubMenus = (menus: Record<string, boolean>) => {
  try {
    sessionStorage.setItem('admin_open_submenus', JSON.stringify(menus));
  } catch (error) {
    console.debug('Failed to save submenus to session storage', error);
  }
};

const AdminSidebar = ({ sidebarOpen, setSidebarOpen, activeMenu, setActiveMenu }: AdminSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>(() => getStoredSubMenus());

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getUserDetails();
        const data = response.data;
        if (data) {
          setUserProfile({
            _id: data._id || '',
            email: data.email || '',
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            name: data.name,
            role: data.role || 'Admin'
          });
        }
      } catch (error) {
        console.error('Error fetching admin profile:', error);
      }
    };

    fetchProfile();
  }, []);

  const toggleSubMenu = (menuId: string) => {
    setOpenSubMenus(prev => {
      const updated = {
        ...prev,
        [menuId]: !prev[menuId]
      };
      saveStoredSubMenus(updated);
      return updated;
    });
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.hasSubMenu || item.subItems) {
      toggleSubMenu(item.id);
    } else if (item.path) {
      setActiveMenu(item.id);
      navigate(item.path);
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.clear();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}`.toUpperCase();
    }
    if (userProfile?.name) {
      const names = userProfile.name.split(' ');
      return names.length > 1
        ? `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase()
        : names[0].charAt(0).toUpperCase();
    }
    if (userProfile?.email) {
      return userProfile.email.charAt(0).toUpperCase();
    }
    return 'AD';
  };

  const getUserDisplayName = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    if (userProfile?.name) {
      return userProfile.name;
    }
    if (userProfile?.email) {
      return userProfile.email.split('@')[0];
    }
    return 'Admin';
  };

  const menuItems: MenuItem[] = useMemo(() => [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      path: '/admin'
    },
    {
      id: 'wallet',
      label: 'Wallet Management',
      icon: Wallet,
      hasSubMenu: true,
      subItems: [
        { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight, path: '/admin/transactions' },
        { id: 'charges', label: 'Charges', icon: CreditCard, path: '/admin/get-charges' },
        { id: 'user-wallet', label: 'Wallets', icon: Users, path: '/admin/user-wallets' },
      ]
    },
    {
      id: 'management',
      label: 'User Management',
      icon: UserCog,
      hasSubMenu: true,
      subItems: [
        { id: 'all-users', label: 'All Users', icon: Users, path: '/admin/users' },
        { id: 'schools', label: 'Schools', icon: Users, path: '/admin/schools' },
        { id: 'parents', label: 'Parents', icon: User, path: '/admin/parents' }
      ]
    },
    {
      id: 'id-cards',
      label: 'ID Cards',
      icon: IdCard,
      path: '/admin/id-cards'
    },
    {
      id: 'disputes',
      label: 'Disputes',
      icon: AlertCircle,
      path: '/admin/disputes'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/admin/settings'
    }
  ], []);

  const itemHasActiveDescendant = useCallback((item: MenuItem): boolean => {
    return item.subItems?.some((subItem) => {
      if (subItem.path && location.pathname === subItem.path) return true;
      if (subItem.id === activeMenu) return true;
      return itemHasActiveDescendant(subItem);
    }) ?? false;
  }, [activeMenu, location.pathname]);

  useEffect(() => {
    const matchedParentIds: string[] = [];

    menuItems.forEach((parent) => {
      if (parent.subItems?.length) {
        const hasMatch = parent.subItems.some(
          sub => (sub.path && location.pathname === sub.path) || sub.id === activeMenu || (sub.path && location.pathname.startsWith(sub.path))
        );
        if (hasMatch) {
          matchedParentIds.push(parent.id);
        }
      }
    });

    if (matchedParentIds.length) {
      setOpenSubMenus((prev) => {
        const next = { ...prev };
        matchedParentIds.forEach((id) => {
          next[id] = true;
        });
        saveStoredSubMenus(next);
        return next;
      });
    }
  }, [location.pathname, activeMenu, menuItems]);

  const MenuItemComponent = ({ item, depth = 0 }: { item: MenuItem; depth?: number }) => {
    const Icon = item.icon;
    const isActive = (item.path ? location.pathname === item.path : false) || activeMenu === item.id;
    const isParentOfActive = itemHasActiveDescendant(item);
    const hasSubMenu = item.hasSubMenu || Boolean(item.subItems?.length);
    const isSubMenuOpen = Boolean(openSubMenus[item.id]);
    const isNestedItem = depth > 0;

    return (
      <div className={isNestedItem ? 'ml-4' : ''}>
        <div
          onClick={() => handleMenuClick(item)}
          className={`
            flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-200
            ${isActive
              ? 'bg-blue-600 text-white shadow-lg'
              : isParentOfActive
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }
            ${isNestedItem ? 'py-2 text-sm' : ''}
          `}
        >
          <div className="flex items-center space-x-3">
            <Icon size={isNestedItem ? 16 : 20} />
            <span className="font-medium">{item.label}</span>
          </div>
          {hasSubMenu && (
            <div className="transition-transform duration-200">
              {isSubMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          )}
        </div>

        {hasSubMenu && isSubMenuOpen && (
          <div className="mt-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {item.subItems?.map((subItem) => (
              <MenuItemComponent key={subItem.id} item={subItem} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative lg:translate-x-0 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64 h-full bg-gray-800 shadow-2xl z-50 flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Home className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Admin Panel</h2>
              <p className="text-xs text-gray-400">Dashboard Control</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => (
            <MenuItemComponent key={item.id} item={item} />
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {getUserInitials()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {getUserDisplayName()}
              </p>
              <p className="text-gray-400 text-xs truncate">
                {userProfile?.email || 'Loading...'}
              </p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-all duration-200">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
