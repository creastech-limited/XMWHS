import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import Footer from '../components/Footer';
import {
  PlusIcon,
  SearchIcon,
  ClipboardCopyIcon,
  UserIcon,
  MailIcon,
  DownloadIcon,
  MoreVerticalIcon,
  SchoolIcon,
  GraduationCapIcon,
  UsersIcon,
  BookOpenIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from 'lucide-react';

// Updated TypeScript interfaces
interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  academicDetails: {
    classAdmittedTo: string;
  };
  status: string;
  createdAt: string;
  classAdmittedTo?: string; // For backward compatibility
}

interface Class {
  _id: string;
  className: string;
  section: string;
  schoolId: string;
  students: string[];
  createdAt: string;
  updatedAt: string;
}

interface SchoolProfile {
  _id: string;
  schoolName: string;
  schoolType: string;
  ownership: string;
  Link: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const StudentPage: React.FC = () => {
  const authContext = useAuth();
  const token = authContext?.token || localStorage.getItem('token');
  const authToken = token || localStorage.getItem('token');

  const [schoolId, setSchoolId] = useState<string>('');
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(
    null
  );
  const [registrationLink, setRegistrationLink] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [classesLoading, setClassesLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [menuStudent, setMenuStudent] = useState<Student | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });

  const API_BASE_URL =
    import.meta.env.VITE_API_URL || 'https://nodes-staging-xp.up.railway.app';
  const rowsPerPage = 10;

