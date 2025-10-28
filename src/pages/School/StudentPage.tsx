import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import Footer from '../../components/Footer';
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
  classAdmittedTo?: string; 
   guardian?: {
    fullName: string;
    relationship: string;
    email: string;
    
  };
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
  schoolId: string;
  schoolName: string;
  schoolType: string;
  ownership: string;
  Link: string;
}


interface Parent {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
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
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
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
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState<boolean>(false);
  const [guardianEmail, setGuardianEmail] = useState<string>('');
  const [availableParents, setAvailableParents] = useState<Parent[]>([]);
  const [guardianLoading, setGuardianLoading] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState<boolean>(false);
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [bulkUploadLoading, setBulkUploadLoading] = useState<boolean>(false);
const [uploadProgress, setUploadProgress] = useState<number>(0);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const rowsPerPage = 10;

  // Helper functions
  const getStatusBadgeColor = useCallback((status: string): string => {
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
  }, []);

  const getStatusIcon = useCallback((status: string) => {
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
  }, []);

  const getSchoolTypeIcon = useCallback((schoolType: string) => {
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
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // API call functions
  const fetchUserProfile = useCallback(async () => {
    if (!authToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/getuserone`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch user profile');
      
      const data = await response.json();
      const userProfile = data.user?.data || data.user || data;
      const id = userProfile.schoolId;  
      const schoolName = userProfile.schoolName || 'School';
      const schoolType = userProfile.schoolType || 'secondary';
      const schoolAddress = userProfile.schoolAddress || '';
      const ownership = userProfile.ownership || 'private';

      setSchoolId(id);
      setSchoolProfile({
        schoolId: id,
        schoolName,
        schoolType,
        ownership,
        Link: userProfile.Link || '',
      });

      // Construct URL with all necessary parameters
      const params = new URLSearchParams();
      params.append('schoolId', id);  
      params.append('schoolName', encodeURIComponent(schoolName));
      params.append('schoolType', encodeURIComponent(schoolType));
      if (schoolAddress) params.append('schoolAddress', encodeURIComponent(schoolAddress));
      
      const fullLink = `${window.location.origin}/students/new?${params.toString()}`;
      setRegistrationLink(fullLink);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to load school profile',
        severity: 'error',
      });
    }
  }, [authToken, API_BASE_URL]);

  const fetchClasses = useCallback(async () => {
    if (!authToken) return;

    setClassesLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/getclasse`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch classes');
      
      const data = await response.json();
      
      if (data.status && Array.isArray(data.data)) {
        // Get user profile to find the correct schoolId for class filtering
        const userResponse = await fetch(`${API_BASE_URL}/api/users/getuserone`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!userResponse.ok) throw new Error('Failed to fetch user profile');
        
        const userProfileData = await userResponse.json();
        const userProfile = userProfileData.user?.data || userProfileData.user || userProfileData;
        
        // Try to find matching classes using the user's _id (ObjectId format)
        const userObjectId = userProfile._id;
        
        let schoolClasses = [];
        
        if (userObjectId) {
          // Filter classes by the ObjectId format schoolId
          schoolClasses = data.data.filter(
            (cls: Class) => cls.schoolId === userObjectId
          );
        }
        
        // If no classes found with ObjectId, try with string schoolId as fallback
        if (schoolClasses.length === 0 && schoolId) {
          schoolClasses = data.data.filter(
            (cls: Class) => cls.schoolId === schoolId
          );
        }
        
        console.log('Filtered classes:', schoolClasses.length, 'out of', data.data.length);
        console.log('User ObjectId:', userObjectId, 'Student schoolId:', schoolId);
        
        setClasses(schoolClasses);
      } else {
        console.error('Unexpected classes data format:', data);
        setClasses([]);
      }
    } catch (err) {
      console.error('Classes fetch error:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load classes: ' + (err instanceof Error ? err.message : 'Unknown error'),
        severity: 'error',
      });
    } finally {
      setClassesLoading(false);
    }
  }, [authToken, schoolId, API_BASE_URL]);

  const fetchStudents = useCallback(async () => {
    if (!authToken || !schoolId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/getstudentbyid?id=${encodeURIComponent(schoolId)}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch students');
      
      const data = await response.json();
      let studentArray: Student[] = [];
      
      if (data && Array.isArray(data.data)) {
        studentArray = data.data.map((student: Student) => ({
          _id: student._id, // For backward compatibility
          firstName: student.firstName,
          lastName: student.lastName,
          name: student.name || `${student.firstName} ${student.lastName}`,
          email: student.email,
          academicDetails: student.academicDetails || { classAdmittedTo: '' },
          classAdmittedTo: student.academicDetails?.classAdmittedTo || 'Not Assigned',
          status: student.status,
          createdAt: student.createdAt,
    guardian: student.guardian,
  }));
      } else {
        console.error('Unexpected students data format:', data);
      }

      setStudents(studentArray);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: 'Failed to load student data: ' + (err instanceof Error ? err.message : 'Unknown error'),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [authToken, schoolId, API_BASE_URL]);

  // Initial data fetching
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    if (schoolId) {
      fetchClasses();
      fetchStudents();
    }
  }, [schoolId, fetchClasses, fetchStudents]);

  // Event handlers
  const handleCopyLink = useCallback(() => {
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
  }, [registrationLink]);

  const handleMenuOpen = useCallback((e: React.MouseEvent, student: Student) => {
    e.preventDefault();
    setMenuStudent(student);
    setMenuPosition({ top: e.clientY, left: e.clientX });
    setIsMenuOpen(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
    setMenuStudent(null);
  }, []);

  const handleActivateDeactivate = useCallback(async (student: Student) => {
    if (!authToken) {
      setSnackbar({
        open: true,
        message: 'Authentication token missing',
        severity: 'error',
      });
      return;
    }

    const endpoint = 
      student.status.toLowerCase() === 'active'
        ? `${API_BASE_URL}/api/users/deactive/${student._id}`
        : `${API_BASE_URL}/api/users/active/${student._id}`;

    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update student status');
      }

      const data = await response.json();
      
      // Update the student status in the local state
      setStudents(prevStudents =>
        prevStudents.map(s =>
          s._id === student._id
            ? { ...s, status: data.status || (student.status.toLowerCase() === 'active' ? 'inactive' : 'active') }
            : s
        )
      );

      setSnackbar({
        open: true,
        message: `Student ${student.status.toLowerCase() === 'active' ? 'deactivated' : 'activated'} successfully`,
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating student status:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to update student status',
        severity: 'error',
      });
    } finally {
      handleMenuClose();
    }
  }, [authToken, API_BASE_URL, handleMenuClose]);

