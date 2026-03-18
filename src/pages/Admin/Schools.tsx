import { useCallback, useEffect, useMemo, useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/Adminsidebar';
import AdminHeader from '../../components/AdminHeader';
import { getAgentsInStoreByAdmin, getAllSchools, getStoresInSchoolByAdmin, getStudentsInSchoolByAdmin } from '../../services';
import type { Store, StoreAgent, Student, School as AdminSchool, SchoolsResponse, StudentsInSchoolResponse } from '../../types';

type ResourceTab = 'students' | 'agents' | 'stores';
type AdminAgent = StoreAgent & { storeId?: string; storeName?: string; status?: string };

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
  const [storeFilter, setStoreFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<ResourceTab>('students');
  const [resources, setResources] = useState<SchoolResourceState>(EMPTY_RESOURCES);

  const getSchoolIdentifier = (school: AdminSchool) => school.schoolId || school.school_id || school._id || '';

  const getSchoolLabel = (school: AdminSchool) => school.schoolName || 'Unnamed School';

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
  }, [selectedSchoolId]);

  const fetchSchoolResources = useCallback(async (schoolId: string) => {
    if (!schoolId) {
      setResources(EMPTY_RESOURCES);
      return;
    }

    try {
      setDetailsLoading(true);

      const [studentsResponse, storesResponse] = await Promise.all([
        getStudentsInSchoolByAdmin(schoolId),
        getStoresInSchoolByAdmin(schoolId)
      ]);
      const students = (studentsResponse as StudentsInSchoolResponse).data ??
        (studentsResponse as StudentsInSchoolResponse).students ??
        [];

      const agentGroups = await Promise.all(
        storesResponse.map(async (store) => {
          const agents = await getAgentsInStoreByAdmin(store._id);
          return agents.map((agent) => ({
            ...agent,
            storeId: store._id,
            storeName: store.storeName || 'Unnamed Store',
            status: 'Active'
          }));
        })
      );

      setResources({
        students,
        agents: agentGroups.flat(),
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
    setResourceSearch('');
    setStoreFilter('all');
  }, [activeTab, selectedSchoolId]);

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

      if (statusFilter === 'all') return true;

      if (activeTab === 'agents') {
        return statusFilter === 'Active';
      }

      const itemStatus = (item as Student | Store).status || 'Active';
      return itemStatus === statusFilter;
    });
  }, [activeTab, currentItems, resourceSearch, statusFilter, storeFilter]);

  const statusOptions = useMemo(() => {
    if (activeTab === 'agents') {
      return ['all', 'Active'];
    }

    return ['all', 'Active', 'Inactive', 'Pending'];
  }, [activeTab]);

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
                      <h2 className="text-2xl font-bold text-gray-900">{getSchoolLabel(selectedSchool)}</h2>
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

                      {activeTab === 'agents' && (
                        <select
                          value={storeFilter}
                          onChange={(e) => setStoreFilter(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        >
                          <option value="all">All Stores</option>
                          {resources.stores.map((store) => (
                            <option key={store._id} value={store._id}>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {activeTab === 'students' && filteredItems.map((item) => {
                          const student = item as Student;
                          return (
                            <div key={student._id} className="border border-gray-200 rounded-xl p-4 bg-white">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-gray-900">{student.name}</p>
                                  <p className="text-sm text-gray-500">{student.email}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  student.status === 'Active'
                                    ? 'bg-green-100 text-green-700'
                                    : student.status === 'Pending'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {student.status}
                                </span>
                              </div>
                              <div className="mt-4 space-y-2 text-sm text-gray-600">
                                <p><span className="font-medium text-gray-800">Student ID:</span> {student.student_id || 'N/A'}</p>
                                <p><span className="font-medium text-gray-800">Class:</span> {student.Class || student.academicDetails?.classAdmittedTo || 'N/A'}</p>
                                <p><span className="font-medium text-gray-800">Phone:</span> {student.phone || 'N/A'}</p>
                              </div>
                            </div>
                          );
                        })}

                        {activeTab === 'agents' && filteredItems.map((item) => {
                          const agent = item as AdminAgent;
                          const fullName = agent.fullName || `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || 'Unnamed Agent';
                          return (
                            <div key={agent.id} className="border border-gray-200 rounded-xl p-4 bg-white">
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
                                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                                  Active
                                </span>
                              </div>
                              <div className="mt-4 space-y-2 text-sm text-gray-600">
                                <p><span className="font-medium text-gray-800">Phone:</span> {agent.phone || 'N/A'}</p>
                                <p><span className="font-medium text-gray-800">Role:</span> {agent.role || 'agent'}</p>
                                <p><span className="font-medium text-gray-800">Store:</span> {agent.storeName || 'N/A'}</p>
                                <p><span className="font-medium text-gray-800">School ID:</span> {agent.schoolId || 'N/A'}</p>
                              </div>
                            </div>
                          );
                        })}

                        {activeTab === 'stores' && filteredItems.map((item) => {
                          const store = item as Store;
                          return (
                            <div key={store._id} className="border border-gray-200 rounded-xl p-4 bg-white">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-gray-900">{store.storeName || 'Unnamed Store'}</p>
                                  <p className="text-sm text-gray-500">{store.email || 'No email'}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  store.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {store.status || 'Unknown'}
                                </span>
                              </div>
                              <div className="mt-4 space-y-2 text-sm text-gray-600">
                                <p><span className="font-medium text-gray-800">Type:</span> {store.storeType || 'N/A'}</p>
                                <p><span className="font-medium text-gray-800">Phone:</span> {store.phone || 'N/A'}</p>
                                <p><span className="font-medium text-gray-800">Location:</span> {store.location || 'N/A'}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
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
    </div>
  );
};

export default Schools;
