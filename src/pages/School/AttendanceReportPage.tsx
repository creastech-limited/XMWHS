import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, Clock3, Download, MapPin, Search, Smartphone, UserCheck } from 'lucide-react';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { getStudentAttendance, getStudentsBySchoolId, getUserDetails } from '../../services';
import type { Student, StudentsResponse } from '../../types/student';
import type { AttendanceRecord, User, UserResponse } from '../../types/user';

const AttendanceReportPage: React.FC = () => {
  const [schoolId, setSchoolId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [recordSearchQuery, setRecordSearchQuery] = useState<string>('');
  const [studentsLoading, setStudentsLoading] = useState<boolean>(true);
  const [attendanceLoading, setAttendanceLoading] = useState<boolean>(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Student filter states
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');

  // Helper function for student display name
  const getStudentDisplayName = useCallback((student: Student): string => {
    return (
      student.name ||
      student.fullName ||
      `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
      'Unknown Student'
    );
  }, []);

  // Get unique classes from students
  const classes = useMemo(() => {
    const classSet = new Set<string>();
    students.forEach((student) => {
      if (student.classAdmittedTo && student.classAdmittedTo !== 'Not Assigned') {
        classSet.add(student.classAdmittedTo);
      }
    });
    return Array.from(classSet).sort();
  }, [students]);

  // Filter students based on search and class
  const filteredStudents = useMemo(() => {
    const query = studentSearchQuery.toLowerCase();
    return students.filter((student) => {
      const matchesSearch = !query || 
        getStudentDisplayName(student).toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query);
      const matchesClass = !selectedClass || student.classAdmittedTo === selectedClass;
      return matchesSearch && matchesClass;
    });
  }, [students, studentSearchQuery, selectedClass, getStudentDisplayName]);

  const formatDateTime = useCallback((value: string): string => {
    if (!value) return 'N/A';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const fetchSchoolProfile = useCallback(async () => {
    try {
      const data: UserResponse = await getUserDetails();

      let userProfile: User | UserResponse['user'] | undefined;
      if (data.user?.data) {
        userProfile = data.user.data;
      } else if (data.user) {
        userProfile = data.user;
      } else if (data.data) {
        userProfile = data.data;
      }

      const resolvedSchoolId =
        (userProfile as User | undefined)?.schoolId ||
        (userProfile as User | undefined)?._id ||
        '';

      setSchoolId(resolvedSchoolId);
      return resolvedSchoolId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load school information';
      setError(message);
      return '';
    }
  }, []);

  const fetchStudents = useCallback(async (resolvedSchoolId: string) => {
    if (!resolvedSchoolId) {
      setStudents([]);
      setStudentsLoading(false);
      return;
    }

    setStudentsLoading(true);
    setError(null);

    try {
      const data: StudentsResponse = await getStudentsBySchoolId(resolvedSchoolId);
      const studentArray = Array.isArray(data.data)
        ? data.data.map((student) => ({
            ...student,
            firstName: student.firstName || '',
            lastName: student.lastName || '',
            name:
              student.name ||
              student.fullName ||
              `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
              'Unknown Student',
            email: student.email || '',
            phone: student.phone || '',
            status: student.status || 'Pending',
            classAdmittedTo:
              student.classAdmittedTo ||
              student.academicDetails?.classAdmittedTo ||
              student.Class ||
              'Not Assigned',
            academicDetails: student.academicDetails || {
              classAdmittedTo:
                student.classAdmittedTo ||
                student.Class ||
                'Not Assigned',
            },
          }))
        : [];

      setStudents(studentArray);

      if (studentArray.length > 0) {
        setSelectedStudentId((current) => current || studentArray[0]._id || studentArray[0].student_id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load students';
      setError(message);
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  const fetchAttendance = useCallback(async (studentId: string) => {
    if (!studentId) {
      setAttendanceRecords([]);
      return;
    }

    setAttendanceLoading(true);
    setError(null);

    try {
      const records = await getStudentAttendance(studentId);
      setAttendanceRecords(records);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load attendance';
      setError(message);
      setAttendanceRecords([]);
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadPageData = async () => {
      const resolvedSchoolId = await fetchSchoolProfile();
      await fetchStudents(resolvedSchoolId);
    };

    loadPageData();
  }, [fetchSchoolProfile, fetchStudents]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchAttendance(selectedStudentId);
    }
  }, [selectedStudentId, fetchAttendance]);

  const selectedStudent = useMemo(
    () =>
      students.find((student) => (student._id || student.student_id) === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const filteredRecords = useMemo(() => {
    const query = recordSearchQuery.toLowerCase();

    return attendanceRecords.filter((record) => {
      return (
        record.studentName.toLowerCase().includes(query) ||
        record.studentEmail.toLowerCase().includes(query) ||
        record.attendanceType.toLowerCase().includes(query) ||
        record.location.toLowerCase().includes(query) ||
        record.deviceId.toLowerCase().includes(query) ||
        record.securityPersonnel.toLowerCase().includes(query)
      );
    });
  }, [attendanceRecords, recordSearchQuery]);

  const totalRecords = attendanceRecords.length;
  const checkInCount = attendanceRecords.filter((record) => record.attendanceType.toLowerCase() === 'in').length;
  const checkOutCount = attendanceRecords.filter((record) => record.attendanceType.toLowerCase() === 'out').length;

  const sanitizeCsvValue = useCallback((value: string): string => {
    const normalized = value.replace(/"/g, '""');
    return `"${normalized}"`;
  }, []);

  const handleExportAttendance = useCallback(() => {
    if (filteredRecords.length === 0) {
      return;
    }

    const headers = [
      'Student Name',
      'Student Email',
      'Attendance Type',
      'Time',
      'Location',
      'Device Id',
      'Security Personnel',
    ];

    const rows = filteredRecords.map((record) => [
      record.studentName || 'N/A',
      record.studentEmail || 'N/A',
      record.attendanceType || 'N/A',
      formatDateTime(record.time),
      record.location || 'N/A',
      record.deviceId || 'N/A',
      record.securityPersonnel || 'N/A',
    ]);

    const csvContent = [
      headers.map(sanitizeCsvValue).join(','),
      ...rows.map((row) => row.map((cell) => sanitizeCsvValue(cell)).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const studentName =
      (selectedStudent ? getStudentDisplayName(selectedStudent) : 'student-attendance')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'student-attendance';

    link.href = url;
    link.setAttribute('download', `${studentName}-attendance.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, [filteredRecords, formatDateTime, getStudentDisplayName, sanitizeCsvValue, selectedStudent]);


  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header PsettingsPage="/settings" />

      <div className="flex flex-grow">
        <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-0 bg-none">
          <Sidebar />
        </aside>

        <main className="flex-grow overflow-x-auto p-4 md:ml-64 md:p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <ClipboardList className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-indigo-900">Attendance Report</h1>
                <p className="text-sm text-gray-600">
                  Review student check-in and check-out activity recorded by security personnel.
                </p>
              </div>
            </div>

            {/* Filters below the title */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Class Filter */}
              <div className="w-full sm:w-40">
                <label htmlFor="class-select" className="mb-2 block text-sm font-medium text-gray-700">
                  Filter by Class
                </label>
                <select
                  id="class-select"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  disabled={studentsLoading || classes.length === 0}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none"
                >
                  <option value="">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              {/* Student Search Input */}
              <div className="flex-1">
                <label htmlFor="student-search" className="mb-2 block text-sm font-medium text-gray-700">
                  Search Student
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="student-search"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Student Select - shows filtered students */}
              <div className="w-full sm:flex-1">
                <label htmlFor="student-select" className="mb-2 block text-sm font-medium text-gray-700">
                  Select Student ({filteredStudents.length} of {students.length})
                </label>
                <select
                  id="student-select"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  disabled={studentsLoading || filteredStudents.length === 0}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:outline-none"
                >
                  {filteredStudents.length === 0 ? (
                    <option value="">No students found</option>
                  ) : (
                    filteredStudents.map((student) => {
                      const optionValue = student._id || student.student_id;
                      return (
                        <option key={optionValue} value={optionValue}>
                          {getStudentDisplayName(student)} - {student.email || 'No email'} ({student.classAdmittedTo || 'No class'})
                        </option>
                      );
                    })
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Records</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{totalRecords}</p>
                </div>
                <div className="rounded-lg bg-indigo-100 p-3">
                  <ClipboardList className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Check In</p>
                  <p className="mt-1 text-2xl font-bold text-green-600">{checkInCount}</p>
                </div>
                <div className="rounded-lg bg-green-100 p-3">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Check Out</p>
                  <p className="mt-1 text-2xl font-bold text-amber-600">{checkOutCount}</p>
                </div>
                <div className="rounded-lg bg-amber-100 p-3">
                  <Clock3 className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </div>

           
          </div>

          <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-end">
              {/* Student Picture */}
              <div className="flex-shrink-0">
                {selectedStudent ? (
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 border-2 border-indigo-100">
                    {selectedStudent.profilePicture || selectedStudent.profilePics ? (
                      <img 
                        src={selectedStudent.profilePicture || selectedStudent.profilePics} 
                        alt={getStudentDisplayName(selectedStudent)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-semibold text-2xl">
                        {getStudentDisplayName(selectedStudent).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                    <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <UserCheck className="h-8 w-8" />
                    </div>
                  </div>
                )}
              </div>

              {/* Student Info */}
              <div>
                <p className="text-sm font-medium text-gray-500">Current Student</p>
                <h2 className="mt-1 text-xl font-semibold text-gray-900">
                  {selectedStudent ? getStudentDisplayName(selectedStudent) : 'No student selected'}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {selectedStudent?.email || 'Select a student to load attendance records.'}
                </p>
                {selectedStudent?.classAdmittedTo && (
                  <p className="mt-1 text-sm text-gray-500">Class: {selectedStudent.classAdmittedTo}</p>
                )}
              </div>

              {/* Search Records */}
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={recordSearchQuery}
                  onChange={(e) => setRecordSearchQuery(e.target.value)}
                  placeholder="Search location, device or security..."
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-800 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Attendance Records</h3>
                <p className="text-sm text-gray-600">
                  Export the currently displayed student attendance records as CSV.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportAttendance}
                disabled={filteredRecords.length === 0 || attendanceLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <Download className="h-4 w-4" />
                Export Attendance
              </button>
            </div>

            {studentsLoading ? (
              <div className="py-12 text-center text-sm text-gray-600">Loading students...</div>
            ) : error ? (
              <div className="py-12 text-center">
                <p className="text-base font-medium text-red-700">{error}</p>
              </div>
            ) : attendanceLoading ? (
              <div className="py-12 text-center text-sm text-gray-600">Loading attendance records...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-12 text-center">
                <Clock3 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="text-base font-medium text-gray-900">No attendance records found</p>
                <p className="mt-2 text-sm text-gray-600">
                  {attendanceRecords.length === 0
                    ? 'This student does not have any attendance records yet.'
                    : 'Try adjusting your search.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Student Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Student Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Attendance Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Device Id</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Security Personnel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredRecords.map((record) => (
                      <tr key={record._id}>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{record.studentName}</td>
                        <td className="px-4 py-4 text-sm text-gray-700">{record.studentEmail}</td>
                        <td className="px-4 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              record.attendanceType.toLowerCase() === 'in'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {record.attendanceType}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">{formatDateTime(record.time)}</td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{record.location}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-gray-400" />
                            <span>{record.deviceId}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">{record.securityPersonnel}</td>
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
    </div>
  );
};

export default AttendanceReportPage;
