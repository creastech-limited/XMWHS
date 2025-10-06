import React from 'react';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { Store } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';

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
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    location: '',
    type: '',
    phone: '',
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
        const res = await axios.get(`${API_BASE_URL}/api/users/getuser/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

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
          setUser(res.data.data);
          setProfile({
            name: res.data.data.name || '',
            type: res.data.data.type || '',
            email: res.data.data.email || '',
            location: res.data.data.location || '',
            phone: res.data.data.phone || '',
          });
        } else if (res.data) {
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

  if (isLoading && !user) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header profilePath="/settings"/>
        <div className="flex flex-grow">
          <aside className="hidden md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 z-[100]">
            <Sidebar />
          </aside>
          <main className="flex-1 md:ml-64 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="flex items-center justify-center p-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  <span className="ml-3 text-lg text-gray-600">Loading store details...</span>
                </div>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header profilePath="/settings"/>
        <div className="flex flex-grow">
          <aside className="hidden md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 z-[100]">
            <Sidebar />
          </aside>
          <main className="flex-1 md:ml-64 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="flex items-center p-5 mb-4">
                  <Store className="h-7 w-7 text-red-600 mr-2" />
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-red-900">
                    Error Loading Store Details
                  </h1>
                </div>
                <div className="p-4 sm:p-8">
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
        <aside className="hidden md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 z-[100]">
          <Sidebar />
        </aside>

        <main className="flex-1 md:ml-64 p-4 md:p-6 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 p-4 sm:p-5 mb-4 sm:mb-6">
                <Store className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-600" />
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-indigo-900">
                  Store Details
                </h1>
                {user && (
                  <span className="text-xs sm:text-sm text-gray-500 break-all">
                    ID: {user._id.substring(0, 8)}...
                  </span>
                )}
              </div>
              
              {fetchError && (
                <div className="mx-4 sm:mx-5 mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {fetchError}
                </div>
              )}
              
              <div className="p-4 sm:p-6 md:p-10">
                <form
                  onSubmit={handleProfileUpdate}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Name
                      </label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) =>
                          setProfile({ ...profile, name: e.target.value })
                        }
                        className="w-full px-4 py-2.5 text-sm text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                        placeholder="Store Name"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Type
                      </label>
                      <select
                        value={profile.type}
                        onChange={(e) =>
                          setProfile({ ...profile, type: e.target.value })
                        }
                        className="w-full px-4 py-2.5 text-sm text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) =>
                          setProfile({ ...profile, email: e.target.value })
                        }
                        className="w-full px-4 py-2.5 text-sm text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                        placeholder="Email Address"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full px-4 py-2.5 text-sm text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
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
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={profile.phone}
                        onChange={(e) =>
                          setProfile({ ...profile, phone: e.target.value })
                        }
                        className="w-full px-4 py-2.5 text-sm text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                        placeholder="Phone Number"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="w-full sm:w-auto px-6 py-2.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          disabled={isLoading}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full sm:w-auto px-6 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="w-full sm:w-auto px-6 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default EditStoreDetails;