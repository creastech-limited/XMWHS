import { 
  LayoutDashboard, 
  Wallet, 
  CreditCard, 
  Vault, 
  Users, 
  Shield,  
  LogOut,
  ChevronDown,
  ChevronRight,
  Home,
  X,
  Settings,
  AlertCircle,
  UserCog
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  role?: string;
  phone?: string;
  accountNumber?: string;
  name?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AdminSidebar = ({ sidebarOpen, setSidebarOpen, activeMenu, setActiveMenu }: AdminSidebarProps) => {
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  const toggleSubMenu = (menuId: string) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/users/getuserone`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Extract user data from the API response
        if (data.user && data.user.data) {
          const userData = data.user.data;
          const profile: UserProfile = {
            _id: userData._id || '',
            email: userData.email || '',
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            role: userData.role || '',
            phone: userData.phone || '',
            accountNumber: userData.accountNumber || '',
            name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
          };
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    } else if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'AD';
  };

  const getDisplayName = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    } else if (userProfile?.name) {
      return userProfile.name;
    } else if (userProfile?.firstName) {
      return userProfile.firstName;
    } else if (userProfile?.email) {
      return userProfile.email.split('@')[0];
    }
    return 'Admin';
  };

  const menuItems: MenuItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      path: '/admin'
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: Wallet,
      hasSubMenu: true,
      subItems: [
        { id: 'charge-wallet', label: 'Charge Wallet', icon: CreditCard, path: '/admin/wallet/charge' },
        { id: 'user-wallet', label: 'User Wallet', icon: Users, path: '/admin/wallet/user' },
        { id: 'system-wallet', label: 'System Wallet', icon: Vault, path: '/admin/wallet/system' }
      ]
    },
    {
      id: 'management',
      label: 'Management',
      icon: Users,
      hasSubMenu: true,
      subItems: [
        { id: 'all-users', label: 'All Users', icon: Users, path: '/admin/management/all-users' },
        { id: 'staffs', label: 'Staffs', icon: UserCog, path: '/admin/management/staffs' },
        { id: 'role-permission', label: 'Role & Permission', icon: Shield, path: '/admin/management/roles' }
      ]
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
  ];

  const MenuItemComponent = ({ item, isSubItem = false }: { item: MenuItem; isSubItem?: boolean }) => {
    const Icon = item.icon;
    const isActive = activeMenu === item.id;
    const hasSubMenu = item.hasSubMenu && !isSubItem;
    const isSubMenuOpen = openSubMenus[item.id];

    return (
      <div className={`${isSubItem ? 'ml-4' : ''}`}>
        <div
          onClick={() => {
            if (hasSubMenu) {
              toggleSubMenu(item.id);
            } else if (item.path) {
              setActiveMenu(item.id);
              navigate(item.path);
              setSidebarOpen(false);
            }
          }}
          className={`
            flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-200
            ${isActive 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }
            ${isSubItem ? 'py-2 text-sm' : ''}
          `}
        >
          <div className="flex items-center space-x-3">
            <Icon size={isSubItem ? 16 : 20} />
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
              <MenuItemComponent key={subItem.id} item={subItem} isSubItem={true} />
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
                {getInitials(userProfile?.firstName, userProfile?.lastName, userProfile?.email)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {getDisplayName()}
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