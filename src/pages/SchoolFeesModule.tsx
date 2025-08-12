import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Sidebar as Asidebar } from '../components/Sidebar';
import Footer from '../components/Footer';

// Define TypeScript interfaces
interface FeeBill {
  _id: string;
  className: string;
  session: string;
  term: string;
  amount: string;
  description: string;
  dueDate: string;
  feeType: string;
}

interface SchoolClass {
  _id: string;
  className: string;
  schoolId: string;
  students: string[];
  __v?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface FormData {
  className: string;
  session: string;
  term: string;
  amount: string;
  description: string;
  dueDate: string;
  feeType: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

const SchoolFeesModule: React.FC = () => {
  const auth = useAuth();
  const [formData, setFormData] = useState<FormData>({
    className: '',
    session: '',
    term: '',
    amount: '',
    description: '',
    dueDate: '',
    feeType: 'Tuition',
  });
  const [bills, setBills] = useState<FeeBill[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedBill, setSelectedBill] = useState<FeeBill | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL;

  // Get authentication token - prioritize context, fallback to localStorage
  const getAuthToken = () => {
    return auth?.token || localStorage.getItem('token');
  };

  // Fetch classes for the school
  const fetchClasses = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setSnackbar({
          open: true,
          message: 'Authentication required',
          severity: 'error',
        });
        return;
      }

      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/users/getclasse`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch classes: ${response.status}`);
      }

      const data = await response.json();
      console.log('Classes API Response:', data); // Debug log

      // Handle the response structure
      let classesData: SchoolClass[] = [];

      if (Array.isArray(data)) {
        // Direct array response
        classesData = data;
      } else if (data && Array.isArray(data.data)) {
        // Response with data property containing array
        classesData = data.data;
      } else if (data && data.classes && Array.isArray(data.classes)) {
        // Response with classes property containing array
        classesData = data.classes;
      } else {
        console.warn('Unexpected API response structure:', data);
        classesData = [];
      }

      console.log('Processed classes data:', classesData); // Debug log
      setClasses(classesData);

      if (classesData.length === 0) {
        setSnackbar({
          open: true,
          message: 'No classes found for your school',
          severity: 'info',
        });
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setSnackbar({
        open: true,
        message:
          error instanceof Error ? error.message : 'Failed to fetch classes',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all fees for the school
  const fetchAllFees = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setSnackbar({
          open: true,
          message: 'Authentication required',
          severity: 'error',
        });
        return;
      }

      // Only fetch fees if we have a school ID
      if (!auth?.user?.schoolId) {
        setSnackbar({
          open: true,
          message: 'School information not available',
          severity: 'error',
        });
        return;
      }

      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/fee/getchoolFees`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch fees: ${response.status}`);
      }

      const data = await response.json();
      setBills(data.fees || data.data || []);
    } catch (error) {
      console.error('Error fetching fees:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch fee bills',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Raise/Create a new fee bill
  const raiseFee = async (feeData: FormData) => {
    try {
      const token = getAuthToken();
      if (!token) {
        setSnackbar({
          open: true,
          message: 'Authentication required',
          severity: 'error',
        });
        return;
      }

      if (!auth?.user?.schoolId) {
        setSnackbar({
          open: true,
          message: 'School information not available',
          severity: 'error',
        });
        return;
      }

      const payload = {
        ...feeData,
        schoolId: auth.user.schoolId,
      };

      const response = await fetch(`${API_BASE_URL}/api/fee/raise`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to raise fee bill');
      }

      setSnackbar({
        open: true,
        message: result.message || 'Fee bill raised successfully!',
        severity: 'success',
      });

      await fetchAllFees();
      resetForm();
    } catch (error) {
      console.error('Error raising fee:', error);
      setSnackbar({
        open: true,
        message:
          error instanceof Error ? error.message : 'Failed to raise fee bill',
        severity: 'error',
      });
    }
  };

  // Update existing fee bill
  const updateFeeBill = async (billId: string, feeData: FormData) => {
    try {
      const token = getAuthToken();
      if (!token) {
        setSnackbar({
          open: true,
          message: 'Authentication required',
          severity: 'error',
        });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/fees/${billId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feeData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update fee bill');
      }

      setSnackbar({
        open: true,
        message: result.message || 'Fee bill updated successfully!',
        severity: 'success',
      });

      await fetchAllFees();
      resetForm();
      setEditMode(false);
      setSelectedBill(null);
    } catch (error) {
      console.error('Error updating fee:', error);
      setSnackbar({
        open: true,
        message:
          error instanceof Error ? error.message : 'Failed to update fee bill',
        severity: 'error',
      });
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      className: '',
      session: '',
      term: '',
      amount: '',
      description: '',
      dueDate: '',
      feeType: 'Tuition',
    });
  };

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editMode && selectedBill) {
      await updateFeeBill(selectedBill._id, formData);
    } else {
      await raiseFee(formData);
    }
  };

  // Initialize component
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setSnackbar({
            open: true,
            message: 'Please login to access this page',
            severity: 'error',
          });
          return;
        }

        // Only proceed if we have user and school information
        if (auth?.user?.schoolId) {
          await Promise.all([fetchClasses(), fetchAllFees()]);
        }
      } catch (error) {
        console.error('Error initializing component:', error);
        setSnackbar({
          open: true,
          message: 'Failed to initialize page',
          severity: 'error',
        });
      }
    };

    initializeComponent();
  }, [auth?.user?.schoolId]); // Re-run when schoolId changes

  const handleEdit = (bill: FeeBill) => {
    setSelectedBill(bill);
    setFormData({
      className: bill.className,
      session: bill.session,
      term: bill.term,
      amount: bill.amount,
      description: bill.description,
      dueDate: bill.dueDate,
      feeType: bill.feeType,
    });
    setEditMode(true);
  };

 const handleDelete = async () => {
  if (!selectedBill) return;

  try {
    const token = getAuthToken();
    if (!token) {
      setSnackbar({
        open: true,
        message: 'Authentication required',
        severity: 'error',
      });
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/fee/delete/${selectedBill._id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Failed to delete fee bill');
    }

    // Remove the deleted bill from the local state
    setBills(bills.filter((bill) => bill._id !== selectedBill._id));
    setSnackbar({
      open: true,
      message: 'Fee bill deleted successfully',
      severity: 'success',
    });
  } catch (error) {
    console.error('Error deleting fee bill:', error);
    setSnackbar({
      open: true,
      message:
        error instanceof Error ? error.message : 'Error deleting fee bill',
      severity: 'error',
    });
  } finally {
    setDeleteDialogOpen(false);
    setSelectedBill(null);
  }
};

  const cancelEdit = () => {
    setEditMode(false);
    setSelectedBill(null);
    resetForm();
  };

  // Render the component
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header profilePath="/settings" />
      <div className="flex flex-grow">
          <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-0 bg-none">
          <Asidebar />
        </aside>
        <main className="flex-grow p-4 md:p-8 md:ml-64">
          <h1 className="text-3xl font-bold text-indigo-900 mb-6">
            School Fees Module
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fee Bill Form */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="border-b px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editMode ? 'Edit Fee Bill' : 'Create New Fee Bill'}
                </h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleFormSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Class Selection */}
                    <div className="col-span-1">
                      <label
                        htmlFor="class-select"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Class
                      </label>
                      <select
                        id="class-select"
                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        value={formData.className}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            className: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">Select Class</option>
                        {classes.map((cls) => (
                          <option key={cls._id} value={cls.className}>
                            {cls.className}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Term */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Term
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        value={formData.term}
                        onChange={(e) =>
                          setFormData({ ...formData, term: e.target.value })
                        }
                        required
                      >
                        <option value="">Select Term</option>
                        <option value="First">First Term</option>
                        <option value="Second">Second Term</option>
                        <option value="Third">Third Term</option>
                      </select>
                    </div>

                    {/* Academic Year */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Academic Year
                      </label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        placeholder="e.g. 2025"
                        value={formData.session}
                        onChange={(e) =>
                          setFormData({ ...formData, session: e.target.value })
                        }
                        required
                        min="2020"
                        max="2030"
                      />
                    </div>

                    {/* Fee Amount */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fee Amount (₦)
                      </label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        placeholder="e.g. 50000"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    {/* Fee Category */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        value={formData.feeType}
                        onChange={(e) =>
                          setFormData({ ...formData, feeType: e.target.value })
                        }
                        required
                      >
                        <option value="Tuition">Tuition</option>
                        <option value="Books">Books</option>
                        <option value="Uniform">Uniform</option>
                        <option value="Transport">Transport</option>
                        <option value="Boarding">Boarding</option>
                        <option value="Laboratory">Laboratory</option>
                        <option value="Sports">Sports</option>
                        <option value="Examination">Examination</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Due Date */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        value={formData.dueDate}
                        onChange={(e) =>
                          setFormData({ ...formData, dueDate: e.target.value })
                        }
                        required
                      />
                    </div>

                    {/* Description */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        rows={2}
                        placeholder="Brief description about this fee"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        required
                      ></textarea>
                    </div>

                    {/* Submit Button */}
                    <div className="col-span-2 mt-4">
                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                          disabled={loading}
                        >
                          {loading
                            ? 'Processing...'
                            : editMode
                              ? 'Update Bill'
                              : 'Raise Fee Bill'}
                        </button>
                        {editMode && (
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Fee Bills List */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  Fee Bills
                </h2>
                <button
                  onClick={fetchAllFees}
                  className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
                  title="Refresh fee bills"
                  disabled={loading}
                >
                  <svg
                    className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading fee bills...</p>
                  </div>
                ) : bills.length === 0 ? (
                  <div className="text-center py-8 text-gray-700">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="mt-2 font-medium">No fee bills created yet</p>
                    <p className="text-sm mt-1 text-gray-600">
                      Create your first fee bill using the form
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {bills.map((bill) => (
                      <div
                        key={bill._id}
                        className="border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-gray-800 text-lg">
                              {bill.className} - {bill.term} Term {bill.session}
                            </h3>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(bill)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Edit Fee Bill"
                                aria-label="Edit Fee Bill"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedBill(bill);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Delete Fee Bill"
                                aria-label="Delete Fee Bill"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full mt-2">
                            {bill.feeType}
                          </span>
                          <p className="text-gray-700 mt-2 text-sm">
                            {bill.description}
                          </p>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t">
                            <span className="font-bold text-gray-800">
                              ₦{parseFloat(bill.amount).toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-700 font-medium">
                              Due: {new Date(bill.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
{/* Delete Confirmation Dialog */}
{deleteDialogOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Delete Fee Bill
      </h3>
      <p className="text-gray-700 mb-6">
        Are you sure you want to delete this fee bill? This action
        cannot be undone.
      </p>
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => setDeleteDialogOpen(false)}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}

          {/* Snackbar/Toast Notification */}
          {snackbar.open && (
            <div
              className={`fixed bottom-4 right-4 max-w-md w-full bg-white rounded-lg shadow-lg border-l-4 ${
                snackbar.severity === 'success'
                  ? 'border-green-500'
                  : snackbar.severity === 'error'
                    ? 'border-red-500'
                    : snackbar.severity === 'warning'
                      ? 'border-yellow-500'
                      : 'border-blue-500'
              } z-50 transition-opacity duration-300`}
            >
              <div className="p-4 flex items-center">
                {snackbar.severity === 'success' ? (
                  <svg
                    className="h-6 w-6 text-green-500 mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : snackbar.severity === 'error' ? (
                  <svg
                    className="h-6 w-6 text-red-500 mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : snackbar.severity === 'warning' ? (
                  <svg
                    className="h-6 w-6 text-yellow-500 mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.876c1.02 0 1.958-.417 2.653-1.161a4.006 4.006 0 00.978-3.224L20.5 8.5a4.006 4.006 0 00-.978-3.224A3.99 3.99 0 0017.87 4H6.13a3.99 3.99 0 00-1.652 1.276A4.006 4.006 0 003.5 8.5l.93 6.115a4.006 4.006 0 00.978 3.224A3.99 3.99 0 006.062 19z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6 text-blue-500 mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                <p className="text-gray-800">{snackbar.message}</p>
                <button
                  onClick={() => setSnackbar({ ...snackbar, open: false })}
                  className="ml-auto text-gray-400 hover:text-gray-600"
                  title="Close notification"
                  aria-label="Close notification"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default SchoolFeesModule;
