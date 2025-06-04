import React from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import Footer from '../components/Footer';
import { Store } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface UserData {
  _id: string;
  name: string;
  email: string;
  location: string;
  profilePic: string;
  createdAt?: string;
  type: string;
}

const EditStoreDetails = () => {
  const authContext = useAuth();
  const token = authContext?.token;
  const [user, setUser] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Profile State
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    location: '',
    type: '',
    phone: '',
  });

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging.up.railway.app';

  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/api/users/getuserone`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.user?.data) {
          setUser(res.data.user.data);
          setProfile({
            name: res.data.user.data.name,
            type: res.data.user.data.type,
            email: res.data.user.data.email,
            location: res.data.user.data.location,
            phone: res.data.user.data.phone || '',
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
    setIsLoading(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/users/update-user/${user?._id}`,
        {
          name: profile.name,
          email: profile.email,
          location: profile.location,
          phone: profile.phone,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="overflow-hidden flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-grow">
        <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-none">
          <Sidebar />
        </aside>

        {/* Settings panel fills remaining space, scrollable if needed */}
        <main className="flex-1 p-4 md:p-6 overflow-hidden">
          <div className="p-4 md:p-6">
            <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4 sm:px-6">
              <div className="ml-70 max-w-full">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="flex items-center m-5 mb-6 sm:mb-8">
                    <Store className="h-7 w-7 text-indigo-600 mr-2" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-indigo-900">
                      Store Details
                    </h1>
                  </div>
                  <div className="p-4 sm:p-10">
                    <form
                      onSubmit={handleProfileUpdate}
                      className="space-y-6 sm:space-y-8"
                    >
                      <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                            Store Name
                          </label>
                          <input
                            type="text"
                            value={profile.name}
                            onChange={(e) =>
                              setProfile({ ...profile, name: e.target.value })
                            }
                            className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Store Name"
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                            Store Type
                          </label>
                          <select
                            value={profile.type}
                            onChange={(e) =>
                              setProfile({ ...profile, type: e.target.value })
                            }
                            className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={!isEditing}
                          >
                            <option value="" disabled>
                              Store Type
                            </option>
                            <option value="Cafeteria">Cafeteria</option>
                            <option value="Bookstore">Bookstore</option>
                            <option value="Uniform">Uniform</option>
                            <option value="Supplies">Supplies</option>
                          </select>
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
                            Store Location
                          </label>
                          <select
                            value={profile.location}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                location: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={!isEditing}
                          >
                            <option value="" disabled>
                              Store Location
                            </option>
                            <option value="Block A">Block A</option>
                            <option value="Block B">Block B</option>
                            <option value="Block C">Block C</option>
                            <option value="Block D">Block D</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="text"
                            value={profile.phone}
                            onChange={(e) =>
                              setProfile({ ...profile, phone: e.target.value })
                            }
                            className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="phone"
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
          </div>
        </main>
      </div>

      <div className="mt-[-900px]">
        <Footer />
      </div>
    </div>
  );
};

export default EditStoreDetails;