  // Fetch user profile to get schoolLink and schoolId
  useEffect(() => {
    if (!authToken) return;

    fetch(`${API_BASE_URL}/api/users/getuserone`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch user profile');
        return res.json();
      })
      .then((data) => {
        const profile = data.user;
        const userProfile = profile.data;
        const id = userProfile._id;
        setSchoolId(id);
        setSchoolProfile({
          _id: id,
          schoolName: userProfile.schoolName || 'School',
          schoolType: userProfile.schoolType || 'secondary',
          ownership: userProfile.ownership || 'private',
          Link: profile.Link || '',
        });

        // Construct the full registration link
        const linkPath = profile.Link || '';
        const fullLink = `${window.location.origin}/students/new${linkPath}`;
        setRegistrationLink(fullLink);
      })
      .catch((err) => {
        console.error(err);
        setSnackbar({ open: true, message: err.message, severity: 'error' });
      });
  }, [authToken, API_BASE_URL]);

  // Fetch classes for this school
  useEffect(() => {
    if (!authToken || !schoolId) return;

    setClassesLoading(true);
    fetch(`${API_BASE_URL}/api/users/getclasse`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch classes');
        return res.json();
      })
      .then((data) => {
        if (data.status && Array.isArray(data.data)) {
          // Filter classes that belong to this school
          const schoolClasses = data.data.filter(
            (cls: Class) => cls.schoolId === schoolId
          );
          setClasses(schoolClasses);
        } else {
          console.error('Unexpected classes data format:', data);
          setClasses([]);
        }
        setClassesLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setSnackbar({
          open: true,
          message: 'Failed to load classes: ' + err.message,
          severity: 'error',
        });
        setClassesLoading(false);
      });
  }, [authToken, schoolId, API_BASE_URL]);

  // Fetch students for this schoolId
  useEffect(() => {
    if (!authToken || !schoolId) return;

    setLoading(true);
    fetch(
      `${API_BASE_URL}/api/users/getstudentbyid?id=${encodeURIComponent(
        schoolId
      )}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch students');
        return res.json();
      })
      .then((data) => {
        let studentArray: Student[] = [];
        if (data && Array.isArray(data.data)) {
          studentArray = data.data.map((student: Student) => ({
            _id: student._id, // For backward compatibility
            firstName: student.firstName,
            lastName: student.lastName,
            name: student.name || `${student.firstName} ${student.lastName}`,
            email: student.email,
            academicDetails: student.academicDetails || { classAdmittedTo: '' },
            classAdmittedTo:
              student.academicDetails?.classAdmittedTo || 'Not Assigned',
            status: student.status,
            createdAt: student.createdAt,
          }));
        } else {
          console.error('Unexpected students data format:', data);
        }

        setStudents(studentArray);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setSnackbar({
          open: true,
          message: 'Failed to load student data: ' + err.message,
          severity: 'error',
        });
        setLoading(false);
      });
  }, [authToken, schoolId, API_BASE_URL]);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      s.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesGrade =
      gradeFilter === 'all' ||
      s.classAdmittedTo === gradeFilter ||
      (gradeFilter === 'Not Assigned' && !s.classAdmittedTo);
    return matchesSearch && matchesStatus && matchesGrade;
  });

  const paginatedStudents = filteredStudents.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );
  const pageCount = Math.ceil(filteredStudents.length / rowsPerPage);

  const getStatusBadgeColor = (status: string): string => {
    switch (status?.toLowerCase()) {
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

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'inactive':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getSchoolTypeIcon = (schoolType: string) => {
    switch (schoolType?.toLowerCase()) {
      case 'primary':
        return <BookOpenIcon className="h-5 w-5 text-blue-600" />;
      case 'secondary':
        return <GraduationCapIcon className="h-5 w-5 text-purple-600" />;
      case 'tertiary':
        return <SchoolIcon className="h-5 w-5 text-green-600" />;
      default:
        return <SchoolIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleCopyLink = () => {
    if (!registrationLink) return;
    navigator.clipboard
      .writeText(registrationLink)
      .then(() =>
        setSnackbar({
          open: true,
          message: 'Registration link copied to clipboard!',
          severity: 'success',
        })
      )
      .catch(() =>
        setSnackbar({
          open: true,
          message: 'Failed to copy link',
          severity: 'error',
        })
      );
  };

  const handleMenuOpen = (e: React.MouseEvent, student: Student) => {
    e.preventDefault();
    setMenuStudent(student);
    setMenuPosition({ top: e.clientY, left: e.clientX });
    setIsMenuOpen(true);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
    setMenuStudent(null);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get unique classes from both classes API and student records
  const availableClasses = [
    ...new Set(
      [
        ...classes.map((cls) => cls.className),
        ...students.map((student) => student.classAdmittedTo),
      ].filter(
        (className) =>
          className && className.trim() !== '' && className !== 'Not Assigned'
      )
    ),
  ].sort();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-grow">
        <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-0 bg-none">
          <Sidebar />
        </aside>
        <main className="flex-grow p-4 md:p-8 md:ml-64 overflow-x-auto">
          {/* Title & Add Button */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <UsersIcon className="h-7 w-7 text-indigo-600" />
              <span className="text-indigo-900">Student Management</span>
            </h1>
            <button
              onClick={() => {
                if (registrationLink) {
                  window.location.href = registrationLink;
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
              <PlusIcon className="h-5 w-5" />
              <span>Add New Student</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm md:text-base text-gray-600 font-medium mb-1">
                    Total Students
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">
                    {students.length}
                  </p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg">
                  <UsersIcon className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm md:text-base text-gray-600 font-medium mb-1">
                    Active Students
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-green-600">
                    {
                      students.filter(
                        (s) => s.status.toLowerCase() === 'active'
                      ).length
                    }
                  </p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm md:text-base text-gray-600 font-medium mb-1">
                    Total Classes
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-purple-600">
                    {classes.length}
                  </p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg">
                  <BookOpenIcon className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm md:text-base text-gray-600 font-medium mb-1">
                    Pending Students
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-yellow-600">
                    {
                      students.filter(
                        (s) => s.status.toLowerCase() === 'pending'
                      ).length
                    }
                  </p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-yellow-100 rounded-lg">
                  <ClockIcon className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* School Classes Overview */}
          {!classesLoading && classes.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm mb-6 md:mb-8 p-4 md:p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                {getSchoolTypeIcon(schoolProfile?.schoolType || 'secondary')}
                <h2 className="text-base md:text-lg font-semibold text-gray-900">
                  Classes Overview
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                {classes.map((cls) => {
                  const studentCount = students.filter(
                    (s) => s.classAdmittedTo === cls.className
                  ).length;
                  return (
                    <div
                      key={cls._id}
                      className="bg-gray-50 rounded-lg p-3 md:p-4 text-center hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {cls.className}
                      </div>
                      <div className="text-xs text-gray-500 mb-1 md:mb-2">
                        Section {cls.section}
                      </div>
                      <div className="text-base md:text-lg font-bold text-blue-600">
                        {studentCount}
                      </div>
                      <div className="text-xs text-gray-500">students</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Registration Link Card */}
          <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100 ">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <MailIcon className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                <h2 className="text-base md:text-lg font-semibold text-gray-900">
                  Student Registration Link
                </h2>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 w-full">
              <div className="flex-1 relative">
                <input
                  readOnly
                  value={registrationLink}
                  placeholder="Generating registration link..."
                  title="Student registration link"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm focus:outline-none font-medium"
                />
              </div>
              <button
                onClick={handleCopyLink}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Copy registration link"
                aria-label="Copy registration link"
              >
                <ClipboardCopyIcon className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by store name or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-800"
                />
              </div>

              <div>
                <label htmlFor="statusFilter" className="sr-only">
                  Filter by status
                </label>
                <select
                  id="statusFilter"
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base text-gray-700 font-medium bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label htmlFor="gradeFilter" className="sr-only">
                  Filter by class
                </label>
                <select
                  id="gradeFilter"
                  aria-label="Filter by class"
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base text-gray-700 font-medium bg-white"
                >
                  <option value="all">All Classes</option>
                  {availableClasses.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                  <option value="Not Assigned">Not Assigned</option>
                </select>
              </div>
            </div>
            <div className="mt-3 md:mt-4 flex justify-end">
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 md:px-6 md:py-3 rounded-lg flex items-center gap-2 transition-colors text-sm md:text-base">
                <DownloadIcon className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Export Data</span>
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 md:mb-8 border border-gray-100">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-gray-500">
                <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <UserIcon className="h-8 w-8" />
                </div>
                <p className="text-lg font-medium mb-2">No students found</p>
                <p className="text-sm">Start by adding your first student</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Student Details
                      </th>
                      <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Join Date
                      </th>
                      <th className="px-4 py-3 md:px-6 md:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedStudents.map((student) => (
                      <tr
                        key={student._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                          <div className="text-xs md:text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {student._id.slice(-8)}
                          </div>
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                          <div className="flex items-center min-w-[200px]">
                            <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10">
                              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <UserIcon className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] md:max-w-none">
                                {student.name}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1 truncate max-w-[120px] md:max-w-none">
                                <MailIcon className="h-3 w-3" />
                                {student.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <BookOpenIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {student.classAdmittedTo || 'Not Assigned'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(student.status)}`}
                          >
                            {getStatusIcon(student.status)}
                            <span className="capitalize">{student.status}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-xs md:text-sm text-gray-500">
                            <CalendarIcon className="h-3 w-3 md:h-4 md:w-4" />
                            {formatDate(student.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-center">
                          <button
                            onClick={(e) => handleMenuOpen(e, student)}
                            className="text-gray-400 hover:text-gray-600 p-1 md:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Open actions menu"
                            aria-label="Open actions menu"
                          >
                            <MoreVerticalIcon className="h-4 w-4 md:h-5 md:w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && students.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white rounded-xl p-3 md:p-4 shadow-sm border border-gray-100">
              <div className="text-xs md:text-sm text-gray-600 mb-3 sm:mb-0">
                Showing{' '}
                <span className="font-semibold">
                  {paginatedStudents.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold">{filteredStudents.length}</span>{' '}
                results
              </div>
              <div className="flex justify-center">
                <nav
                  className="inline-flex rounded-lg shadow-sm"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className={`relative inline-flex items-center px-2 py-1 md:px-3 md:py-2 rounded-l-lg border text-xs md:text-sm font-medium ${
                      page === 1
                        ? 'text-gray-300 bg-gray-100 border-gray-200 cursor-not-allowed'
                        : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                    let pageNum = i + 1;
                    if (pageCount > 5) {
                      if (page > 3) {
                        pageNum = page - 3 + i;
                      }
                      if (page > pageCount - 2) {
                        pageNum = pageCount - 4 + i;
                      }
                    }
                    return (
                      pageNum <= pageCount && (
                        <button
                          key={i}
                          onClick={() => setPage(pageNum)}
                          className={`relative inline-flex items-center px-3 py-1 md:px-4 md:py-2 border text-xs md:text-sm font-medium ${
                            page === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(pageCount, page + 1))}
                    disabled={page === pageCount}
                    className={`relative inline-flex items-center px-2 py-1 md:px-3 md:py-2 rounded-r-lg border text-xs md:text-sm font-medium ${
                      page === pageCount
                        ? 'text-gray-300 bg-gray-100 border-gray-200 cursor-not-allowed'
                        : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          )}
        </main>
      </div>
      <Footer />

      {/* Context Menu */}
      {isMenuOpen && menuStudent && (
        <>
          <div className="fixed inset-0 z-10" onClick={handleMenuClose}></div>
          <div
            className="absolute z-20 bg-white rounded-lg shadow-lg py-2 w-56 border border-gray-200"
            style={{
              top: menuPosition.top,
              left: menuPosition.left - 150, // Adjusted to move it to the left
            }}
          >
            <button
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
              onClick={() => {
                handleMenuClose();
                window.location.href = `/students/edit/${menuStudent._id}`;
              }}
            >
              <UserIcon className="h-4 w-4" />
              View Details
            </button>
            <button
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
              onClick={() => {
                handleMenuClose();
                window.location.href = `/students/transactions/${menuStudent._id}`;
              }}
            >
              <CalendarIcon className="h-4 w-4" />
              Transaction Info
            </button>
            <button
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
              onClick={handleMenuClose}
            >
              <MailIcon className="h-4 w-4" />
              Reset Password
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button
              className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 w-full text-left ${
                menuStudent.status.toLowerCase() === 'active'
                  ? 'text-red-600'
                  : 'text-green-600'
              }`}
              onClick={handleMenuClose}
            >
              {menuStudent.status.toLowerCase() === 'active' ? (
                <>
                  <XCircleIcon className="h-4 w-4" />
                  Deactivate Student
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  Activate Student
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* Snackbar */}
      {snackbar.open && (
        <div
          className={`fixed bottom-4 right-4 z-50 py-2 px-4 md:py-3 md:px-6 rounded-lg shadow-lg ${
            snackbar.severity === 'success'
              ? 'bg-green-500'
              : snackbar.severity === 'error'
                ? 'bg-red-500'
                : snackbar.severity === 'warning'
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
          } text-white transition-all duration-300 ease-in-out max-w-xs md:max-w-md`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {snackbar.severity === 'success' && (
                <CheckCircleIcon className="h-4 w-4 md:h-5 md:w-5" />
              )}
              {snackbar.severity === 'error' && (
                <XCircleIcon className="h-4 w-4 md:h-5 md:w-5" />
              )}
              {snackbar.severity === 'warning' && (
                <ClockIcon className="h-4 w-4 md:h-5 md:w-5" />
              )}
              <span className="text-sm md:text-base font-medium">
                {snackbar.message}
              </span>
            </div>
            <button
              onClick={() => setSnackbar({ ...snackbar, open: false })}
              className="ml-4 text-white hover:text-gray-200 transition-colors"
              title="Close notification"
              aria-label="Close notification"
            >
              <XCircleIcon className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPage;
