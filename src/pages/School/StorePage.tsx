import React, { useState, useEffect } from 'react';
import {
  Store,
  Search,
  Plus,
  MoreVertical,
  Download,
  Mail,
  ClipboardCopyIcon,
  MapPin,
  Phone,
  Filter,
  ChevronLeft,
  ChevronRight,
  XCircle,
  CheckCircle,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';

// Import services
import { getUserDetails, getStoresBySchoolId, getStoreCountBySchoolId, resetPassword, activateStore, deactivateStore } from '../../services';

// Import types
import type { Store as StoreType, UserResponse, SnackbarState } from '../../types/user';

export const StorePage: React.FC = () => {
  // Auth context for getting token
  const authContext = useAuth();
  const token = authContext?.token;
  const authToken = token || localStorage.getItem('token');

  // UI state
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [menuStore, setMenuStore] = useState<StoreType | null>(null);

  // Store data state
  const [schoolId, setSchoolId] = useState('');
  const [storeLink, setStoreLink] = useState('');
  const [stores, setStores] = useState<StoreType[]>([]);
  const [storeCount, setStoreCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [activeStoreCount, setActiveStoreCount] = useState(0);

  // 1) Fetch user profile to get schoolId and storeLink
  useEffect(() => {
    if (!authToken) return;

    const fetchUserProfile = async () => {
      try {
        const data: UserResponse = await getUserDetails();
        
        // Extract user data safely
        let userProfile: Record<string, unknown>;
        if (data.user?.data) {
          userProfile = data.user.data as Record<string, unknown>;
        } else if (data.user) {
          userProfile = data.user as Record<string, unknown>;
        } else if (data.data) {
          userProfile = data.data as Record<string, unknown>;
        } else {
          userProfile = data as Record<string, unknown>;
        }

        const schoolId = (userProfile?.schoolId as string) || '';
        const schoolName = (userProfile?.schoolName as string) || (userProfile?.data as Record<string, unknown>)?.schoolName as string || (userProfile?.name as string) || '';
        const linkPath = (userProfile?.Link as string) || (userProfile?.data as Record<string, unknown>)?.Link as string || '';
        
        if (!schoolId) {
          throw new Error('School ID not found in user profile');
        }

        setSchoolId(schoolId);

        // Construct the full store registration link with schoolId and schoolName
        const fullLink = `${window.location.origin}/stores/new${linkPath}?schoolId=${schoolId}&schoolName=${encodeURIComponent(schoolName)}`;
        setStoreLink(fullLink);
      } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user profile';
        setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      }
    };

    fetchUserProfile();
  }, [authToken]);

  // 2) Fetch stores for this schoolId
  useEffect(() => {
    if (!authToken || !schoolId) return;

    const fetchStores = async () => {
      setLoading(true);
      try {
        const storeData = await getStoresBySchoolId(schoolId);
        console.log('Stores API response:', storeData);
        
        setStores(storeData);
      } catch (err) {
        console.error('Fetch error:', err);
        setStores([]);
        // No snackbar error for store fetching - empty state UI handles it
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [authToken, schoolId]);

  // 3) Fetch store count for this schoolId
  useEffect(() => {
    if (!authToken || !schoolId) return;

    const fetchStoreCounts = async () => {
      try {
        // Fetch total store count
        const totalCount = await getStoreCountBySchoolId(schoolId);
        setStoreCount(totalCount);

        // Fetch active store count
        const activeCount = await getStoreCountBySchoolId(schoolId, 'active');
        setActiveStoreCount(activeCount);
      } catch (err) {
        console.error('Store count error:', err);
        // Fallback to local counts
        setStoreCount(stores.length);
        setActiveStoreCount(
          stores.filter((s) => s?.status?.toLowerCase() === 'active').length
        );
      }
    };

    fetchStoreCounts();
  }, [authToken, schoolId, stores]);

  // Filter stores based on search, status, and type
  const filteredStores = stores.filter((store) => {
    if (!store) return false;
    const matchesSearch =
      (store.storeName?.toLowerCase() || '').includes(
        searchQuery.toLowerCase()
      ) ||
      (store.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (store.status?.toLowerCase() || '') === statusFilter;
    const matchesType = typeFilter === 'all' || store.storeType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const pageCount = Math.ceil(filteredStores.length / rowsPerPage);
  const paginatedStores = filteredStores.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleCopyLink = () => {
    if (!storeLink) {
      setSnackbar({
        open: true,
        message: 'School information is not available.',
        severity: 'error',
      });
      return;
    }
    navigator.clipboard
      .writeText(storeLink)
      .then(() => {
        setSnackbar({
          open: true,
          message: 'Registration link copied to clipboard!',
          severity: 'success',
        });
      })
      .catch(() => {
        setSnackbar({
          open: true,
          message: 'Failed to copy registration link',
          severity: 'error',
        });
      });
  };

  const handleExport = () => {
    if (!stores || stores.length === 0) {
      setSnackbar({
        open: true,
        message: "No stores available to export",
        severity: "warning",
      });
      return;
    }

    setSnackbar({
      open: true,
      message: "Exporting store data...",
      severity: "info",
    });

    // ----- Build CSV with fixed headers -----
    const headers = [
      "_id",
      "storeName",
      "storeType",
      "location",
      "email",
      "phone",
      "status",
      "createdAt"
    ];

    const csvHeader = headers.join(",") + "\n";

    const csvRows = stores
      .map((store) =>
        headers
          .map((key) => {
            const value = (store as unknown as Record<string, unknown>)[key] ?? "";

            // Escape if contains comma or quote
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(",")
      )
      .join("\n");

    const csvContent = csvHeader + csvRows;

    // ----- Download the CSV -----
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "stores_export.csv";
    link.click();

    URL.revokeObjectURL(url);

    // ----- Success snackbar -----
    setSnackbar({
      open: true,
      message: "Stores exported successfully",
      severity: "success",
    });
  };

  // Handle menu close
  const handleMenuClose = () => {
    setDropdownOpen(null);
    setMenuStore(null);
  };

  // Handle Reset Password
  const handleResetPassword = async (store: StoreType) => {
    try {
      const tempPassword = Math.random().toString(36).slice(-8);
      await resetPassword(store.email, tempPassword);

      setSnackbar({
        open: true,
        message: `Password reset email sent to ${store.email}`,
        severity: 'success',
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      handleMenuClose();
    }
  };

  // Handle Activate/Deactivate Store
  const handleActivateDeactivate = async (store: StoreType) => {
    try {
      const result = store.status.toLowerCase() === 'active'
        ? await deactivateStore(store._id)
        : await activateStore(store._id);
      
      // Update the store status in the local state
      setStores(prevStores =>
        prevStores.map(s =>
          s._id === store._id
            ? { ...s, status: result.status || (store.status.toLowerCase() === 'active' ? 'inactive' : 'active') }
            : s
        )
      );

      setSnackbar({
        open: true,
        message: `Store ${store.status.toLowerCase() === 'active' ? 'deactivated' : 'activated'} successfully`,
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating store status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update store status';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      handleMenuClose();
    }
  };

  // Get unique store types for filtering
  const storeTypes = [
    ...new Set(stores.map((store) => store?.storeType).filter(Boolean)),
  ];

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get store type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Cafeteria':
        return 'bg-blue-100 text-blue-800';
      case 'Bookstore':
        return 'bg-purple-100 text-purple-800';
      case 'Uniform':
        return 'bg-indigo-100 text-indigo-800';
      case 'Supplies':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Close snackbar
  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Toggle dropdown menu for a store
  const toggleDropdown = (id: string, store: StoreType) => {
    if (dropdownOpen === id) {
      setDropdownOpen(null);
      setMenuStore(null);
    } else {
      setDropdownOpen(id);
      setMenuStore(store);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 ">
      <Header profilePath="/settings" />
      <div className="flex flex-grow">
        <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-0 bg-none">
          <Sidebar />
        </aside>
        <main className="flex-grow p-4 md:p-8 md:ml-64 overflow-x-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Store className="h-7 w-7 text-indigo-600" />
              <span className="text-indigo-900">Stores Management</span>
            </h1>
            <button
              onClick={() => {
                if (storeLink) {
                  window.location.href = storeLink;
                } else {
                  setSnackbar({
                    open: true,
                    message:
                      'School information is missing. Cannot generate registration link.',
                    severity: 'error',
                  });
                }
              }}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="h-5 w-5" />
              <span>Add New Store</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <p className="text-gray-500 text-sm font-medium">Total Stores</p>
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-bold text-gray-900 mt-1">
                  {storeCount}
                </h3>
                <Store className="h-12 w-12 text-indigo-100" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <p className="text-gray-500 text-sm font-medium">Active Stores</p>
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-bold text-green-600 mt-1">
                  {activeStoreCount}
                </h3>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Store className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <p className="text-gray-500 text-sm font-medium">Store Types</p>
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-bold text-purple-600 mt-1">
                  {storeTypes.length}
                </h3>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Filter className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Registration Link Card */}
          <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100 ">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-indigo-600" />
                <h2 className="font-semibold text-lg text-black">
                  Store Registration Link
                </h2>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 w-full">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={storeLink}
                  readOnly
                  placeholder="Store registration link"
                  title="Store registration link - copy and share with store managers"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm focus:outline-none font-medium"
                />
              </div>
              <button
                onClick={handleCopyLink}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Copy link"
              >
                <ClipboardCopyIcon className="text-indigo-500 h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by store name or email..."
                  title="Search for stores by name or email address"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-800"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  id="statusFilter"
                  aria-label="Filter stores by status"
                  title="Filter by status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  id="typeFilter"
                  aria-label="Filter stores by type"
                  title="Filter by type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 font-medium"
                >
                  <option value="all">All Types</option>
                  {storeTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-800"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Loading Indicator */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {filteredStores.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                  <Store className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {loading ? 'Loading stores...' : 'No stores found'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {loading 
                      ? 'Please wait while we load your store data' 
                      : 'No stores are currently registered for your school'
                    }
                  </p>
                  {!loading && (
                    <button
                      onClick={() => {
                        if (storeLink) {
                          window.location.href = storeLink;
                        }
                      }}
                      className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm mx-auto"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Add Your First Store</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Store
                          </th>
                          <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Join Date
                          </th>
                          <th className="px-4 py-3 md:px-6 md:py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedStores.map((store) => (
                          <tr key={store._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
                                  {store.storeName.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {store.storeName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ID: {store._id.substring(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeColor(store.storeType)}`}
                              >
                                {store.storeType}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-500">
                                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span className="truncate max-w-xs">
                                  {store.location}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div className="flex items-center mb-1">
                                  <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                  <span className="truncate max-w-xs">
                                    {store.email}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                  <span>{store.phone}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(store.status)}`}
                              >
                                {store.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(store.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                              <button
                                onClick={() => toggleDropdown(store._id, store)}
                                className="text-gray-400 hover:text-gray-500"
                                title="More actions"
                              >
                                <MoreVertical className="h-5 w-5" />
                              </button>
                              {dropdownOpen === store._id && menuStore && (
                                <div
                                  className="absolute z-20 bg-white rounded-lg shadow-lg py-2 w-56 border border-gray-200"
                                  style={{
                                    top: 0,
                                    left: -60,
                                  }}
                                >
                                  <button
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => {
                                      setDropdownOpen(null);
                                      window.location.href = `/stores/edit/${store._id}`;
                                    }}
                                  >
                                    View Details
                                  </button>
                                  <button
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                                    onClick={() => handleResetPassword(menuStore)}
                                  >
                                    <Mail className="h-4 w-4" />
                                    Reset Password
                                  </button>
                                  <div className="border-t border-gray-100 my-1"></div>
                                  <button
                                    className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 w-full text-left ${
                                      menuStore.status.toLowerCase() === 'active'
                                        ? 'text-red-600'
                                        : 'text-green-600'
                                    }`}
                                    onClick={() => handleActivateDeactivate(menuStore)}
                                  >
                                    {menuStore.status.toLowerCase() === 'active' ? (
                                      <>
                                        <XCircle className="h-4 w-4" />
                                        Deactivate Store
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4" />
                                        Activate Store
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing{' '}
                          <span className="font-medium">
                            {(page - 1) * rowsPerPage + 1}
                          </span>{' '}
                          to{' '}
                          <span className="font-medium">
                            {Math.min(
                              page * rowsPerPage,
                              filteredStores.length
                            )}
                          </span>{' '}
                          of{' '}
                          <span className="font-medium">
                            {filteredStores.length}
                          </span>{' '}
                          results
                        </p>
                      </div>
                      <div>
                        <nav
                          className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                          aria-label="Pagination"
                        >
                          <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            title="Previous page"
                            className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0 ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          {/* Page numbers */}
                          {Array.from(
                            { length: Math.min(5, pageCount) },
                            (_, i) => {
                              // Create a window of 5 pages centered around the current page
                              let pageNum;
                              if (pageCount <= 5) {
                                // If 5 or fewer pages, show all
                                pageNum = i + 1;
                              } else if (page <= 3) {
                                // If near the start, show first 5 pages
                                pageNum = i + 1;
                              } else if (page >= pageCount - 2) {
                                // If near the end, show last 5 pages
                                pageNum = pageCount - 4 + i;
                              } else {
                                // Otherwise, show 2 pages before and 2 pages after the current page
                                pageNum = page - 2 + i;
                              }

                              // Ensure page number is within bounds
                              if (pageNum < 1 || pageNum > pageCount)
                                return null;

                              return (
                                <button
                                  key={`page-${pageNum}`}
                                  onClick={() => setPage(pageNum)}
                                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                    page === pageNum
                                      ? 'bg-indigo-600 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            }
                          )}
                          <button
                            onClick={() =>
                              setPage((p) => Math.min(pageCount, p + 1))
                            }
                            disabled={page === pageCount}
                            title="Next page"
                            className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0 ${page === pageCount ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
      <Footer />

      {/* Snackbar/Toast */}
      {snackbar.open && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`rounded-lg shadow-lg px-6 py-4 ${
              snackbar.severity === 'success'
                ? 'bg-green-600'
                : snackbar.severity === 'error'
                  ? 'bg-red-600'
                  : snackbar.severity === 'warning'
                    ? 'bg-yellow-600'
                    : 'bg-blue-600'
            } text-white flex items-center gap-3`}
          >
            <span>{snackbar.message}</span>
            <button
              onClick={closeSnackbar}
              className="text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Backdrop for dropdown menus */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setDropdownOpen(null)}
        ></div>
      )}
    </div>
  );
};