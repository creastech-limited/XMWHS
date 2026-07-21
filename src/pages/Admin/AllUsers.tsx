import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  Search, 
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Phone,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  User,
  Save,
  X
} from 'lucide-react';
import AdminSidebar from '../../components/Adminsidebar';
import AdminHeader from '../../components/AdminHeader';
import { getAllUsers, activateUser, deactivateUser, updateUser } from '../../services';
import type { UserData } from '../../types';

const AllUsers = () => {
  const { user: authUser } = useAuth() ?? {};
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('all-users');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData['user'] | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    status: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const sectionConfig = (() => {
    if (location.pathname.endsWith('/schools')) {
      return {
        menuId: 'schools',
        title: 'Schools',
        description: 'Manage all school accounts',
        defaultRole: 'school',
        totalLabel: 'Total Schools'
      };
    }

    if (location.pathname.endsWith('/parents')) {
      return {
        menuId: 'parents',
        title: 'Parents',
        description: 'Manage all parent accounts',
        defaultRole: 'parent',
        totalLabel: 'Total Parents'
      };
    }

    return {
      menuId: 'all-users',
      title: 'User Management',
      description: 'Manage all platform users',
      defaultRole: 'all',
      totalLabel: 'Total Users'
    };
  })();

  const fetchUsers = useCallback(async () => {
    try {
      const data = await getAllUsers();
      const scopedData = sectionConfig.defaultRole === 'all'
        ? data
        : data.filter((userData) => userData.user?.role === sectionConfig.defaultRole);

      setUsers(data);
      setFilteredUsers(scopedData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Failed to fetch users' });
      setTimeout(() => setMessage(null), 3000);
    }
  }, [sectionConfig.defaultRole]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        const token = authUser?.token || localStorage.getItem('token');
        
        if (!token) {
          console.log('No token found');
          setLoading(false);
          return;
        }

        if (typeof token !== 'string') {
          console.log('Invalid token type');
          setLoading(false);
          return;
        }

        await fetchUsers();

      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (authUser !== undefined) {
      initializeData();
    }
  }, [authUser?.token, fetchUsers, authUser]);

  useEffect(() => {
    setActiveMenu(sectionConfig.menuId);
    setRoleFilter('all');
    setStatusFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  }, [sectionConfig.menuId]);

  useEffect(() => {
    let result = sectionConfig.defaultRole === 'all'
      ? users
      : users.filter((userData) => userData.user?.role === sectionConfig.defaultRole);

    if (searchTerm) {
      result = result.filter(userData => {
        const user = userData.user;
        if (!user) return false;
        
        return (
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone?.includes(searchTerm) ||
          user.role?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (statusFilter !== 'all') {
      result = result.filter(userData => userData.user?.status === statusFilter);
    }

    if (roleFilter !== 'all') {
      result = result.filter(userData => userData.user?.role === roleFilter);
    }

    setFilteredUsers(result);
    setCurrentPage(1);
  }, [users, searchTerm, statusFilter, roleFilter, sectionConfig.defaultRole]);

  const scopedUsers = sectionConfig.defaultRole === 'all'
    ? users
    : users.filter((userData) => userData.user?.role === sectionConfig.defaultRole);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Activate user handler
  const handleActivateUser = async (userId: string) => {
    try {
      const response = await activateUser(userId);
      setMessage({ type: 'success', text: response.message || 'User activated successfully' });
      await fetchUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error activating user:', error);
      setMessage({ type: 'error', text: 'Failed to activate user' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Deactivate user handler
  const handleDeactivateUser = async (userId: string) => {
    try {
      const response = await deactivateUser(userId);
      setMessage({ type: 'success', text: response.message || 'User deactivated successfully' });
      await fetchUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error deactivating user:', error);
      setMessage({ type: 'error', text: 'Failed to deactivate user' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Open edit modal
  const handleEditClick = (user: UserData['user']) => {
    if (!user) return;
    setSelectedUser(user);
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || '',
      status: user.status || ''
    });
    setIsEditModalOpen(true);
  };

  // Handle edit form input changes
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // Update user handler
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser?._id) return;

    setIsUpdating(true);
    try {
      const response = await updateUser(selectedUser._id);
      setMessage({ type: 'success', text: response.message || 'User updated successfully' });
      await fetchUsers();
      setIsEditModalOpen(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage({ type: 'error', text: 'Failed to update user' });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string = 'Inactive') => {
    const statusConfig = {
      Active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      Inactive: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      Suspended: { color: 'bg-red-100 text-red-800', icon: XCircle },
      Pending: { color: 'bg-yellow-100 text-yellow-800', icon: Shield }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Inactive;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} className="mr-1" />
        {status}
      </span>
    );
  };

  const getRoleBadge = (role: string = 'user') => {
    const roleColors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      student: 'bg-blue-100 text-blue-800',
      teacher: 'bg-orange-100 text-orange-800',
      staff: 'bg-indigo-100 text-indigo-800',
      parent: 'bg-pink-100 text-pink-800',
      school: 'bg-teal-100 text-teal-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[role] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUserInitials = (user: UserData['user']) => {
    if (!user) return '?';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return first + last || user.name?.charAt(0) || '?';
  };

  const escapeCsvValue = (value: unknown) => {
    const stringValue = String(value ?? '');
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const handleExport = () => {
    if (sectionConfig.defaultRole !== 'parent' || filteredUsers.length === 0) {
      return;
    }

    const headers = ['Parent ID', 'Name', 'Email', 'Phone', 'Status', 'Address', 'Date Joined'];
    const rows = filteredUsers.map((userData) => {
      const user = userData.user;
      return [
        user?._id || '',
        user?.name || '',
        user?.email || '',
        user?.phone || '',
        user?.status || '',
        user?.schoolAddress || '',
        formatDate(user?.createdAt)
      ];
    });

    const csvContent = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map((row) => row.map(escapeCsvValue).join(','))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);

    link.href = downloadUrl;
    link.download = `parents-${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="m-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeMenu={activeMenu}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Message Toast */}
            {message && (
              <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              } text-white`}>
                {message.text}
              </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{sectionConfig.title}</h1>
                <p className="text-gray-600 mt-1">{sectionConfig.description}</p>
              </div>
              <div className="flex space-x-3 mt-4 sm:mt-0">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={sectionConfig.defaultRole !== 'parent' || filteredUsers.length === 0}
                  className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={16} className="mr-2" />
                  {sectionConfig.defaultRole === 'parent' ? 'Export CSV' : 'Export'}
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">{sectionConfig.totalLabel}</p>
                    <p className="text-2xl font-bold text-gray-900">{scopedUsers.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Active Accounts</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {scopedUsers.filter(u => u.user?.status === 'Active').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <User className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Pending Accounts</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {scopedUsers.filter(u => u.user?.status === 'Pending').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Inactive Accounts</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {scopedUsers.filter(u => u.user?.status === 'Inactive').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search users by name, email, phone, or role..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Pending">Pending</option>
                  </select>
                  
                  {sectionConfig.defaultRole === 'all' && (
                    <select
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >
                      <option value="all">All Roles</option>
                      <option value="student">Student</option>
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="school">School</option>
                      <option value="parent">Parent</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentUsers.length > 0 ? (
                      currentUsers.map((userData) => {
                        const user = userData.user;
                        if (!user) return null;
                        
                        return (
                          <tr key={user._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                                    <span className="text-white font-medium text-sm">
                                      {getUserInitials(user)}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{user.email}</div>
                              {user.phone && (
                                <div className="text-sm text-gray-500 flex items-center">
                                  <Phone size={12} className="mr-1" />
                                  {user.phone}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getRoleBadge(user.role)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(user.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar size={12} className="mr-1" />
                                {formatDate(user.createdAt)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button 
                                  onClick={() => handleEditClick(user)}
                                  className="text-blue-600 hover:text-blue-900 p-1"
                                  title="View Details"
                                >
                                  <Eye size={16} />
                                </button>
                                <button 
                                  onClick={() => handleEditClick(user)}
                                  className="text-gray-600 hover:text-gray-900 p-1"
                                  title="Edit User"
                                >
                                  <Edit size={16} />
                                </button>
                                
                                {user.status === 'Active' ? (
                                  <button 
                                    onClick={() => handleDeactivateUser(user._id)}
                                    className="text-orange-600 hover:text-orange-900 p-1"
                                    title="Deactivate User"
                                  >
                                    <XCircle size={16} />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleActivateUser(user._id)}
                                    className="text-green-600 hover:text-green-900 p-1"
                                    title="Activate User"
                                  >
                                    <CheckCircle size={16} />
                                  </button>
                                )}
                                
                                <button 
                                  className="text-red-600 hover:text-red-900 p-1"
                                  title="Delete User"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center">
                          <div className="text-gray-500">
                            <Users size={48} className="mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No users found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                      </span> of{' '}
                      <span className="font-medium">{filteredUsers.length}</span> users
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border text-black border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalPages > 5) {
                          if (currentPage > 3) {
                            pageNum = currentPage - 3 + i;
                          }
                          if (currentPage > totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          }
                        }
                        return pageNum <= totalPages ? (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 border rounded-md text-sm ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ) : null;
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-black border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

   {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-900 bg-opacity-60"
            onClick={() => setIsEditModalOpen(false)}
          />

          {/* Modal Panel */}
          <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 pt-6 pb-4">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleUpdateUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      name="role"
                      value={editFormData.role}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="student">Student</option>
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="school">School</option>
                      <option value="parent">Parent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={editFormData.status}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3 pb-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                  >
                    {isUpdating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUsers;