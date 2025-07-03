import React from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import Footer from '../components/Footer';
import { Store } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom'; // Add this import

interface UserData {
  _id: string;
  name: string;
  email: string;
  location: string;
  profilePic: string;
  createdAt?: string;
  type: string;
  phone?: string;
}

const EditStoreDetails = () => {
  const authContext = useAuth();
  const { id } = useParams<{ id: string }>(); // Get the store ID from URL parameters
  const [user, setUser] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

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

  // Get token from auth context or localStorage
  const getAuthToken = React.useCallback(() => {
    return authContext?.token || localStorage.getItem('token');
  }, [authContext?.token]);

  useEffect(() => {
    const fetchStoreData = async () => {
      const token = getAuthToken();
      
      if (!token) {
        setFetchError('No authentication token found');
        return;
      }

      if (!id) {
        setFetchError('No store ID provided');
        return;
      }

      setIsLoading(true);
      setFetchError(null);

      try {
        // Fetch specific store data using the store ID from URL
        const res = await axios.get(`${API_BASE_URL}/api/users/getuser/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        // Handle the response structure - adjust based on your API response format
        if (res.data?.user?.data) {
          setUser(res.data.user.data);
          setProfile({
            name: res.data.user.data.name || '',
            type: res.data.user.data.type || '',
            email: res.data.user.data.email || '',
            location: res.data.user.data.location || '',
            phone: res.data.user.data.phone || '',
          });
        } else if (res.data?.data) {
          // Alternative response structure
          setUser(res.data.data);
          setProfile({
            name: res.data.data.name || '',
            type: res.data.data.type || '',
            email: res.data.data.email || '',
            location: res.data.data.location || '',
            phone: res.data.data.phone || '',
          });
        } else if (res.data) {
          // Direct data structure
          setUser(res.data);
          setProfile({
            name: res.data.name || '',
            type: res.data.type || '',
            email: res.data.email || '',
            location: res.data.location || '',
            phone: res.data.phone || '',
          });
        } else {
          setFetchError('Invalid response format from server');
        }
      } catch (error) {
        console.error('Error fetching store data:', error);
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNABORTED') {
            setFetchError('Request timeout - please try again');
          } else if (error.response?.status === 404) {
            setFetchError('Store not found');
          } else if (error.response?.status === 401) {
            setFetchError('Unauthorized - please login again');
          } else {
            setFetchError(`Error: ${error.response?.data?.message || error.message}`);
          }
        } else {
          setFetchError('An unexpected error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreData();
  }, [id, authContext?.token, API_BASE_URL, getAuthToken]);

  // Profile Update Handler
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    
    if (!token || !user?._id) {
      setFetchError('Authentication or user data missing');
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      await axios.put(
        `${API_BASE_URL}/api/users/update-user/${user._id}`,
        {
          name: profile.name,
          email: profile.email,
          location: profile.location,
          phone: profile.phone,
          type: profile.type,
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      setIsEditing(false);
      // Optionally show success message
    } catch (error) {
      console.error('Profile update failed:', error);
      if (axios.isAxiosError(error)) {
        setFetchError(`Update failed: ${error.response?.data?.message || error.message}`);
      } else {
        setFetchError('Profile update failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading && !user) {
    return (
      <div className="overflow-hidden flex flex-col min-h-screen bg-gray-50">
        <Header profilePath="/settings"/>
        <div className="flex flex-grow">
          <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-none">
            <Sidebar />
          </aside>
          <main className="flex-1 p-4 md:p-6 overflow-hidden">
            <div className="p-4 md:p-6">
              <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4 sm:px-6">
                <div className="ml-70 max-w-full">
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="flex items-center justify-center p-10">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                      <span className="ml-3 text-lg text-gray-600">Loading store details...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <div className="overflow-hidden flex flex-col min-h-screen bg-gray-50">
        <Header profilePath="/settings"/>
        <div className="flex flex-grow">
          <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-none">
            <Sidebar />
          </aside>
          <main className="flex-1 p-4 md:p-6 overflow-hidden">
            <div className="p-4 md:p-6">
              <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4 sm:px-6">
                <div className="ml-70 max-w-full">
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="flex items-center m-5 mb-6 sm:mb-8">
                      <Store className="h-7 w-7 text-red-600 mr-2" />
                      <h1 className="text-2xl sm:text-3xl font-bold text-red-900">
                        Error Loading Store Details
                      </h1>
                    </div>
                    <div className="p-4 sm:p-10">
                      <div className="text-center">
                        <p className="text-red-600 mb-4">{fetchError}</p>
                        <button
                          onClick={() => window.location.reload()}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header profilePath="/settings" />
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
                    {user && (
                      <span className="ml-3 text-sm text-gray-500">
                        ID: {user._id.substring(0, 8)}...
                      </span>
                    )}
                  </div>
                  
                  {fetchError && (
                    <div className="mx-5 mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                      {fetchError}
                    </div>
                  )}
                  
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
                              disabled={isLoading}
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