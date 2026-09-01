// src/hooks/useStudentManagement.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getUserDetails,
  getClasses,
  getStudentsBySchoolId,
  getParents,
  updateGuardian,
  activateUser,
  setStudentPin,
  updateStudentPin,
  bulkUploadStudents,
  deactivateUser,
  extractStudentName,
  extractStudentEmail,
} from '../services';
import type {
  Student,
  Parent,
  StudentsResponse,
  ParentsResponse,
  PinRequest,
  PinResponse,
} from '../types/student';
import type {
  UserResponse,
  ClassesResponse,
  ClassItem,
  User,
  SnackbarState,
  Class,
} from '../types/user';
import type {
  StudentStats,
  StudentFilters,
  PinData,
  SchoolProfile,
} from '../types/student-management';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const useStudentManagement = () => {
  const authContext = useAuth();
  const token = authContext?.token || localStorage.getItem('token');

  // ===== STATE =====
  const [schoolId, setSchoolId] = useState<string>('');
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [registrationLink, setRegistrationLink] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [classesLoading, setClassesLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<StudentFilters>({
    searchQuery: '',
    statusFilter: 'all',
    gradeFilter: 'all',
  });
  const [page, setPage] = useState<number>(1);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  // ===== UI State =====
  const [menuStudent, setMenuStudent] = useState<Student | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // ===== Guardian Modal State =====
  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState<boolean>(false);
  const [guardianEmail, setGuardianEmail] = useState<string>('');
  const [availableParents, setAvailableParents] = useState<Parent[]>([]);
  const [guardianLoading, setGuardianLoading] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // ===== Bulk Upload State =====
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bulkUploadLoading, setBulkUploadLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // ===== PIN Management State =====
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [pinAction, setPinAction] = useState<'set' | 'update'>('set');
  const [pinData, setPinData] = useState<PinData>({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });
  const [pinLoading, setPinLoading] = useState<boolean>(false);

  const rowsPerPage = 10;

  // ===== COMPUTED STATS =====
  const stats = useMemo((): StudentStats => {
    const active = students.filter(s => (s.status || '').toLowerCase() === 'active').length;
    const inactive = students.filter(s => (s.status || '').toLowerCase() === 'inactive').length;
    const pending = students.filter(s => (s.status || '').toLowerCase() === 'pending').length;
    return { total: students.length, active, inactive, pending };
  }, [students]);

  // ===== FILTERING & PAGINATION =====
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const studentName = (s.name || '').toLowerCase();
      const studentEmail = (s.email || '').toLowerCase();
      const studentStatus = (s.status || '').toLowerCase();
      const studentClass = s.classAdmittedTo || '';
      
      const searchLower = filters.searchQuery.toLowerCase();
      
      const matchesSearch =
        studentName.includes(searchLower) ||
        studentEmail.includes(searchLower);
      
      const matchesStatus =
        filters.statusFilter === 'all' ||
        studentStatus === filters.statusFilter.toLowerCase();
      
      const matchesGrade =
        filters.gradeFilter === 'all' ||
        studentClass === filters.gradeFilter ||
        (filters.gradeFilter === 'Not Assigned' && !studentClass);
      
      return matchesSearch && matchesStatus && matchesGrade;
    });
  }, [students, filters]);

  const paginatedStudents = useMemo(() => {
    return filteredStudents.slice(
      (page - 1) * rowsPerPage,
      page * rowsPerPage
    );
  }, [filteredStudents, page]);

  const pageCount = Math.ceil(filteredStudents.length / rowsPerPage);

  // ===== AVAILABLE CLASSES =====
  const availableClasses = useMemo(() => {
    return [
      ...new Set(
        [
          ...classes.map((cls) => cls.className),
          ...students.map((student) => student.classAdmittedTo || ''),
        ].filter(
          (className) =>
            className && className.trim() !== '' && className !== 'Not Assigned'
        )
      ),
    ].sort();
  }, [classes, students]);

  // ===== STUDENT HELPER FUNCTIONS =====
  const getStudentDisplayName = useCallback((student: Student): string => {
    // Use the service-level extractor for consistency across all pages
    const extracted = extractStudentName(student as unknown as Record<string, unknown>);
    if (extracted && extracted !== 'Unknown Student') return extracted;
    // Fallback chain
    return (
      student.fullName ||
      student.name ||
      `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
      student.email?.split('@')[0] ||
      'Unknown'
    );
  }, []);

  const getStudentInitials = useCallback((student: Student): string => {
    const displayName = getStudentDisplayName(student);
    const parts = displayName.split(' ').filter(Boolean).slice(0, 2);
    if (parts.length === 0) return 'ST';
    return parts.map((part) => part[0]?.toUpperCase() || '').join('');
  }, [getStudentDisplayName]);

  const getStudentProfileImage = useCallback((student: Student): string | null => {
    const image = student.profilePicture || student.profilePics || '';
    if (!image) return null;
    if (image.startsWith('http')) return image;
    if (image.startsWith('/uploads/')) return `${API_BASE_URL}${image}`;
    return `${API_BASE_URL}/${image.replace(/^\/+/, '')}`;
  }, []);

  // ===== DATA FETCHING =====
  const fetchUserProfile = useCallback(async () => {
    if (!token) return;
    try {
      const data: UserResponse = await getUserDetails();
      // Extract user data safely
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

      // Helper to safely get ID
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

      // Construct registration URL
      const params = new URLSearchParams();
      if (id) params.append('schoolId', id);
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
  }, [token]);

  const fetchClasses = useCallback(async () => {
    if (!token) return;
    setClassesLoading(true);
    try {
      const data: ClassesResponse = await getClasses();
      if (data.status && Array.isArray(data.data)) {
        const userProfileData: UserResponse = await getUserDetails();
        let userProfile: User | { data?: User; wallet?: { balance: number } } | UserResponse;
        
        if (userProfileData.user?.data) {
          userProfile = userProfileData.user.data;
        } else if (userProfileData.user) {
          userProfile = userProfileData.user;
        } else if (userProfileData.data) {
          userProfile = userProfileData.data;
        } else {
          userProfile = userProfileData;
        }

        const getUserObjectId = (): string => {
          if (!userProfile || typeof userProfile !== 'object') return '';
          if ('_id' in userProfile) {
            return (userProfile as User)._id || '';
          }
          if ('data' in userProfile && userProfile.data && typeof userProfile.data === 'object' && '_id' in userProfile.data) {
            return (userProfile.data as User)._id || '';
          }
          return '';
        };

        const userObjectId = getUserObjectId();
        let schoolClasses: Class[] = [];

        if (userObjectId) {
          schoolClasses = (data.data as ClassItem[])
            .filter((cls: ClassItem) => cls.schoolId === userObjectId)
            .map((item: ClassItem): Class => ({
              _id: item._id,
              className: item.className,
              section: item.section,
              schoolId: item.schoolId,
              students: item.students,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            }));
        }

        if (schoolClasses.length === 0 && schoolId) {
          schoolClasses = (data.data as ClassItem[])
            .filter((cls: ClassItem) => cls.schoolId === schoolId)
            .map((item: ClassItem): Class => ({
              _id: item._id,
              className: item.className,
              section: item.section,
              schoolId: item.schoolId,
              students: item.students,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            }));
        }

        setClasses(schoolClasses);
      } else {
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
  }, [token, schoolId]);

  const fetchStudents = useCallback(async () => {
    if (!token || !schoolId) return;
    setLoading(true);
    try {
      const data: StudentsResponse = await getStudentsBySchoolId(schoolId);
      if (data.message && data.message.includes('No students found')) {
        setStudents([]);
        return;
      }

      // getStudentsBySchoolId now returns normalized data via normalizeStudentData
      // so data.data should already be normalized. Use it directly, with a safety fallback.
      let studentArray: Student[] = [];
      const rawList = data.data || (data as any).students || [];
      if (Array.isArray(rawList)) {
        studentArray = rawList.map((student: Student) => {
          const email = extractStudentEmail(student as unknown as Record<string, unknown>) || student.email || '';
          const name = extractStudentName(student as unknown as Record<string, unknown>);
          const classValue =
            student.classAdmittedTo ||
            student.academicDetails?.classAdmittedTo ||
            student.Class ||
            'Not Assigned';
          return {
            ...student,
            firstName: student.firstName || '',
            lastName: student.lastName || '',
            name: name,
            fullName: student.fullName || name,
            email: email,
            phone: student.phone || '',
            status: student.status || 'Pending',
            classAdmittedTo: classValue,
            academicDetails: student.academicDetails || { classAdmittedTo: classValue },
          };
        });
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
  }, [token, schoolId]);

  const fetchParents = useCallback(async () => {
    try {
      const data: ParentsResponse = await getParents();
      let parentsArray: Parent[] = [];
      if (data.parent && Array.isArray(data.parent)) {
        parentsArray = data.parent;
      } else if (data.data && Array.isArray(data.data)) {
        parentsArray = data.data;
      } else if (Array.isArray(data)) {
        parentsArray = data;
      }
      setAvailableParents(parentsArray);
    } catch (error: unknown) {
      console.error('Error fetching parents:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load available parents';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  }, []);

  // ===== CRUD OPERATIONS =====
  const handleActivateDeactivate = useCallback(async (student: Student) => {
    if (!token) {
      setSnackbar({ open: true, message: 'Authentication required', severity: 'error' });
      return;
    }

    // Resolve the best available ID to pass to the API
    const resolvedId = student._id || (student as any).id || student.student_id || '';
    if (!resolvedId) {
      setSnackbar({ open: true, message: 'Cannot determine student ID for status update', severity: 'error' });
      return;
    }

    const currentStatus = (student.status || 'Pending').toLowerCase();
    const isActive = currentStatus === 'active';

    try {
      const response = isActive
        ? await deactivateUser(resolvedId)
        : await activateUser(resolvedId);

      const newStatus: 'Active' | 'Inactive' | 'Pending' = isActive ? 'Inactive' : 'Active';

      // Match on any available ID field
      setStudents(prevStudents =>
        prevStudents.map(s => {
          const sId = s._id || (s as any).id || s.student_id || '';
          return sId === resolvedId ? { ...s, status: newStatus } : s;
        })
      );

      setSnackbar({
        open: true,
        message: response.message || `Student ${isActive ? 'deactivated' : 'activated'} successfully`,
        severity: 'success',
      });
    } catch (error: unknown) {
      console.error('Error updating student status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update student status';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      handleMenuClose();
    }
  }, [token]);

  const handleUpdateGuardian = useCallback(async () => {
    if (!guardianEmail) {
      setSnackbar({ open: true, message: 'Please select a guardian', severity: 'error' });
      return;
    }
    if (!selectedStudent) {
      setSnackbar({ open: true, message: 'No student selected', severity: 'error' });
      return;
    }
    if (!selectedStudent.email) {
      setSnackbar({ open: true, message: 'Student email is missing', severity: 'error' });
      return;
    }

    setGuardianLoading(true);
    try {
      const result = await updateGuardian(guardianEmail, selectedStudent.email);
      setSnackbar({
        open: true,
        message: result.message || 'Guardian updated successfully!',
        severity: 'success',
      });
      setIsGuardianModalOpen(false);
      setGuardianEmail('');
      setSelectedStudent(null);
      await fetchStudents();
    } catch (error: unknown) {
      console.error('Error updating guardian:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update guardian';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setGuardianLoading(false);
    }
  }, [guardianEmail, selectedStudent, fetchStudents]);

  const handleBulkUpload = useCallback(async () => {
    if (!selectedFile) {
      setSnackbar({ open: true, message: 'Please select a file first', severity: 'error' });
      return;
    }
    if (!token) {
      setSnackbar({ open: true, message: 'Authentication required', severity: 'error' });
      return;
    }

    setBulkUploadLoading(true);
    setUploadProgress(0);

    try {
      const result = await bulkUploadStudents(selectedFile);
      if (result.errors && result.errors.length > 0) {
        const successCount = Array.isArray(result.successes) ? result.successes.length : 0;
        setSnackbar({
          open: true,
          message: `Partially completed: ${successCount} students created, ${result.errors.length} errors.`,
          severity: 'warning',
        });
      } else {
        const successCount = Array.isArray(result.successes) ? result.successes.length : result.total || 0;
        setSnackbar({
          open: true,
          message: `Successfully registered ${successCount} students`,
          severity: 'success',
        });
      }
      setIsBulkUploadOpen(false);
      setSelectedFile(null);
      await fetchStudents();
    } catch (error: unknown) {
      console.error('Bulk upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload students';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setBulkUploadLoading(false);
      setUploadProgress(0);
    }
  }, [selectedFile, token, fetchStudents]);

  const handleSetPin = useCallback(async () => {
    if (!token) {
      setSnackbar({ open: true, message: 'Authentication required', severity: 'error' });
      return;
    }
    if (!menuStudent) {
      setSnackbar({ open: true, message: 'No student selected', severity: 'error' });
      return;
    }
    if (!menuStudent.email) {
      setSnackbar({ open: true, message: 'Student email is missing', severity: 'error' });
      return;
    }
    if (!pinData.newPin) {
      setSnackbar({ open: true, message: 'PIN is required', severity: 'error' });
      return;
    }
    if (pinData.newPin !== pinData.confirmPin) {
      setSnackbar({ open: true, message: 'PIN and confirmation do not match', severity: 'error' });
      return;
    }

    setPinLoading(true);
    try {
      const pinRequest: PinRequest = {
        studentEmail: menuStudent.email,
        pin: pinData.newPin,
      };
      const result: PinResponse = await setStudentPin(pinRequest);
      setSnackbar({
        open: true,
        message: result.message || 'PIN set successfully!',
        severity: 'success',
      });
      setIsPinModalOpen(false);
      setPinData({ currentPin: '', newPin: '', confirmPin: '' });
    } catch (error: unknown) {
      console.error('Error setting PIN:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to set PIN';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setPinLoading(false);
    }
  }, [token, menuStudent, pinData]);

  const handleUpdatePin = useCallback(async () => {
    if (!token) {
      setSnackbar({ open: true, message: 'Authentication required', severity: 'error' });
      return;
    }
    if (!menuStudent) {
      setSnackbar({ open: true, message: 'No student selected', severity: 'error' });
      return;
    }
    if (!menuStudent.email) {
      setSnackbar({ open: true, message: 'Student email is missing', severity: 'error' });
      return;
    }
    if (!pinData.currentPin) {
      setSnackbar({ open: true, message: 'Current PIN is required', severity: 'error' });
      return;
    }
    if (!pinData.newPin) {
      setSnackbar({ open: true, message: 'New PIN is required', severity: 'error' });
      return;
    }
    if (pinData.newPin !== pinData.confirmPin) {
      setSnackbar({ open: true, message: 'New PIN and confirmation do not match', severity: 'error' });
      return;
    }

    setPinLoading(true);
    try {
      const pinRequest: PinRequest = {
        studentEmail: menuStudent.email,
        newPin: pinData.newPin,
      };
      const result: PinResponse = await updateStudentPin(pinRequest);
      setSnackbar({
        open: true,
        message: result.message || 'PIN updated successfully!',
        severity: 'success',
      });
      setIsPinModalOpen(false);
      setPinData({ currentPin: '', newPin: '', confirmPin: '' });
    } catch (error: unknown) {
      console.error('Error updating PIN:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update PIN';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setPinLoading(false);
    }
  }, [token, menuStudent, pinData]);

  // ===== UI HANDLERS =====
  const handleCopyLink = useCallback(() => {
    if (!registrationLink) {
      setSnackbar({ open: true, message: 'No registration link available', severity: 'error' });
      return;
    }
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

  const handleGuardianClick = useCallback(async (student: Student) => {
    setSelectedStudent(student);
    setGuardianEmail('');
    await fetchParents();
    setIsGuardianModalOpen(true);
    handleMenuClose();
  }, [fetchParents, handleMenuClose]);

  const handleViewDetails = useCallback((student: Student) => {
    handleMenuClose();
    window.location.href = `/students/edit/${student._id}`;
  }, [handleMenuClose]);

  const handleViewTransactions = useCallback((student: Student) => {
    handleMenuClose();
    window.location.href = `/students/transactions/${student._id}`;
  }, [handleMenuClose]);

  const handleDownloadSample = useCallback(() => {
    const sampleCSV = `firstName,lastName,email,phone,classAdmittedTo
John,Doe,john.doe@example.com,"+2348012345678",JSS 1
Jane,Smith,jane.smith@example.com,"+2348023456789",JSS 2
Michael,Johnson,michael.j@example.com,"+2348034567890",SS 1`;
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

  const handleExport = useCallback(() => {
    if (!students || students.length === 0) {
      setSnackbar({ open: true, message: "No students available to export", severity: "warning" });
      return;
    }

    const exportColumns = [
      { key: 'name', label: 'Student Name' },
      { key: 'admissionNumber', label: 'Adm No' },
      { key: 'email', label: 'Email' },
      { key: 'guardian', label: 'Guardian' },
      { key: 'classAdmittedTo', label: 'Class' },
      { key: 'status', label: 'Status' },
    ];

    const exportData = students.map(student => ({
      name: getStudentDisplayName(student),
      admissionNumber: student.admissionNumber || student.student_id || 'N/A',
      email: student.email || 'No email',
      guardian: student.guardian?.fullName || 'N/A',
      classAdmittedTo: student.classAdmittedTo || 'Not Assigned',
      status: student.status || 'Pending',
    }));

    const headers = exportColumns.map(col => col.label).join(',') + '\n';
    const rows = exportData
      .map(row => {
        return exportColumns
          .map(col => {
            let value = row[col.key as keyof typeof row];
            if (value === null || value === undefined) value = '';
            let stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              stringValue = `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(',');
      })
      .join('\n');

    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.href = url;
    link.download = `students_export_${timestamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setSnackbar({ open: true, message: `Exported ${students.length} students successfully`, severity: "success" });
  }, [students, getStudentDisplayName]);

  // ===== INITIALIZATION =====
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    if (schoolId) {
      fetchClasses();
      fetchStudents();
    }
  }, [schoolId, fetchClasses, fetchStudents]);

  // ===== CLOSE MENU ON SCROLL =====
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleScroll = () => handleMenuClose();
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isMenuOpen, handleMenuClose]);

  // ===== AUTO-HIDE SNACKBAR =====
  useEffect(() => {
    if (!snackbar.open) return;
    const timer = setTimeout(() => setSnackbar(prev => ({ ...prev, open: false })), 6000);
    return () => clearTimeout(timer);
  }, [snackbar.open]);

  // ===== RETURN =====
  return {
    // Data
    students,
    classes,
    loading,
    classesLoading,
    schoolProfile,
    registrationLink,
    stats,
    filteredStudents,
    paginatedStudents,
    pageCount,
    availableClasses,
    // Filters & Pagination
    filters,
    setFilters,
    page,
    setPage,
    // UI State
    menuStudent,
    isMenuOpen,
    menuPosition,
    // Modals
    isGuardianModalOpen,
    setIsGuardianModalOpen,
    guardianEmail,
    setGuardianEmail,
    availableParents,
    guardianLoading,
    selectedStudent,
    isBulkUploadOpen,
    setIsBulkUploadOpen,
    selectedFile,
    setSelectedFile,
    bulkUploadLoading,
    uploadProgress,
    isPinModalOpen,
    setIsPinModalOpen,
    pinAction,
    setPinAction,
    pinData,
    setPinData,
    pinLoading,
    // Handlers
    getStudentDisplayName,
    getStudentInitials,
    getStudentProfileImage,
    handleCopyLink,
    handleMenuOpen,
    handleMenuClose,
    handleGuardianClick,
    handleViewDetails,
    handleViewTransactions,
    handleActivateDeactivate,
    handleUpdateGuardian,
    handleBulkUpload,
    handleDownloadSample,
    handleExport,
    handleSetPin,
    handleUpdatePin,
    // Snackbar
    snackbar,
    setSnackbar,
  };
};