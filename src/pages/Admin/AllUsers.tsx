import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Phone,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  User,
  MoreVertical,
  Mail,
  ArrowLeftRight
} from 'lucide-react';
import AdminSidebar from '../../components/Adminsidebar';
import AdminHeader from '../../components/AdminHeader';
import { getAllUsers,
  activateUser,
  deactivateUser,
  resetStorePassword } from '../../services';
import type { UserData } from '../../types'; // Use the imported type

const AllUsers = () => {
  const { user: authUser } = useAuth() ?? {};
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('all-users');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [selectedUser, setSelectedUser] = useState<UserData['user'] | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Action Menu state
  const [menuUser, setMenuUser] = useState<UserData['user'] | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const handleMenuOpen = (e: React.MouseEvent, user: UserData['user']) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
    });
    setMenuUser(user);
    setIsMenuOpen(true);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
    setMenuUser(null);
  };

  const handleViewTransactions = (userId: string, role?: string) => {
    handleMenuClose();
    navigate(`/admin/transactions?user=${encodeURIComponent(userId)}${role ? `&role=${encodeURIComponent(role.toLowerCase())}` : ''}`);
  };

  const handleResetPassword = async (email?: string) => {
    if (!email) {
      alert('No email address available for this user.');
      return;
    }
    if (!window.confirm(`Send password reset email to ${email}?`)) {
      return;
    }
    try {
      setActionLoading(email);
      await resetStorePassword(email);
      alert(`Password reset instructions have been sent to ${email}`);
    } catch (error) {
      console.error('Error sending password reset:', error);
      alert('Failed to send password reset email.');
    } finally {
      setActionLoading(null);
      handleMenuClose();
    }
  };

  const handleViewUser = (user: UserData['user']) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setShowUserModal(false);
  };

  const handleStatusToggle = async (userId: string, currentStatus?: string) => {
    // Guard: ensure we have a valid ID
    if (!userId || userId === 'undefined' || userId === 'null') {
      alert('Cannot update status: User ID is missing.');
      return;
    }
    const isCurrentlyActive = currentStatus?.toLowerCase() === 'active';
    const action = isCurrentlyActive ? 'deactivate' : 'activate';

    if (!window.confirm(`Are you sure you want to ${action} this account?`)) {
      return;
    }

    try {
      setActionLoading(userId);

      if (isCurrentlyActive) {
        await deactivateUser(userId);
      } else {
        await activateUser(userId);
      }

      await fetchUsers();
    } catch (error) {
      console.error(`Error ${action}ing account:`, error);
      alert(`Failed to ${action} account. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

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
      description: 'Manage all platform users (Students, Stores, Agents, Schools, Parents)',
      defaultRole: 'all',
      totalLabel: 'Total Users'
    };
  })();

  const fetchUsers = useCallback(async () => {
    try {
      const data = await getAllUsers();
      const scopedData = sectionConfig.defaultRole === 'all'
        ? data
        : data.filter((userData) => userData.user?.role?.toLowerCase() === sectionConfig.defaultRole.toLowerCase());

      setUsers(data);
      setFilteredUsers(scopedData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [sectionConfig.defaultRole]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);

        const token = authUser?.token || localStorage.getItem('token');
        if (!token || typeof token !== 'string') {
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

  // Filter users based on search term and filters
  useEffect(() => {
    let result = sectionConfig.defaultRole === 'all'
      ? users
      : users.filter((userData) => userData.user?.role?.toLowerCase() === sectionConfig.defaultRole.toLowerCase());

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(userData => {
        const user = userData.user;
        if (!user) return false;

        return (
          user.name?.toLowerCase().includes(lowerSearch) ||
          user.firstName?.toLowerCase().includes(lowerSearch) ||
          user.lastName?.toLowerCase().includes(lowerSearch) ||
          user.email?.toLowerCase().includes(lowerSearch) ||
          user.phone?.includes(searchTerm) ||
          user.role?.toLowerCase().includes(lowerSearch) ||
          user._id?.toLowerCase().includes(lowerSearch)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(userData => userData.user?.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(userData => userData.user?.role?.toLowerCase() === roleFilter.toLowerCase());
    }

    setFilteredUsers(result);
    setCurrentPage(1);
  }, [users, searchTerm, statusFilter, roleFilter, sectionConfig.defaultRole]);

  const scopedUsers = sectionConfig.defaultRole === 'all'
    ? users
    : users.filter((userData) => userData.user?.role?.toLowerCase() === sectionConfig.defaultRole.toLowerCase());

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: string = 'Inactive') => {
    const norm = status?.toLowerCase();
    const isAct = norm === 'active';
    const isPend = norm === 'pending';
    const isSusp = norm === 'suspended';

    const color = isAct 
      ? 'bg-green-100 text-green-800'
      : isPend
        ? 'bg-yellow-100 text-yellow-800'
        : isSusp
          ? 'bg-red-100 text-red-800'
          : 'bg-gray-100 text-gray-800';

    const Icon = isAct ? CheckCircle : isPend ? Shield : XCircle;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        <Icon size={12} className="mr-1" />
        {status || 'Inactive'}
      </span>
    );
  };

  const getRoleBadge = (role: string = 'user') => {
    const roleColors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      student: 'bg-blue-100 text-blue-800',
      store: 'bg-amber-100 text-amber-800',
      agent: 'bg-emerald-100 text-emerald-800',
      teacher: 'bg-orange-100 text-orange-800',
      staff: 'bg-indigo-100 text-indigo-800',
      parent: 'bg-pink-100 text-pink-800',
      school: 'bg-cyan-100 text-cyan-800'
    };

    const normRole = role?.toLowerCase() || 'user';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${roleColors[normRole] || 'bg-gray-100 text-gray-800'}`}>
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
    return (first + last).toUpperCase() || user.name?.charAt(0)?.toUpperCase() || '?';
  };

  const escapeCsvValue = (value: unknown) => {
    const stringValue = String(value ?? '');
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const handleExport = () => {
    if (filteredUsers.length === 0) {
      alert('No user records available to export.');
      return;
    }

    const headers = ['User ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'School / Address', 'Date Joined'];
    const rows = filteredUsers.map((userData) => {
      const user = userData.user;
      const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'N/A';
      return [
        user?._id || '',
        displayName,
        user?.email || '',
        user?.phone || '',
        user?.role || '',
        user?.status || 'Inactive',
        user?.schoolAddress || user?.schoolName || '',
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
    const rolePrefix = sectionConfig.defaultRole === 'all' ? 'all-users' : sectionConfig.defaultRole;
    const dateStamp = new Date().toISOString().slice(0, 10);

    link.href = downloadUrl;
    link.download = `${rolePrefix}-${dateStamp}.csv`;
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
                  disabled={filteredUsers.length === 0}
                  className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Download size={16} className="mr-2 text-blue-600" />
                  Export CSV ({filteredUsers.length})
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
                      {scopedUsers.filter(u => u.user?.status?.toLowerCase() === 'active').length}
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
                      {scopedUsers.filter(u => u.user?.status?.toLowerCase() === 'pending').length}
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
                      {scopedUsers.filter(u => u.user?.status?.toLowerCase() === 'inactive' || !u.user?.status).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search users by name, email, phone, role, ID..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
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
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >
                      <option value="all">All Roles</option>
                      <option value="student">Student</option>
                      <option value="agent">Agent</option>
                      <option value="store">Store</option>
                      <option value="school">School</option>
                      <option value="parent">Parent</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
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
                          <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                                    <span className="text-white font-semibold text-sm">
                                      {getUserInitials(user)}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed User'}
                                  </div>
                                  <div className="text-xs text-gray-400">ID: {user._id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{user.email || 'No email'}</div>
                              {user.phone && (
                                <div className="text-xs text-gray-500 flex items-center mt-0.5">
                                  <Phone size={11} className="mr-1 text-gray-400" />
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
                              <div className="flex items-center text-xs">
                                <Calendar size={12} className="mr-1 text-gray-400" />
                                {formatDate(user.createdAt)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={(e) => handleMenuOpen(e, user)}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Open actions menu"
                                aria-label="Open actions menu"
                              >
                                <MoreVertical size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="text-gray-500">
                            <Users size={48} className="mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium text-gray-800">No users found</p>
                            <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar with Page Size Dropdown */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-semibold">{filteredUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{' '}
                      <span className="font-semibold">
                        {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                      </span> of{' '}
                      <span className="font-semibold">{filteredUsers.length}</span> users
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Rows per page:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded-md text-xs px-2 py-1 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={10}>10</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border text-gray-700 border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                            className={`px-3 py-1 border rounded-md text-sm transition ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ) : null;
                      })}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-gray-700 border border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Menu Dropdown */}
          {isMenuOpen && menuUser && (
            <>
              <div className="fixed inset-0 z-30" onClick={handleMenuClose} />
              <div
                className="fixed z-30 bg-white rounded-xl shadow-2xl py-2 w-56 border border-gray-200 text-left animate-in fade-in zoom-in-95 duration-150"
                style={{
                  top: Math.min(menuPosition.top, window.innerHeight - 240),
                  left: Math.min(menuPosition.left - 180, window.innerWidth - 240),
                }}
              >
                <button
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left font-medium transition-colors"
                  onClick={() => {
                    const u = menuUser;
                    handleMenuClose();
                    handleViewUser(u);
                  }}
                >
                  <User size={16} className="text-gray-500" />
                  View Details
                </button>

                <button
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left font-medium transition-colors"
                  onClick={() => handleViewTransactions(menuUser._id, menuUser.role)}
                >
                  <ArrowLeftRight size={16} className="text-gray-500" />
                  Transaction Info
                </button>

                {menuUser.email && (
                  <button
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left font-medium transition-colors"
                    onClick={() => handleResetPassword(menuUser.email)}
                  >
                    <Mail size={16} className="text-gray-500" />
                    Reset Password
                  </button>
                )}

                <div className="border-t border-gray-100 my-1" />

                <button
                  disabled={actionLoading === menuUser._id}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 ${
                    (menuUser.status || '').toLowerCase() === 'active' ? 'text-red-600' : 'text-green-600'
                  }`}
                  onClick={() => {
                    const u = menuUser;
                    const uRecord = u as unknown as Record<string, unknown>;
                    // Resolve best available ID across all user roles
                    const resolvedId =
                      u._id ||
                      (uRecord.id as string) ||
                      (uRecord.student_id as string) ||
                      (uRecord.store_id as string) ||
                      (uRecord.parent_id as string) ||
                      '';
                    handleMenuClose();
                    handleStatusToggle(resolvedId, u.status);
                  }}
                >
                  {actionLoading === menuUser._id ? (
                    'Updating...'
                  ) : (menuUser.status || '').toLowerCase() === 'active' ? (
                    <>
                      <XCircle size={16} />
                      Deactivate {menuUser.role ? menuUser.role.charAt(0).toUpperCase() + menuUser.role.slice(1) : 'Account'}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Activate {menuUser.role ? menuUser.role.charAt(0).toUpperCase() + menuUser.role.slice(1) : 'Account'}
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* User Details Modal */}
          {showUserModal && selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <h2 className="text-xl font-bold text-gray-900">
                    User Details
                  </h2>

                  <button
                    onClick={closeUserModal}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-white text-lg font-bold">
                        {getUserInitials(selectedUser)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {selectedUser.name || 'N/A'}
                      </h3>

                      <div className="mt-2">
                        {getRoleBadge(selectedUser.role)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        First Name
                      </label>
                      <p className="text-gray-900">
                        {selectedUser.firstName || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        Last Name
                      </label>
                      <p className="text-gray-900">
                        {selectedUser.lastName || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        Email
                      </label>
                      <p className="text-gray-900 break-all">
                        {selectedUser.email || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        Phone Number
                      </label>
                      <p className="text-gray-900">
                        {selectedUser.phone || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        Role
                      </label>
                      <p className="text-gray-900 capitalize">
                        {selectedUser.role || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        Status
                      </label>
                      <div className="mt-1">
                        {getStatusBadge(selectedUser.status)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        User ID
                      </label>
                      <p className="text-gray-900 break-all">
                        {selectedUser._id || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        Date Joined
                      </label>
                      <p className="text-gray-900">
                        {formatDate(selectedUser.createdAt)}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500">
                        School Address
                      </label>
                      <p className="text-gray-900">
                        {selectedUser.schoolAddress || 'N/A'}
                      </p>
                    </div>

                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                  <button
                    onClick={closeUserModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AllUsers;
