import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Sidebar as Asidebar } from '../components/Sidebar';
import Footer from '../components/Footer';

// Define TypeScript interfaces
interface FeeBill {
  _id: string;
  class: string;
  year: string;
  term: string;
  feeAmount: string;
  description: string;
  dueDate: string;
  category: string;
}

interface FormData {
  class: string;
  year: string;
  term: string;
  feeAmount: string;
  description: string;
  dueDate: string;
  category: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

const SchoolFeesModule: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    class: '',
    year: '',
    term: '',
    feeAmount: '',
    description: '',
    dueDate: '',
    category: 'Tuition'
  });
  const [bills, setBills] = useState<FeeBill[]>([]);
  const [selectedBill, setSelectedBill] = useState<FeeBill | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem('token');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let response;
      if (editMode && selectedBill) {
        response = await fetch(`${API_BASE_URL}/api/fees/${selectedBill._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/fees`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
      }
      const result = await response.json();
      if (!response.ok) {
        setSnackbar({ open: true, message: result.message || "Operation failed", severity: "error" });
      } else {
        setSnackbar({ open: true, message: result.message || "Operation successful!", severity: "success" });
        // Refresh fee bills
        fetchBills();
        setEditMode(false);
      }
    } catch (error) {
      console.error("Error submitting fee bill:", error);
      setSnackbar({ open: true, message: "An error occurred", severity: "error" });
    }
    setFormData({ class: '', year: '', term: '', feeAmount: '', description: '', dueDate: '', category: 'Tuition' });
  };
  
  const fetchBills = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/fees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBills(data);
      }
    } catch (error) {
      console.error("Error fetching fee bills:", error);
    }
  };

  // Call fetchBills when the component mounts
  useEffect(() => {
    fetchBills();
  }, []);

  const handleEdit = (bill: FeeBill) => {
    setSelectedBill(bill);
    setFormData(bill);
    setEditMode(true);
  };

  const handleDelete = async () => {
    if (!selectedBill) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/fees/${selectedBill._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setBills(bills.filter(bill => bill._id !== selectedBill._id));
        setSnackbar({ open: true, message: "Fee bill deleted", severity: "success" });
      }
    } catch (error) {
      console.error("Error deleting fee bill:", error);
      setSnackbar({ open: true, message: "Error deleting fee bill", severity: "error" });
    }
    setDeleteDialogOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-grow">
        <Asidebar />
        <main className="flex-grow p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">School Fees Module</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fee Bill Form */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="border-b px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editMode ? "Edit Fee Bill" : "Create New Fee Bill"}
                </h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleFormSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Class Selection */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                      <select
                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        value={formData.class}
                        onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                      >
                        <option value="">Select Class</option>
                        {["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"].map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Term */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        placeholder="e.g. First"
                        value={formData.term}
                        onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                      />
                    </div>
                    
                    {/* Academic Year */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        placeholder="e.g. 2025"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      />
                    </div>
                    
                    {/* Fee Amount */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fee Amount (₦)</label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        placeholder="e.g. 50000"
                        value={formData.feeAmount}
                        onChange={(e) => setFormData({ ...formData, feeAmount: e.target.value })}
                      />
                    </div>
                    
                    {/* Fee Category */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="Tuition">Tuition</option>
                        <option value="Books">Books</option>
                        <option value="Uniform">Uniform</option>
                        <option value="Transport">Transport</option>
                        <option value="Boarding">Boarding</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    {/* Due Date */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      />
                    </div>
                    
                    {/* Description */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        rows={2}
                        placeholder="Brief description about this fee"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      ></textarea>
                    </div>
                    
                    {/* Submit Button */}
                    <div className="col-span-2 mt-4">
                      <button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                      >
                        {editMode ? 'Update Bill' : 'Create Bill'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Fee Bills List */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="border-b px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-800">Fee Bills</h2>
              </div>
              <div className="p-6">
                {bills.length === 0 ? (
                  <div className="text-center py-8 text-gray-700">
                    <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2 font-medium">No fee bills created yet</p>
                    <p className="text-sm mt-1 text-gray-600">Create your first fee bill using the form</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {bills.map(bill => (
                      <div key={bill._id} className="border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-gray-800 text-lg">
                              {bill.class} - {bill.term} Term {bill.year}
                            </h3>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleEdit(bill)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => { setSelectedBill(bill); setDeleteDialogOpen(true); }}
                                className="text-red-600 hover:text-red-800 p-1"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full mt-2">
                            {bill.category}
                          </span>
                          <p className="text-gray-700 mt-2 text-sm">{bill.description}</p>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t">
                            <span className="font-bold text-gray-800">
                              ₦{parseFloat(bill.feeAmount).toLocaleString()}
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
                <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Fee Bill</h3>
                <p className="text-gray-700 mb-6">Are you sure you want to delete this fee bill? This action cannot be undone.</p>
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
            <div className={`fixed bottom-4 right-4 max-w-md w-full bg-white rounded-lg shadow-lg border-l-4 ${
              snackbar.severity === 'success' ? 'border-green-500' : 'border-red-500'
            } z-50 transition-opacity duration-300`}>
              <div className="p-4 flex items-center">
                {snackbar.severity === 'success' ? (
                  <svg className="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <p className="text-gray-800">{snackbar.message}</p>
                <button 
                  onClick={() => setSnackbar({ ...snackbar, open: false })}
                  className="ml-auto text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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