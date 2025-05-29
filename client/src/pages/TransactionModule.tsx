import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Sidebar as Asidebar } from '../components/Sidebar';
import Footer from '../components/Footer';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

const TransactionModule: React.FC = () => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const exportTransactions = () => {
    const transactions = Array.from({ length: 30 }, (_, index) => ({
      id: index + 1,
      student: `Student ${index + 1}`,
      amount: (Math.random() * 1000 + 500).toFixed(2),
      date: new Date(
        2023,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      ).toLocaleDateString(),
      status: Math.random() > 0.7 ? 'Pending' : 'Paid',
    }));

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Student,Amount,Date,Status\n' +
      transactions
        .map((t) => `${t.id},${t.student},${t.amount},${t.date},${t.status}`)
        .join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <div className="flex flex-grow">
        <aside className="z-[100] hidden md:block fixed top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow z-10">
          <Asidebar />
        </aside>
        <main className="flex-grow p-4 md:p-8 md:ml-64">
          <h1 className="text-3xl font-bold text-indigo-900 mb-6">
            Transaction Module
          </h1>

          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-black">
                  Fee Transactions
                </h2>
                <button
                  onClick={exportTransactions}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    ></path>
                  </svg>
                  Export CSV
                </button>
              </div>

              {/* Sample Transaction Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-black">
                  <thead className="bg-gray-100 text-left">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Student</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 10 }).map((_, index) => {
                      const status = Math.random() > 0.7 ? 'Pending' : 'Paid';
                      return (
                        <tr
                          key={index}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="p-3">{index + 1}</td>
                          <td className="p-3">Student {index + 1}</td>
                          <td className="p-3">
                            ₦{(Math.random() * 100000 + 5000).toFixed(2)}
                          </td>
                          <td className="p-3">
                            {new Date(
                              2023,
                              Math.floor(Math.random() * 12),
                              Math.floor(Math.random() * 28) + 1
                            ).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-semibold 
                              ${status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Snackbar/Toast Notification */}
          {snackbar.open && (
            <div
              className={`fixed bottom-4 right-4 ${snackbar.severity === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-4 py-3 rounded-lg shadow-lg flex items-center z-50`}
            >
              <span>{snackbar.message}</span>
              <button
                onClick={() => setSnackbar({ ...snackbar, open: false })}
                className="ml-4 text-white focus:outline-none"
                title="Close notification"
                aria-label="Close notification"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default TransactionModule;
