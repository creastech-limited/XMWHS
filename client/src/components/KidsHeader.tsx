import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Wallet, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';

interface Profile {
  name?: string;
  fullName?: string;
  profilePic?: string;
  qrCodeId?: string;
  _id?: string;
}

interface Wallet {
  balance: number;
}

interface KidsHeaderProps {
  profile: Profile | null;
  wallet: Wallet | null;
}

const KidsHeader = ({ profile, wallet }: KidsHeaderProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth() || {};
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(window.matchMedia("(max-width: 768px)").matches);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  // Handle screen size changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handleResize = (e: MediaQueryListEvent): void => setIsMobile(e.matches);
    
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        event.target &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const username = profile ? profile.name || profile.fullName : "Kid User";
  const walletBalance = wallet ? wallet.balance : 0;
  const avatar = profile && profile.profilePic ? profile.profilePic : '/default-avatar.png';

  return (
    <div className="rounded-xl overflow-hidden mb-6 shadow-xl border border-gray-100">
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white">
        {/* Main Header Content */}
        <div className="p-5 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-5">
            {/* Profile Section */}
            <div className="flex items-center gap-5 w-full md:w-auto">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg overflow-hidden border-4 border-white">
                  <img 
                    src={avatar} 
                    alt={username}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-avatar.png';
                    }}
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{username}</h1>
                <p className="text-blue-100 font-medium flex items-center gap-2 mt-1">
                  <User className="w-4 h-4" />
                  <span>Kids Wallet Dashboard</span>
                </p>
              </div>
            </div>
            
            {/* Controls Section */}
            <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-end">
              {/* Wallet Balance */}
              <div className="text-right">
                <p className="text-blue-100 text-sm font-medium">Wallet Balance</p>
                <p className="text-2xl md:text-3xl font-bold text-white">
                  ₦{walletBalance.toLocaleString()}
                </p>
              </div>
              
              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-full hover:bg-white hover:bg-opacity-10 transition duration-200"
                  aria-label="Notifications"
                >
                  <Bell className="w-6 h-6 text-white" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-blue-800 flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-800 to-blue-600 text-white font-semibold flex items-center justify-between">
                      <span>Notifications</span>
                      <span className="bg-white text-blue-600 text-xs rounded-full px-2 py-0.5">2 new</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      <div className="px-4 py-3 hover:bg-gray-50 transition">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                            <Wallet className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">Allowance Received</p>
                            <p className="text-xs text-gray-500 mt-1">You received ₦5,000 from Mom</p>
                            <p className="text-xs text-gray-400 mt-2">Just now</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3 hover:bg-gray-50 transition">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                            <Bell className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">Savings Goal Reached</p>
                            <p className="text-xs text-gray-500 mt-1">You've reached 50% of your savings goal!</p>
                            <p className="text-xs text-gray-400 mt-2">2 hours ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 bg-gray-50 text-center">
                      <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 transition duration-200 rounded-lg flex items-center gap-2 font-medium text-white"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
                <span className={isMobile ? "hidden" : "block"}>Logout</span>
              </button>
            </div>
          </div>
        </div>
        

      </div>
    </div>
  );
};

export default KidsHeader;