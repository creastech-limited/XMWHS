import React, { useState } from 'react';
import {
  AcademicCapIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { Header } from '../components/Header';
import Psidebar from '../components/Psidebar';
import Footer from '../components/Footer';

// Define TypeScript interfaces
interface Bill {
  id: number;
  description: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'unpaid';
}

interface BillsData {
  [key: string]: Bill[];
}

interface Summary {
  total: number;
  paid: number;
  remaining: number;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

const PaySchoolBillsPage: React.FC = () => {
  // Dummy bills data per kid
  const initialBills: BillsData = {
    Alice: [
      { id: 1, description: "Tuition Fee", amount: 20000, dueDate: "2025-03-15", status: "unpaid" },
      { id: 2, description: "Library Fee", amount: 5000, dueDate: "2025-03-15", status: "unpaid" }
    ],
    Bob: [
      { id: 3, description: "Tuition Fee", amount: 21000, dueDate: "2025-03-15", status: "unpaid" },
      { id: 4, description: "Sports Fee", amount: 7000, dueDate: "2025-03-15", status: "unpaid" }
    ],
    Charlie: [
      { id: 5, description: "Tuition Fee", amount: 22000, dueDate: "2025-03-15", status: "unpaid" },
      { id: 6, description: "Lab Fee", amount: 8000, dueDate: "2025-03-15", status: "unpaid" }
    ]
  };

  const [selectedKid, setSelectedKid] = useState<string>('');
  const [bills, setBills] = useState<BillsData>(initialBills);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  const handleKidChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedKid(event.target.value);
  };

  const handlePay = (billId: number) => {
    // Update the status of the bill to "paid"
    if (!selectedKid) return;
    
    setBills((prevBills) => {
      const updatedBills = { ...prevBills };
      updatedBills[selectedKid] = updatedBills[selectedKid].map((bill) => {
        if (bill.id === billId) {
          return { ...bill, status: 'paid' };
        }
        return bill;
      });
      return updatedBills;
    });
    
    setSnackbar({ 
      open: true, 
      message: 'Bill paid successfully!', 
      severity: 'success' 
    });
  };

  // Calculate total bills and paid bills
  const calculateSummary = (): Summary => {
    if (!selectedKid) return { total: 0, paid: 0, remaining: 0 };
    
    const kidBills = bills[selectedKid];
    const total = kidBills.reduce((sum, bill) => sum + bill.amount, 0);
    const paid = kidBills
      .filter(bill => bill.status === 'paid')
      .reduce((sum, bill) => sum + bill.amount, 0);
    
    return {
      total,
      paid,
      remaining: total - paid
    };
  };

  const summary = calculateSummary();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen bg-gray-50 flex flex-col">
           {/* Header fixed at top */}
           <Header />

        <div className="flex flex-grow gap-6">
          {/* Sidebar */}
          <Psidebar />
          
          {/* Main Content */}
          <div className="flex-grow md:ml-64">
            <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
              <h1 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 to-indigo-600">
                Pay School Bills
              </h1>
              <p className="text-center text-gray-600 mb-8">
                View and pay your children's school fees in one place.
              </p>

              <div className="mb-8">
                <label htmlFor="select-kid" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Child
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <AcademicCapIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <select
                    id="select-kid"
                    value={selectedKid}
                    onChange={handleKidChange}
                    className="pl-10 block w-full rounded-lg border-gray-300 border py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a child</option>
                    {Object.keys(bills).map((kidName) => (
                      <option key={kidName} value={kidName}>
                        {kidName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedKid && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                      <p className="text-sm text-gray-500 mb-1">Total Bills</p>
                      <p className="text-2xl font-bold text-gray-800">
                        ₦{summary.total.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Term: January - March 2025
                      </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                      <p className="text-sm text-gray-500 mb-1">Paid</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₦{summary.paid.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {summary.total > 0 ? ((summary.paid / summary.total) * 100).toFixed(0) : 0}% of total
                      </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                      <p className="text-sm text-gray-500 mb-1">Remaining</p>
                      <p className="text-2xl font-bold text-red-600">
                        ₦{summary.remaining.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Due by March 15, 2025
                      </p>
                    </div>
                  </div>

                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    {selectedKid}'s Bills
                  </h2>
                  <hr className="mb-6" />

                  {/* Bills Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {bills[selectedKid].map((bill) => (
                      <div 
                        key={bill.id} 
                        className={`bg-white rounded-xl shadow-sm p-6 
                          ${bill.status === 'paid' ? 'border-2 border-green-500' : 'border border-gray-100'}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                              <h3 className="text-lg font-semibold text-gray-800">
                                {bill.description}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-gray-500" />
                              <p className="text-sm text-gray-500">
                                Due: {bill.dueDate}
                              </p>
                            </div>
                          </div>
                          <span className={`
                            px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1
                            ${bill.status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'}
                          `}>
                            {bill.status === 'paid' 
                              ? <><CheckCircleIcon className="h-3 w-3" /> Paid</> 
                              : <><ExclamationCircleIcon className="h-3 w-3" /> Unpaid</>
                            }
                          </span>
                        </div>
                        <hr className="my-4" />
                        <div className="flex justify-between items-center">
                          <p className="text-2xl font-bold text-gray-800">
                            ₦{bill.amount.toLocaleString()}
                          </p>
                          {bill.status === 'unpaid' ? (
                            <button 
                              onClick={() => handlePay(bill.id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg shadow-sm transition duration-150"
                            >
                              Pay Now
                            </button>
                          ) : (
                            <button 
                              disabled
                              className="border border-green-500 text-green-600 py-2 px-6 rounded-lg opacity-75 cursor-not-allowed"
                            >
                              Paid
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!selectedKid && (
                <div className="flex flex-col items-center justify-center py-16">
                  <AcademicCapIcon className="h-16 w-16 text-indigo-300 mb-4" />
                  <p className="text-gray-500 text-lg">
                    Please select a child to view their bills
                  </p>
                </div>
              )}
            </div>
            
            {/* Snackbar */}
            {snackbar.open && (
              <div className={`fixed bottom-4 right-4 rounded-lg shadow-lg px-6 py-4 
                ${snackbar.severity === 'success' ? 'bg-green-500' : 'bg-red-500'} 
                text-white flex items-center gap-2`}
              >
                {snackbar.severity === 'success' ? (
                  <CheckCircleIcon className="h-5 w-5" />
                ) : (
                  <ExclamationCircleIcon className="h-5 w-5" />
                )}
                <p>{snackbar.message}</p>
                <button 
                  onClick={() => setSnackbar({ ...snackbar, open: false })}
                  className="ml-4 text-white hover:text-gray-200"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default PaySchoolBillsPage;