  const fetchParents = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/getparents`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch parents');
      
      const data = await response.json();
      console.log('Parents API full response:', data);
      
      // Extract parents based on the response structure you provided
      let parentsArray = [];
      
      if (data.parent && Array.isArray(data.parent)) {
        // If response has a parent array
        parentsArray = data.parent;
      } else if (data.data && Array.isArray(data.data)) {
        // If response has a data array
        parentsArray = data.data;
      } else if (Array.isArray(data)) {
        // If response is directly an array
        parentsArray = data;
      }
      
      console.log('Processed parents:', parentsArray);
      setAvailableParents(parentsArray);
    } catch (error) {
      console.error('Error fetching parents:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load available parents',
        severity: 'error',
      });
    }
  }, [authToken, API_BASE_URL]);


  const handleUpdateGuardian = useCallback(async () => {
    if (!guardianEmail || !selectedStudent) return;

    setGuardianLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/updateguardian`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guardianEmail: guardianEmail,
          kidEmail: selectedStudent.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update guardian');
      }
      
      const result = await response.json();
      console.log('Guardian update result:', result);

      setSnackbar({
        open: true,
        message: 'Guardian updated successfully!',
        severity: 'success',
      });

      setIsGuardianModalOpen(false);
      setGuardianEmail('');
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error updating guardian:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to update guardian',
        severity: 'error',
      });
    } finally {
      setGuardianLoading(false);
    }
  }, [guardianEmail, selectedStudent, authToken, API_BASE_URL]);

  const handleGuardianClick = useCallback(async (student: Student) => {
    console.log('Guardian click for student:', student);
    setSelectedStudent(student);
    setGuardianEmail('');
    
    // Fetch parents first, then open modal
    try {
      await fetchParents();
      setIsGuardianModalOpen(true);
      console.log('Modal should be open now');
    } catch (error) {
      console.error('Error preparing guardian modal:', error);
    }
    
    handleMenuClose();
  }, [fetchParents, handleMenuClose]);

  const handleBulkUpload = useCallback(async () => {
  if (!selectedFile || !authToken) {
    setSnackbar({
      open: true,
      message: 'Please select a file first',
      severity: 'error',
    });
    return;
  }

  setBulkUploadLoading(true);
  setUploadProgress(0);

  try {
    const formData = new FormData();
    formData.append('file', selectedFile);

    const response = await fetch(`${API_BASE_URL}/api/users/bulkregister`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload students');
    }

    const result = await response.json();
    
    setSnackbar({
      open: true,
      message: `Successfully registered ${result.data?.length || 0} students`,
      severity: 'success',
    });

    setIsBulkUploadOpen(false);
    setSelectedFile(null);
    
    // Refresh student list
    await fetchStudents();
  } catch (error) {
    console.error('Bulk upload error:', error);
    setSnackbar({
      open: true,
      message: error instanceof Error ? error.message : 'Failed to upload students',
      severity: 'error',
    });
  } finally {
    setBulkUploadLoading(false);
    setUploadProgress(0);
  }
}, [selectedFile, authToken, API_BASE_URL, fetchStudents]);

