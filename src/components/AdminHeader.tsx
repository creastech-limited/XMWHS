import { useState, useEffect } from 'react';
import { Menu, Bell, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface AdminHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeMenu: string;
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

const AdminHeader = ({ sidebarOpen, setSidebarOpen, activeMenu }: AdminHeaderProps) => {
  const { user } = useAuth() ?? {};
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        // Get token
        const token = user?.token || localStorage.getItem('token');
        
        if (!token) {
          console.log('No token found');
          setLoading(false);
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

        // Extract user data from the specific response structure
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
        } else {
          console.error('Unexpected response structure:', data);
          // Fallback to auth context user if available
          if (user) {
            const fallbackProfile: UserProfile = {
              _id: user._id || '',
              email: user.email || '',
              firstName: user.name?.split(' ')[0] || '',
              lastName: user.name?.split(' ').slice(1).join(' ') || '',
              role: user.role || '',
              name: user.name || ''
            };
            setUserProfile(fallbackProfile);
          } else {
            // If no user from auth context, set a minimal valid profile
            setUserProfile({
              _id: '',
              email: '',
              firstName: '',
              lastName: '',
              role: '',
              name: ''
            });
          }
        }

      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Fallback to auth context user on error
        if (user) {
          const fallbackProfile: UserProfile = {
            _id: user._id || '',
            email: user.email || '',
            firstName: user.name?.split(' ')[0] || '',
            lastName: user.name?.split(' ').slice(1).join(' ') || '',
            role: user.role || '',
            name: user.name || ''
          };
          setUserProfile(fallbackProfile);
        } else {
          // If no user from auth context, set a minimal valid profile
          setUserProfile({
            _id: '',
            email: '',
            firstName: '',
            lastName: '',
            role: '',
            name: ''
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (user?.token || localStorage.getItem('token')) {
      fetchUserProfile();
    } else {
      setLoading(false);
      // Set empty profile if no token exists
      setUserProfile({
        _id: '',
        email: '',
        firstName: '',
        lastName: '',
        role: '',
        name: ''
      });
    }
  }, [user?.token, user]);

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
    if (userProfile) {
      if (userProfile.firstName && userProfile.lastName) {
        return `${userProfile.firstName} ${userProfile.lastName}`;
      } else if (userProfile.name && userProfile.name.trim()) {
        return userProfile.name;
      } else if (userProfile.firstName && userProfile.firstName.trim()) {
        return userProfile.firstName;
      } else if (userProfile.email && userProfile.email.trim()) {
        return userProfile.email.split('@')[0];
      }
    }
    
    // Fallback to auth context user
    if (user?.name) {
      return user.name;
    } else if (user?.email) {
      return user.email.split('@')[0];
    }
    
    return 'Admin';
  };

  const getEmailDisplay = () => {
    if (loading) return 'Loading...';
    if (userProfile?.email && userProfile.email.trim()) return userProfile.email;
    if (user?.email) return user.email;
    return 'No email';
  };

  const getRoleDisplay = () => {
    if (userProfile?.role && userProfile.role.trim()) return userProfile.role;
    if (user?.role) return user.role;
    return '';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 capitalize">
              {activeMenu.replace('-', ' ')}
            </h2>
            <p className="text-sm text-gray-600">Manage your {activeMenu.replace('-', ' ')} settings</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <div className="relative">
            <button className="p-2 rounded-md hover:bg-gray-100 transition-colors">
              <Bell className="w-6 h-6 text-gray-600 hover:text-gray-900 transition-colors" />
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              aria-expanded={dropdownOpen}
              aria-label="User profile menu"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {getInitials(userProfile?.firstName, userProfile?.lastName, userProfile?.email)}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-gray-600">
                  {getEmailDisplay()}
                </p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-gray-600">
                    {getEmailDisplay()}
                  </p>
                  {getRoleDisplay() && (
                    <p className="text-xs text-blue-600 capitalize mt-1">
                      {getRoleDisplay()}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4 mr-3" />
                  Profile Settings
                </button>
                
                <button
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Account Settings
                </button>
                
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
};

export default AdminHeader;