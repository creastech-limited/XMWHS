import React, { useEffect, useState } from 'react';
import {
  Bell,
  User,
  LogOut,
  Store,
  Settings,
  ChevronDown,
  Search,
  Menu,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// TypeScript interfaces
interface StoreUser {
  name: string;
  notifications: number;
  avatar: string | null;
  status: 'Online' | 'Away' | 'Offline';
  lastLogin?: string;
  email?: string;
}

interface StoreHeaderProps {
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
}

const StoreHeader: React.FC<StoreHeaderProps> = ({ 
  onMenuToggle, 
  isSidebarOpen = false 
}) => {
  const navigate = useNavigate();
  const [storeUser, setStoreUser] = useState<StoreUser>({
    name: 'Store ABC',
    notifications: 3,
    avatar: null,
    status: 'Online',
    email: 'store@example.com'
  });
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const API_URL = process.env.REACT_APP_API_URL || 'https://nodes-staging.up.railway.app';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setStoreUser(prev => ({
          ...prev,
          name: parsed.name || parsed.storeName || 'Store ABC',
          avatar: parsed.avatar || null,
          email: parsed.email || 'store@example.com'
        }));
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    } else {
      fetchUser();
    }
  }, []);

  const fetchUser = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/api/users/getuserone`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.user) {
        const user = response.data.user;
        localStorage.setItem('user', JSON.stringify(user));
        setStoreUser(prev => ({
          ...prev,
          name: user.name || user.storeName || 'Store ABC',
          avatar: user.avatar || null,
          email: user.email || 'store@example.com'
        }));
      }
    } catch (error) {
      console.error('Failed to fetch store user:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (token) {
        await axios.get(`${API_URL}/api/users/logout`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.warn('Logout request failed or already expired.', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoading(false);
      navigate('/login');
    }
  };

  const getStatusColor = (status: StoreUser['status']): string => {
    switch (status) {
      case 'Online':
        return 'bg-green-500';
      case 'Away':
        return 'bg-yellow-500';
      case 'Offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusTextColor = (status: StoreUser['status']): string => {
    switch (status) {
      case 'Online':
        return 'text-green-700';
      case 'Away':
        return 'text-yellow-700';
      case 'Offline':
        return 'text-gray-700';
      default:
        return 'text-gray-700';
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 right-0 left-0 md:left-64 z-40 bg-white shadow-sm border-b border-gray-200 transition-all duration-300">
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
          {/* Left Section - Mobile Menu & Search */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* Search Bar - Hidden on mobile */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Center Section - Store Info */}
          <div className="flex items-center space-x-3">
            {/* Store Avatar */}
            <div className="relative">
              {storeUser.avatar ? (
                <img
                  src={storeUser.avatar}
                  alt={storeUser.name}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white shadow-md object-cover"
                />
              ) : (
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                  <span className="text-white font-semibold text-sm md:text-base">
                    {getInitials(storeUser.name)}
                  </span>
                </div>
              )}
              {/* Status Indicator */}
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 ${getStatusColor(storeUser.status)} rounded-full border-2 border-white`}></div>
            </div>

            {/* Store Details - Hidden on mobile */}
            <div className="hidden md:block">
              <h2 className="font-semibold text-gray-900 text-lg truncate max-w-48">
                {storeUser.name}
              </h2>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-medium ${getStatusTextColor(storeUser.status)}`}>
                  {storeUser.status}
                </span>
                {storeUser.lastLogin && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500">
                      Last: {storeUser.lastLogin}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {storeUser.notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {storeUser.notifications > 9 ? '9+' : storeUser.notifications}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="w-5 h-5" />
                <ChevronDown className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsProfileOpen(false)}
                  ></div>
                  
                  {/* Dropdown Content */}
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        {storeUser.avatar ? (
                          <img
                            src={storeUser.avatar}
                            alt={storeUser.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {getInitials(storeUser.name)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 truncate">{storeUser.name}</p>
                          <p className="text-sm text-gray-500 truncate">{storeUser.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <User className="w-4 h-4 mr-3" />
                        Profile Settings
                      </button>
                      <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Store className="w-4 h-4 mr-3" />
                        Store Management
                      </button>
                      <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={handleLogout}
                        disabled={isLoading}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        {isLoading ? 'Logging out...' : 'Logout'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Logout Button - Mobile */}
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="md:hidden p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-16 md:h-20"></div>
    </>
  );
};

export default StoreHeader;