const handleDownloadSample = useCallback(() => {
  const sampleCSV = `firstName,lastName,email,phone,classAdmittedTo
John,Doe,john.doe@example.com,+2348012345678,JSS 1
Jane,Smith,jane.smith@example.com,+2348023456789,JSS 2
Michael,Johnson,michael.j@example.com,+2348034567890,SS 1`;

  const blob = new Blob([sampleCSV], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'student_sample.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  setSnackbar({
    open: true,
    message: 'Sample CSV downloaded successfully',
    severity: 'success',
  });
}, []);

  // Data processing
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
      <Header profilePath="/settings"/>
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
                    message: 'School information is missing. Cannot generate registration link.',
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
                    Inactive Students
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-red-600">
                    {
                      students.filter(
                        (s) => s.status.toLowerCase() === 'inactive'
                      ).length
                    }
                  </p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-lg">
                  <XCircleIcon className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
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
                <ClipboardCopyIcon className="text-indigo-500 h-4 w-4 md:h-5 md:w-5" />
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
          <div className="mt-3 md:mt-4 flex justify-end gap-2">
  <button 
    onClick={handleDownloadSample}
    className="bg-green-100 hover:bg-green-200 text-green-700 font-medium px-4 py-2 md:px-6 md:py-3 rounded-lg flex items-center gap-2 transition-colors text-sm md:text-base"
    title="Download sample CSV"
  >
    <DownloadIcon className="h-4 w-4 md:h-5 md:w-5" />
    <span className="hidden sm:inline">Sample CSV</span>
  </button>
  <button 
    onClick={() => setIsBulkUploadOpen(true)}
    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium px-4 py-2 md:px-6 md:py-3 rounded-lg flex items-center gap-2 transition-colors text-sm md:text-base"
  >
    <PlusIcon className="h-4 w-4 md:h-5 md:w-5" />
    <span className="hidden sm:inline">Bulk Upload</span>
  </button>
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
  Guardian
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
  {student.guardian ? (
    <div className="text-sm text-gray-900">
      <div className="font-medium">{student.guardian.fullName}</div>
      <div className="text-xs text-gray-500">
        {student.guardian.relationship} • {student.guardian.email}
      </div>
    </div>
  ) : (
    <span className="text-xs text-gray-500 italic">No guardian assigned</span>
  )}
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
          <div 
            className="fixed inset-0 z-10" 
            onClick={handleMenuClose}
          ></div>
          <div
            className="fixed z-20 bg-white rounded-lg shadow-lg py-2 w-56 border border-gray-200"
            style={{
              top: `${Math.min(menuPosition.top, window.innerHeight - 200)}px`,
              left: `${Math.min(menuPosition.left - 100, window.innerWidth - 224)}px`,
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
            <button
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
              onClick={() => handleGuardianClick(menuStudent)}
            >
              <UsersIcon className="h-4 w-4" />
              Assign Guardian
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button
              className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 w-full text-left ${
                menuStudent.status.toLowerCase() === 'active'
                  ? 'text-red-600'
                  : 'text-green-600'
              }`}
              onClick={() => handleActivateDeactivate(menuStudent)}
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

    {/* Bulk Upload Modal */}
{isBulkUploadOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
    <div 
      className="bg-white rounded-lg w-full max-w-md mx-auto p-6 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100">
          <UsersIcon className="h-6 w-6 text-purple-600" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-medium text-gray-900">
            Bulk Upload Students
          </h3>
          <p className="text-sm text-gray-500">
            Upload a CSV file to register multiple students
          </p>
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select CSV File
        </label>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
                  setSnackbar({
                    open: true,
                    message: 'Please select a valid CSV file',
                    severity: 'error',
                  });
                  return;
                }
                setSelectedFile(file);
              }
            }}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <DownloadIcon className="h-12 w-12 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">
              {selectedFile ? selectedFile.name : 'Click to select CSV file'}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              Maximum file size: 5MB
            </span>
          </label>
        </div>
        
        {uploadProgress > 0 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1 text-center">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}
        
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
         <p className="text-xs text-blue-800">
  <strong>CSV Format:</strong> firstName, lastName, email, phone, classAdmittedTo
</p>
          <button
            onClick={handleDownloadSample}
            className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
          >
            Download sample CSV file
          </button>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => {
            setIsBulkUploadOpen(false);
            setSelectedFile(null);
            setUploadProgress(0);
          }}
          disabled={bulkUploadLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleBulkUpload}
          disabled={!selectedFile || bulkUploadLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {bulkUploadLoading ? (
            <>
              <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></span>
              Uploading...
            </>
          ) : (
            'Upload Students'
          )}
        </button>
      </div>
    </div>
  </div>
)}  
      {/* Guardian Assignment Modal */}
      {isGuardianModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div 
            className="bg-white rounded-lg w-full max-w-md mx-auto p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Assign Guardian
                </h3>
                <p className="text-sm text-gray-500">
                  For student: <strong>{selectedStudent.name}</strong>
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Guardian
              </label>
              
              {availableParents.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Loading parents...
                </div>
              ) : (
                <select
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  <option value="">Select a guardian...</option>
                  {availableParents.map((parent) => (
                    <option key={parent._id} value={parent.email}>
                      {parent.name} ({parent.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsGuardianModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateGuardian}
                disabled={!guardianEmail || guardianLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guardianLoading ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></span>
                    Assigning...
                  </>
                ) : (
                  'Assign Guardian'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
{availableParents.length === 0 ? (
  <div className="flex justify-center items-center py-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-sm text-gray-500">Loading parents...</span>
  </div>
) : (
  <select
    value={guardianEmail}
    onChange={(e) => setGuardianEmail(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  >
    <option value="">Select a guardian...</option>
    {availableParents.map((parent) => (
      <option key={parent._id} value={parent.email}>
        {parent.name} ({parent.email})
      </option>
    ))}
  </select>
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