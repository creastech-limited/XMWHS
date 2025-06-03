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

    setSnackbar({
      open: true,
      message: 'Transactions exported successfully!',
      severity: 'success',
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <div className="flex flex-grow">
        <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-none">
          <Asidebar />
        </aside>
        <main className="flex-grow p-4 md:p-8 md:ml-64 overflow-hidden">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-indigo-900">
              Transaction Module
            </h1>
            <p className="text-gray-600 text-sm md:text-base mt-1">
              View and manage all fee transactions
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <h2 className="text-lg md:text-xl font-semibold text-black">
                  Fee Transactions
                </h2>
                <button
                  onClick={exportTransactions}
                  className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200 w-full md:w-auto"
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

              {/* Scrollable table container */}
              <div className="relative">
                <div className="block md:hidden bg-gray-50 px-2 py-1 text-xs text-gray-600 border-b border-gray-200">
              Scroll horizontally to view all columns
              </div>
                <div className="overflow-x-auto pb-2">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.from({ length: 10 }).map((_, index) => {
                          const status = Math.random() > 0.7 ? 'Pending' : 'Paid';
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                Student {index + 1}
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                ₦{(Math.random() * 100000 + 5000).toFixed(2)}
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(
                                  2023,
                                  Math.floor(Math.random() * 12),
                                  Math.floor(Math.random() * 28) + 1
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span
                                  className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold 
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

              {/* Pagination */}
              <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
                <div className="text-sm text-gray-600">
                  Showing 1 to 10 of 100 entries
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 border rounded-md text-sm bg-gray-100 hover:bg-gray-200">
                    Previous
                  </button>
                  <button className="px-3 py-1 border rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700">
                    1
                  </button>
                  <button className="px-3 py-1 border rounded-md text-sm hover:bg-gray-100">
                    2
                  </button>
                  <button className="px-3 py-1 border rounded-md text-sm hover:bg-gray-100">
                    3
                  </button>
                  <button className="px-3 py-1 border rounded-md text-sm hover:bg-gray-100">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Snackbar/Toast Notification */}
          {snackbar.open && (
            <div
              className={`fixed bottom-4 right-4 ${snackbar.severity === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-4 py-3 rounded-lg shadow-lg flex items-center z-50 max-w-xs md:max-w-sm`}
            >
              <span className="text-sm">{snackbar.message}</span>
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