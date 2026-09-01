// src/components/store/StoreNotifications.tsx
import React from 'react';
import { Bell, UserPlus, Activity, RefreshCw } from 'lucide-react';
import type { Notification } from '../../types';

interface StoreNotificationsProps {
  notifications: Notification[];
  onRefresh: () => void;
  onMarkAsRead: (id: string) => void;
}

const StoreNotifications: React.FC<StoreNotificationsProps> = ({
  notifications,
  onRefresh,
  onMarkAsRead,
}) => {
  const formatNotificationTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <Bell className="w-5 h-5 text-orange-600" />;
      case 'success':
        return <UserPlus className="w-5 h-5 text-green-600" />;
      default:
        return <Activity className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-orange-50 hover:bg-orange-100';
      case 'success':
        return 'bg-green-50 hover:bg-green-100';
      default:
        return 'bg-blue-50 hover:bg-blue-100';
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {unreadCount} New
            </span>
            <button
              onClick={onRefresh}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh Notifications"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${getNotificationBg(notification.type)} ${!notification.read ? 'border-l-4 border-blue-500' : ''}`}
              onClick={() => !notification.read && onMarkAsRead(notification._id)}
            >
              <div className="flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p
                      className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}
                    >
                      {notification.title}
                    </p>
                    <p
                      className={`text-sm mt-1 ${!notification.read ? 'text-gray-800' : 'text-gray-600'}`}
                    >
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatNotificationTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-4">No notifications</div>
        )}
      </div>

      <div className="p-6 border-t border-gray-200 text-center">
        <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
          View All Notifications
        </button>
      </div>
    </div>
  );
};

export default StoreNotifications;