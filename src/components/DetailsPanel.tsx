import { useState, useEffect } from 'react';

import { useAuth } from '../context/AuthContext';
import { getUserDetails, updateUserProfile } from '../services';
import type { UserResponse } from '../types';


interface UserData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profilePic: string;
  createdAt?: string;
  class: string;
}

const DetailsPanel = () => {
  const authContext = useAuth();
  const token = authContext?.token;
  const [user, setUser] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Profile State
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    profilePic: '',
    createdAt: '',
    class: '',
  });



useEffect(() => {
  const fetchUserData = async () => {
    if (!token) return;

    try {
      const res: UserResponse = await getUserDetails(); 
      const userData = res.user?.data;

      if (userData) {
        // 1. Resolve the setUser error by casting to UserData
        // We ensure all optional fields are at least empty strings
        const safeUserData = {
          ...userData,
          phone: userData.phone || '',
          class: userData.class || '',
          profilePic: userData.profilePic || '',
        } as UserData;

        setUser(safeUserData); 
        
        // 2. Resolve the setProfile error (Line 66)
        // Every single property needs a fallback to satisfy the 'string' type
        setProfile({
          name: userData.name || '',      // Line 66 likely lives here
          email: userData.email || '',    
          class: userData.class || '',
          phone: userData.phone || '',
          profilePic: userData.profilePic || '',
          createdAt: (userData.createdAt as string) || '',
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  fetchUserData();
}, [token]);
  // Profile Update Handler
const handleProfileUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Safety check: ensure we have a user ID before calling the service
  if (!user?._id) {
    console.error('No user ID found');
    return;
  }

  setIsLoading(true);
  try {
    // Call the new service function
    await updateUserProfile(user._id, {
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
    });

    setIsEditing(false);
    // Suggestion: You might want to refresh the user data here 
    // to show the updated info across the app!
  } catch (error) {
    console.error('Profile update failed:', error);
  } finally {
    setIsLoading(false);
  }
};


 

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-indigo-900 mb-6 sm:mb-8">
          {/* Edit Details */}
        </h1>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 sm:p-10">
            <form
              onSubmit={handleProfileUpdate}
              className="space-y-6 sm:space-y-8"
            >
             
              <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                    className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Full Name"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Class
                  </label>
                  <input
                    type="text"
                    value={profile.class}
                    onChange={(e) =>
                      setProfile({ ...profile, class: e.target.value })
                    }
                    className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Class"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                    className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Email Address"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Phone Number"
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 sm:space-x-4 mt-6 sm:mt-10">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsPanel;
