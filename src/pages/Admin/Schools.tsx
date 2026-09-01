import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  Users,
  Store as StoreIcon,
  UserRound,
  Shield,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Mail,
  ArrowLeftRight,
  XCircle,
  X,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/Adminsidebar';
import AdminHeader from '../../components/AdminHeader';
import {
  getAgentsInStoreByAdmin,
  getAllSchools,
  getStoresInSchoolByAdmin,
  getStudentsInSchoolByAdmin,
  deactivateUser,
  activateUser,
  deactivateSchool,
  activateSchool,
  resetStorePassword,
  extractStudentName,
  extractStudentEmail
} from '../../services';
import type { Store, StoreAgent, Student, School as AdminSchool, SchoolsResponse, StudentsInSchoolResponse } from '../../types';

type ResourceTab = 'students' | 'agents' | 'stores';
type AdminAgent = Omit<StoreAgent, 'status'> & { storeId?: string; storeName?: string; status?: string };

interface SchoolResourceState {
  students: Student[];
  agents: AdminAgent[];
  stores: Store[];
}

const EMPTY_RESOURCES: SchoolResourceState = {
  students: [],
  agents: [],
  stores: []
};

const Schools = () => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const { user: authUser } = useAuth() ?? {};
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('schools');
  const [loading, setLoading] = useState(true);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [schools, setSchools] = useState<AdminSchool[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [resourceSearch, setResourceSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<ResourceTab>('students');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [resources, setResources] = useState<SchoolResourceState>(EMPTY_RESOURCES);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Action Menu State
  const [activeActionItem, setActiveActionItem] = useState<{ id: string; name: string; email?: string; status?: string; role: string } | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedResourceDetail, setSelectedResourceDetail] = useState<{
    role: string;
    name: string;
    email?: string;
    id: string;
    status?: string;
  } | null>(null);

  // Pop-up Toast State
  const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error' | 'info'; message: string }>({
    show: false,
    type: 'success',
    message: ''
  });

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setToast({ show: true, type, message });
  }, []);

  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.show]);

  // Confirmation Modal Pop-up State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: string;
    name: string;
    role: string;
    currentStatus: string;
    action: 'activate' | 'deactivate';
    loading: boolean;
  }>({
    isOpen: false,
    userId: '',
    name: '',
    role: '',
    currentStatus: '',
    action: 'activate',
    loading: false
  });

  const handleActionMenuOpen = (e: React.MouseEvent, item: { id: string; name: string; email?: string; status?: string; role: string }) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setActionMenuPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
    });
    setActiveActionItem(item);
    setIsActionMenuOpen(true);
  };

  const handleActionMenuClose = () => {
    setIsActionMenuOpen(false);
    setActiveActionItem(null);
  };

  const handleViewTransactions = (userId: string, role: string) => {
    handleActionMenuClose();
    navigate(`/admin/transactions?user=${encodeURIComponent(userId)}&role=${encodeURIComponent(role.toLowerCase())}`);
  };

  const handleResetPassword = async (email?: string) => {
    if (!email) {
      showToast('error', 'No email address available for this user.');
      return;
    }
    try {
      setActionLoading(email);
      await resetStorePassword(email);
      showToast('success', `Password reset instructions sent to ${email}`);
    } catch (error) {
      console.error('Error sending password reset:', error);
      showToast('error', 'Failed to send password reset email.');
    } finally {
      setActionLoading(null);
      handleActionMenuClose();
    }
  };

  const handleViewResourceDetails = (item: { id: string; name: string; email?: string; status?: string; role: string }) => {
    setSelectedResourceDetail({
      role: item.role,
      name: item.name,
      email: item.email,
      id: item.id,
      status: item.status || 'Unknown'
    });
  };

  const isItemActive = (item?: { status?: string } | Record<string, unknown> | null): boolean => {
    if (!item) return false;
    const record = item as Record<string, unknown>;
    const raw = String(
      record.status || record.storeStatus || record.userStatus || record.schoolStatus || ''
    ).toLowerCase().trim();

    if (
      raw === 'inactive' ||
      raw === 'deactive' ||
      raw === 'deactivated' ||
      raw === 'disabled'
    ) return false;
    if (raw === 'pending') return false;
    if (raw === 'active' || raw === 'activated' || raw === 'enabled') return true;

    const nestedUser = record.user && typeof record.user === 'object' ? record.user as Record<string, unknown> : undefined;
    if (nestedUser) {
      const nestedRaw = String(nestedUser.status || '').toLowerCase().trim();
      if (
        nestedRaw === 'inactive' ||
        nestedRaw === 'deactive' ||
        nestedRaw === 'deactivated' ||
        nestedRaw === 'disabled'
      ) return false;
      if (nestedRaw === 'active' || nestedRaw === 'activated') return true;
      if (nestedUser.isActive === false || nestedUser.is_active === false) return false;
      if (nestedUser.isActive === true || nestedUser.is_active === true) return true;
    }

    if (record.isActive === false || record.is_active === false || record.active === false) return false;
    if (record.isActive === true || record.is_active === true || record.active === true) return true;

    return true;
  };

  const openStatusToggleModal = (item: { id: string; name: string; role: string; status?: string }) => {
    handleActionMenuClose();
    if (!item.id) {
      showToast('error', 'User ID is missing. Cannot perform this action.');
      return;
    }
    const isCurrentlyActive = isItemActive(item);
    setConfirmModal({
      isOpen: true,
      userId: item.id,
      name: item.name,
      role: item.role,
      currentStatus: isCurrentlyActive ? 'Active' : 'Inactive',
      action: isCurrentlyActive ? 'deactivate' : 'activate',
      loading: false
    });
  };

  const handleConfirmStatusToggle = async () => {
    const { userId, action, role } = confirmModal;
    if (!userId) return;

    try {
      setConfirmModal((prev) => ({ ...prev, loading: true }));
      const nextStatus = action === 'activate' ? 'Active' : 'Inactive';

      if (role.toLowerCase() === 'school') {
        if (action === 'deactivate') {
          await deactivateSchool(userId);
        } else {
          await activateSchool(userId);
        }
      } else if (action === 'deactivate') {
        await deactivateUser(userId);
      } else {
        await activateUser(userId);
      }

      setResources((prev) => {
        const lowerRole = role.toLowerCase();
        if (lowerRole === 'student') {
          return {
            ...prev,
            students: prev.students.map((s) => {
              const sid = getStudentIdentifier(s);
              return sid === userId ? { ...s, status: nextStatus } : s;
            })
          };
        }
        if (lowerRole === 'agent') {
          return {
            ...prev,
            agents: prev.agents.map((a) => {
              const aid = getAgentIdentifier(a);
              return aid === userId ? { ...a, status: nextStatus } : a;
            })
          };
        }
        if (lowerRole === 'store') {
          return {
            ...prev,
            stores: prev.stores.map((st) => {
              const stid = getStoreIdentifier(st);
              return stid === userId ? { ...st, status: nextStatus } : st;
            })
          };
        }
        return prev;
      });

      if (role.toLowerCase() === 'school') {
        setSchools((prev) => prev.map((sch) => {
          const sId = getSchoolIdentifier(sch);
          return sId === userId ? { ...sch, schoolStatus: nextStatus } : sch;
        }));
      }

      setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
      showToast('success', `${role.charAt(0).toUpperCase() + role.slice(1)} account ${action}d successfully.`);
    } catch (error: unknown) {
      console.error(`Error ${action}ing account:`, error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errMsg = String(err?.response?.data?.message || err?.message || '');
      const isAlreadyTarget = errMsg.toLowerCase().includes('already inactive') || errMsg.toLowerCase().includes('already active');

      if (isAlreadyTarget) {
        const targetStatus = action === 'activate' ? 'Active' : 'Inactive';
        setResources((prev) => {
          const lowerRole = role.toLowerCase();
          if (lowerRole === 'student') {
            return {
              ...prev,
              students: prev.students.map((s) => {
                const sid = getStudentIdentifier(s);
                return sid === userId ? { ...s, status: targetStatus } : s;
              })
            };
          }
          if (lowerRole === 'agent') {
            return {
              ...prev,
              agents: prev.agents.map((a) => {
                const aid = getAgentIdentifier(a);
                return aid === userId ? { ...a, status: targetStatus } : a;
              })
            };
          }
          if (lowerRole === 'store') {
            return {
              ...prev,
              stores: prev.stores.map((st) => {
                const stid = getStoreIdentifier(st);
                return stid === userId ? { ...st, status: targetStatus } : st;
              })
            };
          }
          return prev;
        });

        if (role.toLowerCase() === 'school') {
          setSchools((prev) => prev.map((sch) => {
            const sId = getSchoolIdentifier(sch);
            return sId === userId ? { ...sch, schoolStatus: targetStatus } : sch;
          }));
        }

        setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        showToast('info', `${role.charAt(0).toUpperCase() + role.slice(1)} is already ${targetStatus.toLowerCase()}. Status updated.`);
      } else {
        setConfirmModal((prev) => ({ ...prev, loading: false }));
        showToast('error', errMsg || `Failed to ${action} account. Please try again.`);
      }
    }
  };

  const getSchoolIdentifier = (school: AdminSchool) => school.schoolId || school.school_id || school._id || '';

  const getSchoolLabel = (school: AdminSchool) => school.schoolName || 'Unnamed School';

  const getStoreIdentifier = (store: Store) => {
    const s = store as unknown as Record<string, unknown>;
    const candidateId =
      (s.storeId as string) ||
      (s.store_id as string) ||
      (s._id as string) ||
      (s.id as string) ||
      (s.userId as string) ||
      store._id ||
      '';

    if (candidateId.includes('/')) {
      const parts = candidateId.split('/');
      return parts[parts.length - 1] || '';
    }

    return candidateId;
  };

  const getAgentIdentifier = (agent: AdminAgent) => {
    const a = agent as unknown as Record<string, unknown>;
    const nestedUser = a.user && typeof a.user === 'object' ? a.user as Record<string, unknown> : undefined;
    // Only return a valid MongoDB ObjectId-like string; never fall back to email
    const candidateId =
      (a._id as string) ||
      (a.agentId as string) ||
      (a.agent_id as string) ||
      (a.userId as string) ||
      (a.user_id as string) ||
      (a.id as string) ||
      (agent.id as string) ||
      (nestedUser?._id as string) ||
      (nestedUser?.id as string) ||
      '';
    // Validate it looks like a MongoDB ObjectId (24 hex chars)
    const mongoIdPattern = /^[a-f\d]{24}$/i;
    if (mongoIdPattern.test(candidateId)) return candidateId;
    // Accept any non-empty string that isn't an email
    if (candidateId && !candidateId.includes('@')) return candidateId;
    return '';
  };

  const getStudentIdentifier = (student: Student) => {
    const s = student as unknown as Record<string, unknown>;
    return (
      (s.studentId as string) ||
      student._id ||
      (s.id as string) ||
      student.student_id ||
      (s.userId as string) ||
      ''
    );
  };

  const getStudentDisplayName = useCallback((student: Student) => {
    const extracted = extractStudentName(student as unknown as Record<string, unknown>);
    if (extracted && extracted !== 'Unknown Student') return extracted;
    return (
      student.fullName ||
      student.name ||
      `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
      student.email?.split('@')[0] ||
      'Unknown Student'
    );
  }, []);

  const getStudentPhotoUrl = useCallback((student: Student) => {
    const studentWithPhoto = student as Student & {
      profilePicture?: string;
      profilePics?: string;
    };
    const image = studentWithPhoto.profilePicture || studentWithPhoto.profilePics || '';

    if (!image) return '';
    if (image.startsWith('http')) return image;
    if (image.startsWith('/uploads/')) return `${API_URL}${image}`;

    return `${API_URL}/${image.replace(/^\/+/, '')}`;
  }, [API_URL]);

  const getStudentInitials = useCallback((student: Student) => {
    const parts = getStudentDisplayName(student).split(' ').filter(Boolean).slice(0, 2);
    if (parts.length === 0) return 'ST';
    return parts.map((part) => part[0]?.toUpperCase() || '').join('');
  }, [getStudentDisplayName]);



  const fetchSchools = useCallback(async () => {
    try {
      setSchoolsLoading(true);
      const response = await getAllSchools();
      const schoolUsers = (response as SchoolsResponse).data ?? (response as SchoolsResponse).schools ?? [];

      setSchools(schoolUsers);
    } catch (error) {
      console.error('Error fetching schools:', error);
      setSchools([]);
    } finally {
      setSchoolsLoading(false);
      setLoading(false);
    }
  }, []);

  const fetchSchoolResources = useCallback(async (schoolId: string) => {
    if (!schoolId) {
      setResources(EMPTY_RESOURCES);
      return;
    }

    try {
      setDetailsLoading(true);

      const [studentsResult, storesResult] = await Promise.allSettled([
        getStudentsInSchoolByAdmin(schoolId),
        getStoresInSchoolByAdmin(schoolId)
      ]);

      const studentsResponse = studentsResult.status === 'fulfilled' ? studentsResult.value : null;
      const storesResponse = storesResult.status === 'fulfilled' ? storesResult.value : [];

      const students = (studentsResponse as StudentsInSchoolResponse).data ??
        (studentsResponse as StudentsInSchoolResponse).students ??
        [];

      if (studentsResult.status === 'rejected') {
        console.error('Error fetching students for school:', studentsResult.reason);
      }

      if (storesResult.status === 'rejected') {
        console.error('Error fetching stores for school:', storesResult.reason);
      }

      const validStores = storesResponse.filter((store) => getStoreIdentifier(store));

      const agentGroups = await Promise.allSettled(
        validStores.map(async (store) => {
          const storeId = getStoreIdentifier(store);
          const agents = await getAgentsInStoreByAdmin(storeId);
          return agents.map((agent) => ({
            ...agent,
            storeId,
            storeName: store.storeName || 'Unnamed Store',
            // Preserve the status from the agent returned by the service — do NOT default to 'Active'
            status: (agent as AdminAgent).status ?? 'Active'
          }));
        })
      );

      const resolvedAgents = agentGroups.flatMap((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }

        console.error('Error fetching agents for store:', result.reason);
        return [];
      });

      setResources({
        students,
        agents: resolvedAgents,
        stores: storesResponse
      });
    } catch (error) {
      console.error('Error fetching school resources:', error);
      setResources(EMPTY_RESOURCES);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = authUser?.token || localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setSchoolsLoading(false);
      return;
    }

    fetchSchools();
  }, [authUser?.token, fetchSchools]);

  useEffect(() => {
    if (!selectedSchoolId) {
      setResources(EMPTY_RESOURCES);
      return;
    }

    fetchSchoolResources(selectedSchoolId);
  }, [selectedSchoolId, fetchSchoolResources]);

  useEffect(() => {
    setStatusFilter('all');
    setClassFilter('all');
    setResourceSearch('');
    setStoreFilter('all');
  }, [activeTab, selectedSchoolId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedSchoolId, resourceSearch, statusFilter, classFilter, storeFilter]);

  const filteredSchools = useMemo(() => {
    if (!schoolSearch.trim()) return schools;

    const query = schoolSearch.toLowerCase();
    return schools.filter((school) =>
      getSchoolLabel(school).toLowerCase().includes(query) ||
      school.schoolEmail?.toLowerCase().includes(query) ||
      school.schoolPhone?.toLowerCase().includes(query) ||
      getSchoolIdentifier(school).toLowerCase().includes(query)
    );
  }, [schoolSearch, schools]);

  const selectedSchool = useMemo(
    () => schools.find((school) => getSchoolIdentifier(school) === selectedSchoolId) ?? null,
    [schools, selectedSchoolId]
  );

  const tabItems = useMemo(() => {
    return {
      students: resources.students,
      agents: resources.agents,
      stores: resources.stores
    };
  }, [resources]);

  const currentItems = tabItems[activeTab];

  const filteredItems = useMemo(() => {
    const query = resourceSearch.toLowerCase().trim();

    return currentItems.filter((item) => {
      const matchesSearch = (() => {
        if (!query) return true;

        if (activeTab === 'students') {
          const student = item as Student;
          return [
            student.name,
            student.email,
            student.phone,
            student.student_id,
            (student as unknown as { user?: { id?: string } }).user?.id,
            student.guardian?.fullName,
            student.guardian?.email,
            student.Class,
            student.academicDetails?.classAdmittedTo
          ].some((value) => String(value || '').toLowerCase().includes(query));
        }

        if (activeTab === 'agents') {
          const agent = item as AdminAgent;
          return [
            agent.fullName,
            `${agent.firstName || ''} ${agent.lastName || ''}`.trim(),
            agent.email,
            agent.phone,
            agent.role,
            agent.storeName
          ].some((value) => String(value || '').toLowerCase().includes(query));
        }

        const store = item as Store;
        return [
          store.storeName,
          store.email,
          store.phone,
          store.location,
          store.storeType
        ].some((value) => String(value || '').toLowerCase().includes(query));
      })();

      if (!matchesSearch) return false;

      if (activeTab === 'agents' && storeFilter !== 'all') {
        const agent = item as AdminAgent;
        if (agent.storeId !== storeFilter) return false;
      }

      if (activeTab === 'students') {
        if (classFilter === 'all') return true;

        const student = item as Student;
        const studentClass = student.Class || student.academicDetails?.classAdmittedTo || 'N/A';
        return studentClass === classFilter;
      }

      if (statusFilter === 'all') return true;

      if (activeTab === 'agents') {
        return statusFilter === 'Active';
      }

      const itemStatus = (item as Student | Store).status || 'Active';
      return itemStatus === statusFilter;
    });
  }, [activeTab, currentItems, resourceSearch, statusFilter, classFilter, storeFilter]);

  const classOptions = useMemo(() => {
    if (activeTab !== 'students') return [];

    return [
      'all',
      ...Array.from(
        new Set(
          resources.students
            .map((student) => student.Class || student.academicDetails?.classAdmittedTo || 'N/A')
            .filter(Boolean)
        )
      ).sort()
    ];
  }, [activeTab, resources.students]);

  const statusOptions = useMemo(() => {
    if (activeTab === 'agents') {
      return ['all', 'Active'];
    }

    return ['all', 'Active', 'Inactive', 'Pending'];
  }, [activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredItems, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const stats = useMemo(() => ({
    students: resources.students.length,
    agents: resources.agents.length,
    stores: resources.stores.length
  }), [resources]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="m-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!selectedSchool) {
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">School Management</h1>
                  <p className="text-gray-600 mt-1">Select a school to view its students, agents, and stores.</p>
                </div>
                <div className="mt-4 sm:mt-0 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Schools</p>
                  <p className="text-2xl font-bold text-gray-900">{schools.length}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-black"
                    placeholder="Search schools..."
                    value={schoolSearch}
                    onChange={(e) => setSchoolSearch(e.target.value)}
                  />
                </div>
              </div>

              {schoolsLoading && (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
                </div>
              )}

              {!schoolsLoading && filteredSchools.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-12">No schools found.</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSchools.map((school) => {
                  const schoolId = getSchoolIdentifier(school);
                  return (
                    <button
                      key={schoolId}
                      type="button"
                      onClick={() => setSelectedSchoolId(schoolId)}
                      className="bg-white border border-gray-200 rounded-lg p-5 text-left hover:border-blue-400 hover:shadow-md transition-all duration-200 group shadow-sm"
                    >
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-white font-bold text-lg overflow-hidden bg-blue-600">
                        {school.logo ? (
                          <img src={school.logo} alt={getSchoolLabel(school)} className="w-full h-full object-cover" />
                        ) : (
                          getSchoolLabel(school).charAt(0).toUpperCase()
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors leading-snug mb-1">
                        {getSchoolLabel(school)}
                      </h3>
                      {school.schoolEmail && (
                        <p className="text-xs text-gray-400 truncate">{school.schoolEmail}</p>
                      )}
                      {school.schoolAddress && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{school.schoolAddress}</p>
                      )}
                      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600">
                        View School
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </main>
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
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSchoolId('')}
                  className="text-gray-400 hover:text-gray-700 transition p-1.5 rounded-lg hover:bg-gray-100 border border-gray-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{getSchoolLabel(selectedSchool)}</h1>
                  <p className="text-gray-600 mt-1">View students, agents, and stores attached to this school.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Schools</p>
                  <p className="text-2xl font-bold text-gray-900">{schools.length}</p>
                </div>
              </div>
            </div>
            <section className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <Building2 className="w-5 h-5" />
                        <span className="font-medium">Selected School</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-gray-900">{getSchoolLabel(selectedSchool)}</h2>
                        <button
                          type="button"
                          onClick={(e) => handleActionMenuOpen(e, {
                            id: getSchoolIdentifier(selectedSchool),
                            name: getSchoolLabel(selectedSchool),
                            email: selectedSchool.schoolEmail,
                            status: selectedSchool.schoolStatus === 'Active' ? 'Active' : 'Inactive',
                            role: 'school'
                          })}
                          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title="School actions"
                          aria-label="School actions"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </div>
                      <p className="text-gray-600 mt-1">{selectedSchool.schoolEmail || 'No email available'}</p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                          ID: {getSchoolIdentifier(selectedSchool)}
                        </span>
                        {selectedSchool.schoolPhone && (
                          <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                            {selectedSchool.schoolPhone}
                          </span>
                        )}
                        <span className={`text-xs px-3 py-1 rounded-full ${
                          selectedSchool.schoolStatus === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {selectedSchool.schoolStatus || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 min-w-[280px]">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-xs text-blue-700">Students</p>
                        <p className="text-2xl font-bold text-blue-900">{stats.students}</p>
                      </div>
                      <div className="bg-cyan-50 rounded-lg p-4">
                        <p className="text-xs text-cyan-700">Agents</p>
                        <p className="text-2xl font-bold text-cyan-900">{stats.agents}</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-4">
                        <p className="text-xs text-amber-700">Stores</p>
                        <p className="text-2xl font-bold text-amber-900">{stats.stores}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'students' as const, label: 'Students', icon: Users, count: stats.students },
                        { id: 'agents' as const, label: 'Agents', icon: Shield, count: stats.agents },
                        { id: 'stores' as const, label: 'Stores', icon: StoreIcon, count: stats.stores }
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-blue-500' : 'bg-white'}`}>
                              {tab.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={resourceSearch}
                          onChange={(e) => setResourceSearch(e.target.value)}
                          placeholder={`Search ${activeTab}`}
                          className="w-full sm:w-64 pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>

                      {activeTab === 'students' ? (
                        <select
                          value={classFilter}
                          onChange={(e) => setClassFilter(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        >
                          {classOptions.map((option) => (
                            <option key={option} value={option}>
                              {option === 'all' ? 'All Classes' : option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        >
                          {statusOptions.map((option) => (
                            <option key={option} value={option}>
                              {option === 'all' ? 'All Statuses' : option}
                            </option>
                          ))}
                        </select>
                      )}

                      {activeTab === 'agents' && (
                        <select
                          value={storeFilter}
                          onChange={(e) => setStoreFilter(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        >
                          <option value="all">All Stores</option>
                          {resources.stores.map((store) => (
                            <option key={getStoreIdentifier(store)} value={getStoreIdentifier(store)}>
                              {store.storeName || 'Unnamed Store'}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    {detailsLoading ? (
                      <div className="py-12 text-center text-gray-500">Loading school data...</div>
                    ) : filteredItems.length === 0 ? (
                      <div className="py-12 text-center text-gray-500">
                        No {activeTab} found for this school with the current filters.
                      </div>
                    ) : (
                      <>
                        {activeTab === 'students' && (
                          <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student Name</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Adm No</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Guardian</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Class</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {paginatedItems.map((item) => {
                                  const student = item as Student;
                                  return (
                                    <tr key={student._id} className="hover:bg-gray-50">
                                      <td className="px-4 py-3">
                                        <div className="flex min-w-[240px] items-center gap-3">
                                          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-blue-100">
                                            {getStudentPhotoUrl(student) ? (
                                              <img
                                                src={getStudentPhotoUrl(student)}
                                                alt={getStudentDisplayName(student)}
                                                className="h-full w-full object-cover"
                                              />
                                            ) : (
                                              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-blue-700">
                                                {getStudentInitials(student)}
                                              </div>
                                            )}
                                          </div>
                                          <div className="text-sm font-medium text-gray-900">
                                            {getStudentDisplayName(student)}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-700">
                                        {student.admissionNumber || '—'}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-700">{extractStudentEmail(student as unknown as Record<string, unknown>) || student.email || '—'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-700">
                                        {(student.guardianName || student.guardian?.fullName) ? (
                                          <div className="space-y-0.5">
                                            <p className="font-medium text-gray-900">
                                              {student.guardianName || student.guardian?.fullName}
                                            </p>
                                            {(student.guardianEmail || student.guardian?.email) && (
                                              <p className="text-gray-600 text-xs">
                                                {student.guardianEmail || student.guardian?.email}
                                              </p>
                                            )}
                                          </div>
                                        ) : (
                                          '—'
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-700">
                                        {student.Class || student.academicDetails?.classAdmittedTo || 'N/A'}
                                      </td>
                                      <td className="px-4 py-3 text-sm">
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                          isItemActive(student)
                                            ? 'bg-green-100 text-green-700'
                                            : student.status?.toLowerCase() === 'pending'
                                              ? 'bg-yellow-100 text-yellow-700'
                                              : 'bg-gray-100 text-gray-700'
                                        }`}>
                                          {isItemActive(student) ? 'Active' : (student.status || 'Inactive')}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-right">
                                        <button
                                          type="button"
                                          onClick={(e) => handleActionMenuOpen(e, {
                                            id: getStudentIdentifier(student),
                                            name: getStudentDisplayName(student),
                                            email: extractStudentEmail(student as unknown as Record<string, unknown>) || student.email,
                                            status: isItemActive(student) ? 'Active' : (student.status || 'Inactive'),
                                            role: 'student'
                                          })}
                                          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                          title="Open actions menu"
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {activeTab === 'agents' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {paginatedItems.map((item) => {
                              const agent = item as AdminAgent;
                              const fullName = agent.fullName || `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || 'Unnamed Agent';
                              const agentId = getAgentIdentifier(agent);
                              const isActive = isItemActive(agent);

                              return (
                                <div key={agentId} className="border border-gray-200 rounded-xl p-4 bg-white flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center">
                                          <UserRound className="w-5 h-5" />
                                        </div>
                                        <div>
                                          <p className="font-semibold text-gray-900">{fullName}</p>
                                          <p className="text-sm text-gray-500">{agent.email || 'No email'}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                          isActive
                                            ? 'bg-green-100 text-green-700'
                                            : agent.status === 'Pending' || agent.status === 'pending'
                                              ? 'bg-yellow-100 text-yellow-700'
                                              : 'bg-gray-100 text-gray-700'
                                        }`}>
                                          {isActive ? 'Active' : (agent.status || 'Inactive')}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => handleActionMenuOpen(e, {
                                            id: agentId,
                                            name: fullName,
                                            email: agent.email,
                                            status: isActive ? 'Active' : (agent.status || 'Inactive'),
                                            role: 'agent'
                                          })}
                                          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                                          title="Actions"
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                                      <p><span className="font-medium text-gray-800">Phone:</span> {agent.phone || 'N/A'}</p>
                                      <p><span className="font-medium text-gray-800">Role:</span> {agent.role || 'agent'}</p>
                                      <p><span className="font-medium text-gray-800">Store:</span> {agent.storeName || 'N/A'}</p>
                                      <p><span className="font-medium text-gray-800">School ID:</span> {agent.schoolId || 'N/A'}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {activeTab === 'stores' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {paginatedItems.map((item) => {
                              const store = item as Store;
                              const storeId = getStoreIdentifier(store);
                              const isActive = isItemActive(store);

                              return (
                                <div key={storeId} className="border border-gray-200 rounded-xl p-4 bg-white flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="font-semibold text-gray-900">{store.storeName || 'Unnamed Store'}</p>
                                        <p className="text-sm text-gray-500">{store.email || 'No email'}</p>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                          isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                          {isActive ? 'Active' : (store.status || 'Inactive')}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => handleActionMenuOpen(e, {
                                            id: storeId,
                                            name: store.storeName || 'Store',
                                            email: store.email,
                                            status: isActive ? 'Active' : 'Inactive',
                                            role: 'store'
                                          })}
                                          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                                          title="Actions"
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                                      <p><span className="font-medium text-gray-800">Type:</span> {store.storeType || 'N/A'}</p>
                                      <p><span className="font-medium text-gray-800">Phone:</span> {store.phone || 'N/A'}</p>
                                      <p><span className="font-medium text-gray-800">Location:</span> {store.location || 'N/A'}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Action Menu Dropdown */}
                        {isActionMenuOpen && activeActionItem && (() => {
                          const isCurrentlyActive = isItemActive(activeActionItem);
                          return (
                            <>
                              <div className="fixed inset-0 z-30" onClick={handleActionMenuClose} />
                              <div
                                className="fixed z-30 bg-white rounded-xl shadow-2xl py-2 w-56 border border-gray-200 text-left animate-in fade-in zoom-in-95 duration-150"
                                style={{
                                  top: Math.min(actionMenuPosition.top, window.innerHeight - 220),
                                  left: Math.min(actionMenuPosition.left - 180, window.innerWidth - 240),
                                }}
                              >
                                <button
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left font-medium transition-colors"
                                  onClick={() => handleViewTransactions(activeActionItem.id, activeActionItem.role)}
                                >
                                  <ArrowLeftRight size={16} className="text-gray-500" />
                                  Transaction Info
                                </button>

                                {activeActionItem.email && (
                                  <button
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => handleResetPassword(activeActionItem.email)}
                                    disabled={actionLoading === activeActionItem.email}
                                  >
                                    <Mail size={16} className="text-gray-500" />
                                    {actionLoading === activeActionItem.email ? 'Sending reset...' : 'Reset Password'}
                                  </button>
                                )}

                                <div className="border-t border-gray-100 my-1" />

                                {activeActionItem.role !== 'school' && (
                                  <button
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left font-medium transition-colors"
                                    onClick={() => {
                                      handleActionMenuClose();
                                      handleViewResourceDetails(activeActionItem);
                                    }}
                                  >
                                    <Info size={16} className="text-gray-500" />
                                    View Details
                                  </button>
                                )}

                                {activeActionItem.role === 'school' && (
                                  <button
                                    className={`flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left font-medium hover:bg-gray-50 transition-colors ${
                                      isCurrentlyActive ? 'text-red-600' : 'text-green-600'
                                    }`}
                                    onClick={() => openStatusToggleModal(activeActionItem)}
                                  >
                                    {isCurrentlyActive ? (
                                      <>
                                        <XCircle size={16} />
                                        Deactivate {activeActionItem.role ? activeActionItem.role.charAt(0).toUpperCase() + activeActionItem.role.slice(1) : 'Account'}
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle size={16} />
                                        Activate {activeActionItem.role ? activeActionItem.role.charAt(0).toUpperCase() + activeActionItem.role.slice(1) : 'Account'}
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </div>

                  {!detailsLoading && filteredItems.length > 0 && (
                    <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-700">
                          Showing <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                          <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredItems.length)}</span> of{' '}
                          <span className="font-semibold">{filteredItems.length}</span> {activeTab}
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
                            type="button"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                                type="button"
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
                            type="button"
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-gray-700 border border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-700" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Active Records</p>
                        <p className="text-xl font-bold text-gray-900">
                          {[
                            ...resources.students.filter((item) => item.status === 'Active'),
                            ...resources.stores.filter((item) => item.status === 'Active'),
                            ...resources.agents
                          ].length}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-yellow-700" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Pending Students</p>
                        <p className="text-xl font-bold text-gray-900">
                          {resources.students.filter((item) => item.status === 'Pending').length}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Current School Scope</p>
                        <p className="text-xl font-bold text-gray-900">{selectedSchool ? getSchoolLabel(selectedSchool) : 'None'}</p>
                      </div>
                    </div>
                  </div>
                </div>
            </section>
          </div>
        </main>
      </div>

      {selectedResourceDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-600">
                <Info className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 capitalize">
                  {selectedResourceDetail.role} Details
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Information for <span className="font-semibold text-gray-900">{selectedResourceDetail.name}</span>
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Name</p>
                <p className="mt-1 font-semibold text-gray-900">{selectedResourceDetail.name}</p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                <p className="mt-1 font-semibold text-gray-900">{selectedResourceDetail.status}</p>
              </div>
              {selectedResourceDetail.email && (
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Email</p>
                  <p className="mt-1 font-semibold text-gray-900 break-all">{selectedResourceDetail.email}</p>
                </div>
              )}
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">ID</p>
                <p className="mt-1 font-semibold text-gray-900 break-all">{selectedResourceDetail.id}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedResourceDetail(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Pop-up */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  confirmModal.action === 'deactivate' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}
              >
                {confirmModal.action === 'deactivate' ? <XCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 capitalize">
                  {confirmModal.action} {confirmModal.role} Account
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to <span className="font-semibold">{confirmModal.action}</span> the account for{' '}
                  <span className="font-semibold text-gray-900">{confirmModal.name}</span>?
                </p>
                {confirmModal.action === 'deactivate' ? (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg mt-3 border border-red-100">
                    This user will temporarily lose access to their account until reactivated.
                  </p>
                ) : (
                  <p className="text-xs text-green-700 bg-green-50 p-2.5 rounded-lg mt-3 border border-green-100">
                    This user will immediately regain full access to their account.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={confirmModal.loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusToggle}
                disabled={confirmModal.loading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50 ${
                  confirmModal.action === 'deactivate'
                    ? 'bg-red-600 hover:bg-red-700 shadow-sm shadow-red-200'
                    : 'bg-green-600 hover:bg-green-700 shadow-sm shadow-green-200'
                }`}
              >
                {confirmModal.loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Confirm {confirmModal.action === 'activate' ? 'Activation' : 'Deactivation'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Pop-up Notification */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
          <div
            className={`flex items-start gap-3 p-4 rounded-xl shadow-xl border ${
              toast.type === 'success'
                ? 'bg-white border-green-200 text-green-900 shadow-green-100/50'
                : toast.type === 'error'
                ? 'bg-white border-red-200 text-red-900 shadow-red-100/50'
                : 'bg-white border-blue-200 text-blue-900 shadow-blue-100/50'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="flex-1 text-sm font-medium text-gray-800">{toast.message}</div>
            <button
              type="button"
              onClick={() => setToast((prev) => ({ ...prev, show: false }))}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schools;
