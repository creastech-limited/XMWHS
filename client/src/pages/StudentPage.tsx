import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import Footer from "../components/Footer";
import { PlusIcon, SearchIcon, ClipboardCopyIcon, UserIcon, MailIcon, FoldVerticalIcon, DownloadIcon } from 'lucide-react';

// Define TypeScript interfaces
interface Student {
  _id: string;
  name: string;
  email: string;
  class: string;
  status: string;
  createdAt: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "warning" | "info";
}


const StudentPage: React.FC = () => {
  const authContext = useAuth();
  const token = authContext?.token || localStorage.getItem("token");
  const authToken = token || localStorage.getItem("token");

  const [schoolId, setSchoolId] = useState<string>("");
  const [registrationLink, setRegistrationLink] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });
  const [menuStudent, setMenuStudent] = useState<Student | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const API_BASE_URL = import.meta.env.VITE_API_URL || "https://nodes-staging.up.railway.app";
  const rowsPerPage = 10;

  // Fetch user profile to get schoolLink and schoolId
  useEffect(() => {
    if (!authToken) return;

    fetch(`${API_BASE_URL}/api/users/getuserone`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user profile");
        return res.json();
      })
      .then((data) => {
        const profile = data.user;
        const id = profile.data._id;
        setSchoolId(id);

        // Construct the full registration link
        const linkPath = profile.Link || "";
        const fullLink = `${window.location.origin}/students/new${linkPath}`;
        setRegistrationLink(fullLink);
      })
      .catch((err) => {
        console.error(err);
        setSnackbar({ open: true, message: err.message, severity: "error" });
      });
  }, [authToken, API_BASE_URL]);

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
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch students");
        return res.json();
      })
      .then((data) => {
        // Handle the response structure properly
        let studentArray: Student[] = [];
        if (data && data.data && Array.isArray(data.data)) {
          studentArray = data.data;
        } else {
          console.error("Unexpected students data format:", data);
        }

        setStudents(studentArray);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setSnackbar({
          open: true,
          message: "Failed to load student data: " + err.message,
          severity: "error",
        });
        setLoading(false);
      });
  }, [authToken, schoolId, API_BASE_URL]);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesGrade = gradeFilter === "all" || s.class === gradeFilter;
    return matchesSearch && matchesStatus && matchesGrade;
  });

  const paginatedStudents = filteredStudents.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );
  const pageCount = Math.ceil(filteredStudents.length / rowsPerPage);

  const getStatusBadgeColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleCopyLink = () => {
    if (!registrationLink) return;
    navigator.clipboard
      .writeText(registrationLink)
      .then(() =>
        setSnackbar({
          open: true,
          message: "Link copied!",
          severity: "success",
        })
      )
      .catch(() =>
        setSnackbar({ open: true, message: "Copy failed", severity: "error" })
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
      day: 'numeric'
    });
  };

  const uniqueGrades = [...new Set(students.map((s) => s.class))].filter(Boolean);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          {/* Title & Add Button */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserIcon className="h-6 w-6 text-blue-600" />
             <span className="text-indigo-600">Student Management</span>
            </h1>
            <button
              onClick={() =>
                registrationLink
                  ? (window.location.href = registrationLink)
                  : setSnackbar({
                      open: true,
                      message: "Registration link missing",
                      severity: "error",
                    })
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Add New Student
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6 transition-all hover:shadow-md">
              <p className="text-gray-500 font-medium mb-1">Total Students</p>
              <p className="text-3xl font-bold text-gray-800">{students.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 transition-all hover:shadow-md">
              <p className="text-gray-500 font-medium mb-1">Active Students</p>
              <p className="text-3xl font-bold text-green-600">
                {students.filter((s) => s.status.toLowerCase() === "active").length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 transition-all hover:shadow-md">
              <p className="text-gray-500 font-medium mb-1">Student Types</p>
              <p className="text-3xl font-bold text-blue-600">
                {uniqueGrades.length}
              </p>
            </div>
          </div>

          {/* Registration Link Card */}
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MailIcon className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-medium">Student Registration Link</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  readOnly
                  value={registrationLink}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-gray-50"
                />
                <button
                  onClick={handleCopyLink}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600"
                >
                  <ClipboardCopyIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="col-span-1 md:col-span-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500"
                  />
                  <SearchIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 font-medium"
                >
                  <option value="all">All Grades</option>
                  {uniqueGrades.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-4 py-2 rounded flex items-center gap-2 transition-colors">
                <DownloadIcon className="h-5 w-5" />
                Export Data
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-gray-500">
                <UserIcon className="h-12 w-12 mb-2" />
                <p>No students found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedStudents.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student._id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{student.class || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(student.status)}`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(student.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => handleMenuOpen(e, student)}
                            className="text-gray-500 hover:text-blue-600"
                          >
                            <FoldVerticalIcon className="h-5 w-5" />
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
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="text-sm text-gray-700 mb-4 sm:mb-0">
                Showing <span className="font-medium">{paginatedStudents.length}</span> of{" "}
                <span className="font-medium">{filteredStudents.length}</span> results
              </div>
              <div className="flex justify-center">
                <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      page === 1 ? "text-gray-300" : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    &laquo;
                  </button>
                  {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                    // Logic to show pages around current page
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
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pageNum
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
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
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      page === pageCount ? "text-gray-300" : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    &raquo;
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
            className="absolute z-20 bg-white rounded-md shadow-lg py-1 w-48 border border-gray-200"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
            }}
          >
            <button
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              onClick={handleMenuClose}
            >
              View Details
            </button>
            <button
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              onClick={handleMenuClose}
            >
              Modify Student
            </button>
            <button
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              onClick={handleMenuClose}
            >
              Transaction Info
            </button>
            <button
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              onClick={handleMenuClose}
            >
              Reset Password
            </button>
            <button
              className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
              onClick={handleMenuClose}
            >
              {menuStudent.status.toLowerCase() === "active" ? "Deactivate" : "Activate"}
            </button>
          </div>
        </>
      )}

      {/* Snackbar */}
      {snackbar.open && (
        <div className={`fixed bottom-4 right-4 z-50 py-2 px-4 rounded-md shadow-lg ${
          snackbar.severity === "success" ? "bg-green-500" : "bg-red-500"
        } text-white transition-all duration-300 ease-in-out`}>
          <div className="flex items-center">
            <span>{snackbar.message}</span>
            <button
              onClick={() => setSnackbar({ ...snackbar, open: false })}
              className="ml-4 text-white hover:text-gray-100"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPage;