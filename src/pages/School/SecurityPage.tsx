import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import Footer from '../../components/Footer';
import {
  ShieldCheck,
  UserPlus,
  ClipboardCopy,
  Mail,
  Users,
  CheckCircle2,
  Clock3,
  XCircle,
  Info,
  Search,
} from 'lucide-react';
import { getSchoolSecurity, getUserDetails } from '../../services';
import type { SchoolProfile } from '../../types/student';
import type { SecurityUser, SnackbarState, User, UserResponse } from '../../types/user';

const SecurityPage: React.FC = () => {
  const authContext = useAuth();
  const token = authContext?.token || localStorage.getItem('token');
  const authToken = token;

  const [schoolId, setSchoolId] = useState<string>('');
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [registrationLink, setRegistrationLink] = useState<string>('');
  const [securityUsers, setSecurityUsers] = useState<SecurityUser[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [securityLoading, setSecurityLoading] = useState<boolean>(true);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchUserProfile = useCallback(async () => {
    if (!authToken) return;

    setLoading(true);

    try {
      const data: UserResponse = await getUserDetails();

      let userProfile: User | { data?: User; wallet?: { balance: number } } | UserResponse;

      if (data.user?.data) {
        userProfile = data.user.data;
      } else if (data.user) {
        userProfile = data.user;
      } else if (data.data) {
        userProfile = data.data;
      } else {
        userProfile = data;
      }

      const getId = (): string => {
        if (!userProfile || typeof userProfile !== 'object') return '';

        if ('schoolId' in userProfile) {
          return (userProfile as User).schoolId || '';
        }

        if ('data' in userProfile && userProfile.data && typeof userProfile.data === 'object' && 'schoolId' in userProfile.data) {
          return (userProfile.data as User).schoolId || '';
        }

        return '';
      };

      const getStringProp = (prop: keyof User, defaultValue: string = ''): string => {
        if (!userProfile || typeof userProfile !== 'object') return defaultValue;

        if (prop in userProfile) {
          const value = (userProfile as User)[prop];
          return typeof value === 'string' ? value : defaultValue;
        }

        if ('data' in userProfile && userProfile.data && typeof userProfile.data === 'object' && prop in userProfile.data) {
          const value = (userProfile.data as User)[prop];
          return typeof value === 'string' ? value : defaultValue;
        }

        return defaultValue;
      };

      const id = getId();
      const schoolName = getStringProp('schoolName', 'School');
      const schoolType = getStringProp('schoolType', 'secondary');
      const schoolAddress = getStringProp('schoolAddress', '');
      const ownership = getStringProp('ownership', 'private');
      const link = getStringProp('Link', '');

      setSchoolId(id);
      setSchoolProfile({
        schoolId: id,
        schoolName,
        schoolType,
        ownership,
        Link: link,
      });

      const params = new URLSearchParams();
      if (id) params.append('schoolId', id);
      params.append('schoolName', encodeURIComponent(schoolName));
      params.append('schoolType', encodeURIComponent(schoolType));
      if (schoolAddress) params.append('schoolAddress', encodeURIComponent(schoolAddress));

      setRegistrationLink(`${window.location.origin}/attendance/security/new?${params.toString()}`);
    } catch (error) {
      console.error('Profile fetch error:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to load school profile',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const fetchSecurityUsers = useCallback(async () => {
    if (!authToken) return;

    setSecurityLoading(true);

    try {
      const data = await getSchoolSecurity();
      const normalizedData = data.map((user, index) => ({
        ...user,
        _id: user._id || `${user.email || 'security'}-${index}`,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        name:
          user.name ||
          `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
          user.email ||
          'Unnamed Security',
        email: user.email || '',
        role: user.role || 'security',
        phone: user.phone || '',
        status: user.status || 'Pending',
      }));

      setSecurityUsers(normalizedData);
    } catch (error) {
      console.error('Security fetch error:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to load security users',
        severity: 'error',
      });
      setSecurityUsers([]);
    } finally {
      setSecurityLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchSecurityUsers();
  }, [fetchSecurityUsers]);

  useEffect(() => {
    if (!snackbar.open) return undefined;

    const timeout = window.setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, open: false }));
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [snackbar.open]);

  const handleCopyLink = useCallback(() => {
    if (!registrationLink) {
      setSnackbar({
        open: true,
        message: 'No security registration link available',
        severity: 'error',
      });
      return;
    }

    navigator.clipboard
      .writeText(registrationLink)
      .then(() =>
        setSnackbar({
          open: true,
          message: 'Security registration link copied to clipboard!',
          severity: 'success',
        })
      )
      .catch(() =>
        setSnackbar({
          open: true,
          message: 'Failed to copy security registration link',
          severity: 'error',
        })
      );
  }, [registrationLink]);

  const handleCreateSecurity = useCallback(() => {
    if (registrationLink) {
      window.location.href = registrationLink;
    } else {
      setSnackbar({
        open: true,
        message: 'School information is missing. Cannot generate registration link.',
        severity: 'error',
      });
    }
  }, [registrationLink]);

  const filteredSecurityUsers = securityUsers.filter((user) => {
    const name = (user.name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const phone = (user.phone || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    return name.includes(query) || email.includes(query) || phone.includes(query);
  });

  const activeCount = securityUsers.filter((user) => (user.status || '').toLowerCase() === 'active').length;
  const pendingCount = securityUsers.filter((user) => (user.status || '').toLowerCase() === 'pending').length;
  const inactiveCount = securityUsers.filter((user) => (user.status || '').toLowerCase() === 'inactive').length;

  const getStatusBadgeColor = (status: string = 'Pending') => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header PsettingsPage="/settings" />

      <div className="flex flex-grow">
        <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-0 bg-none">
          <Sidebar />
        </aside>

        <main className="flex-grow overflow-x-auto p-4 md:ml-64 md:p-8">
          <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
              <ShieldCheck className="h-7 w-7 text-indigo-600" />
              <span className="text-indigo-900">Security Management</span>
            </h1>

            <button
              onClick={handleCreateSecurity}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              <UserPlus className="h-5 w-5" />
              <span>Create Security</span>
            </button>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-gray-600 md:text-base">Total Security</p>
                  <p className="text-2xl font-bold text-gray-900 md:text-3xl">{securityUsers.length}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 md:h-12 md:w-12">
                  <Users className="h-5 w-5 text-blue-600 md:h-6 md:w-6" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-gray-600 md:text-base">Active Security</p>
                  <p className="text-2xl font-bold text-green-600 md:text-3xl">{activeCount}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 md:h-12 md:w-12">
                  <CheckCircle2 className="h-5 w-5 text-green-600 md:h-6 md:w-6" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-gray-600 md:text-base">Pending Security</p>
                  <p className="text-2xl font-bold text-amber-600 md:text-3xl">{pendingCount}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 md:h-12 md:w-12">
                  <Clock3 className="h-5 w-5 text-amber-600 md:h-6 md:w-6" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-gray-600 md:text-base">Inactive Security</p>
                  <p className="text-2xl font-bold text-red-600 md:text-3xl">{inactiveCount}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 md:h-12 md:w-12">
                  <XCircle className="h-5 w-5 text-red-600 md:h-6 md:w-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600 md:h-5 md:w-5" />
                <h2 className="text-base font-semibold text-gray-900 md:text-lg">
                  Security Registration Link
                </h2>
              </div>
              {schoolProfile && (
                <div className="text-sm text-gray-500">
                  {schoolProfile.schoolName}
                </div>
              )}
            </div>

            <div className="mt-4 flex w-full items-center gap-2">
              <div className="relative flex-1">
                <input
                  readOnly
                  value={registrationLink}
                  placeholder={loading ? 'Generating registration link...' : 'Registration link unavailable'}
                  title="Security registration link"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 focus:outline-none"
                />
              </div>
              <button
                onClick={handleCopyLink}
                className="rounded-lg bg-gray-100 p-2 transition-colors hover:bg-gray-200"
                title="Copy registration link"
                aria-label="Copy registration link"
              >
                <ClipboardCopy className="h-4 w-4 text-indigo-500 md:h-5 md:w-5" />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-indigo-600" />
                <h2 className="text-base font-semibold text-gray-900 md:text-lg">Registered Security</h2>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email or phone..."
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-800 focus:outline-none"
                />
              </div>
            </div>

            {securityLoading ? (
              <div className="py-10 text-center text-sm text-gray-600">Loading security users...</div>
            ) : filteredSecurityUsers.length === 0 ? (
              <div className="py-10 text-center">
                <Info className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="text-base font-medium text-gray-900">No security users found</p>
                <p className="mt-1 text-sm text-gray-600">
                  {securityUsers.length === 0
                    ? 'Start by creating your first security user.'
                    : 'Try adjusting your search.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredSecurityUsers.map((user) => (
                      <tr key={user._id}>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                        <td className="px-4 py-4 text-sm text-gray-700">{user.email || 'No email'}</td>
                        <td className="px-4 py-4 text-sm text-gray-700">{user.phone || 'N/A'}</td>
                        <td className="px-4 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
                            {user.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {schoolId && (
              <p className="mt-4 text-xs text-gray-500">Current school ID: {schoolId}</p>
            )}
          </div>
        </main>
      </div>

      <Footer />

      {snackbar.open && (
        <div
          className={`fixed bottom-4 right-4 z-[200] rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
            snackbar.severity === 'success'
              ? 'bg-green-600'
              : snackbar.severity === 'error'
                ? 'bg-red-600'
                : 'bg-blue-600'
          }`}
        >
          {snackbar.message}
        </div>
      )}
    </div>
  );
};

export default SecurityPage;
