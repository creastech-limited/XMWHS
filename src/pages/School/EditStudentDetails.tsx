import React from 'react';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { UsersIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profilePic: string;
  createdAt?: string;
  class: string;
  address: string;
  firstName?: string;
  lastName?: string;
  academicDetails?: {
    classAdmittedTo: string;
  };
  status?: string;
  role?: string;
}

const EditStudentDetails = () => {
  const auth = useAuth();
  const { _id } = useParams<{ _id: string }>();
  
  // State management
  const [user, setUser] = useState<UserData | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Profile State
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    class: '',
    address: '',
  });

  // API configuration - matches first component
  const API_BASE_URL = 
    import.meta.env.VITE_API_BASE_URL;

  // Get token from auth context or localStorage
  const getAuthToken = () => {
    return auth?.token || localStorage.getItem('token');
  };

  // Fetch student data
  const fetchStudentData = async () => {
    if (!_id) {
      setError('Student ID is missing from URL parameters');
      setFetchLoading(false);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError('Authentication required. Please login to continue.');
      setFetchLoading(false);
      return;
    }

    try {
      setFetchLoading(true);
      setError(null);
      
      const res = await axios.get(`${API_BASE_URL}/api/users/getuser/${_id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      // Handle different API response structures
      let studentData: UserData;
      if (res.data.user?.data) {
        studentData = res.data.user.data;
      } else if (res.data.data) {
        studentData = res.data.data;
      } else if (res.data.user) {
        studentData = res.data.user;
      } else if (res.data._id) {
        studentData = res.data;
      } else {
        throw new Error('Invalid response structure from server');
      }

      setUser(studentData);
      setProfile({
        name: studentData.name || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim(),
        class: studentData.academicDetails?.classAdmittedTo || studentData.class || '',
        email: studentData.email || '',
        phone: studentData.phone || '',
        address: studentData.address || '',
      });
      
    } catch (error: unknown) {
      handleFetchError(error);
    } finally {
      setFetchLoading(false);
    }
  };

  // Handle fetch errors
  const handleFetchError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
        auth?.logout?.();
        localStorage.removeItem('token');
      } else if (error.response?.status === 404) {
        setError('Student not found. The student may have been deleted or the ID is invalid.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to view this student.');
      } else {
        setError(error.response?.data?.message || error.message || 'Failed to fetch student data');
      }
    } else if (error instanceof Error) {
      setError(error.message || 'Failed to fetch student data');
    } else {
      setError('An unexpected error occurred while fetching student data');
    }
  };

  // Main initialization effect
  useEffect(() => {
    fetchStudentData();
  }, [_id]);

  // Profile Update Handler
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!_id) {
      setError('Missing student ID');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError('Authentication required. Please login to continue.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Enhanced validation
    const trimmedProfile = {
      name: profile.name.trim(),
      email: profile.email.trim(),
      phone: profile.phone.trim(),
      address: profile.address.trim(),
      class: profile.class.trim(),
    };

    if (!trimmedProfile.name) {
      setError('Name is required');
      setIsLoading(false);
      return;
    }

    if (!trimmedProfile.email) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedProfile.email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/users/update-user/${_id}`,
        trimmedProfile,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data) {
        // Update local state
        const updatedData = { ...user, ...trimmedProfile };
        setUser(updatedData as UserData);
        setProfile(trimmedProfile);
        
        // Update auth context if editing current user
        if (auth?.user?._id === _id) {
          const userWithRole = { 
            ...updatedData, 
            _id: _id,
            role: user?.role ?? 'student'
          };
          auth?.login?.(userWithRole, token);
        }
        
        alert('Profile updated successfully!');
      }
    } catch (error: unknown) {
      handleUpdateError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle update errors
  const handleUpdateError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
        auth?.logout?.();
        localStorage.removeItem('token');
      } else if (error.response?.status === 404) {
        setError('Student not found. Unable to update profile.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to update this student.');
      } else {
        setError(error.response?.data?.message || error.message || 'Failed to update profile');
      }
    } else if (error instanceof Error) {
      setError(error.message || 'Failed to update profile');
    } else {
      setError('An unexpected error occurred while updating profile');
    }
  };

  // Retry function for failed requests
  const handleRetry = () => {
    fetchStudentData();
  };

  // Loading state component
  if (fetchLoading) {
    return (
      <div className="overflow-hidden flex flex-col min-h-screen bg-gray-50">
        <Header profilePath="/settings"/>
        <div className="flex flex-grow">
          <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-none">
            <Sidebar />
          </aside>
          <main className="flex-1 p-4 md:p-6 overflow-hidden md:ml-64">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="ml-4 text-gray-600">Loading student data...</p>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state component
  if (error && !user) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header profilePath="/settings"/>
        <div className="flex flex-grow">
          <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-none">
            <Sidebar />
          </aside>
          <main className="flex-1 p-4 md:p-6 overflow-hidden md:ml-64">
            <div className="flex flex-col justify-center items-center h-64">
              <div className="text-red-500 text-center max-w-md">
                <p className="text-lg font-semibold mb-2">Error Loading Student Data</p>
                <p className="text-sm mb-4">{error}</p>
                {error.includes('Session expired') || error.includes('Authentication required') ? (
                  <button 
                    onClick={() => window.location.href = '/login'}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Go to Login
                  </button>
                ) : (
                  <button 
                    onClick={handleRetry} 
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="overflow-hidden flex flex-col min-h-screen bg-gray-50">
      <Header profilePath="/settings"/>
      <div className="flex flex-grow">
        <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-none">
          <Sidebar />
        </aside>

        <main className="flex-1 p-4 md:p-6 overflow-hidden md:ml-64">
          <div className="p-4 md:p-6">
            <div className="bg-gray-50 py-6 sm:py-12 px-4 sm:px-6">
              <div className="max-w-full">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="flex items-center m-5 mb-6 sm:mb-8">
                    <UsersIcon className="h-7 w-7 text-indigo-600 mr-2" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-indigo-900">
                      {user ? `${user.name}'s Details` : 'Student Details'}
                    </h1>
                  </div>
                  
                  {error && (
                    <div className="mx-5 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  {user ? (
                    <div className="px-5 pb-8">
                      {/* Student Info Display */}
                      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                        <h2 className="text-lg font-semibold text-gray-800 mb-3">Student Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Student ID:</p>
                            <p className="text-gray-800 break-all">{user._id}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Status:</p>
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              user.status?.toLowerCase() === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : user.status?.toLowerCase() === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status || 'Unknown'}
                            </span>
                          </div>
                          {user.createdAt && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">Joined:</p>
                              <p className="text-gray-800">{new Date(user.createdAt).toLocaleDateString()}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-600">Role:</p>
                            <p className="text-gray-800 capitalize">{user.role || 'Student'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Editable Form */}
                      <form onSubmit={handleProfileUpdate} className="space-y-6 sm:space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              value={profile.name}
                              onChange={e => setProfile({ ...profile, name: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-black"
                              disabled={isLoading}
                              required
                              maxLength={100}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email Address *
                            </label>
                            <input
                              type="email"
                              value={profile.email}
                              onChange={e => setProfile({ ...profile, email: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-black"
                              disabled={isLoading}
                              required
                              maxLength={100}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={profile.phone}
                              onChange={e => setProfile({ ...profile, phone: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-black"
                              disabled={isLoading}
                              maxLength={20}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Class
                            </label>
                            <input
                              type="text"
                              value={profile.class}
                              onChange={e => setProfile({ ...profile, class: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-black"
                              disabled={isLoading}
                              maxLength={50}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                          </label>
                          <textarea
                            value={profile.address}
                            onChange={e => setProfile({ ...profile, address: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-black"
                            rows={3}
                            disabled={isLoading}
                            maxLength={200}
                          />
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                          <button
                            type="submit"
                            className={`flex-1 py-3 px-4 rounded-lg text-white font-semibold transition-colors ${
                              isLoading 
                                ? 'bg-indigo-300 cursor-not-allowed' 
                                : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                            disabled={isLoading}
                          >
                            {isLoading ? 'Updating...' : 'Update Profile'}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="flex-1 py-3 px-4 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                            disabled={isLoading}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-64">
                      <p className="text-gray-500">No student data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default EditStudentDetails;