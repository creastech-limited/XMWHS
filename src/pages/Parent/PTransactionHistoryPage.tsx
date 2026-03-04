import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Header } from '../../components/Header';
import Psidebar from '../../components/Psidebar';
import Footer from '../../components/Footer';
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  Share2,
  FileText,
  Receipt,
  X,

} from 'lucide-react';
import type { Transaction, TransactionStats, User, UserData } from '../../types';
import { getUserDetails, getUserTransactions, getUserWallet } from '../../services';
import { jsPDF } from 'jspdf';




const TransactionHistoryPage: React.FC = () => {
  const [userData, setUserData] = useState<UserData>({
    username: "User",
    email: "",
    balance: 0,
    lastTransactions: []
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);


  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'info' | 'success' | 'warning' | 'error'
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionStats, setTransactionStats] = useState<TransactionStats>({
    totalTransactions: 0,
    totalCredit: {
      success: 0,
      pending: 0
    },
    totalDebit: {
      success: 0,
      pending: 0
    }
  });

  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const getAuthToken = (): string | null => {
    return localStorage.getItem('token');
  };

  const fetchWalletBalance = async (authToken: string): Promise<void> => {
    if (!authToken) return;

    try {
      const response = await getUserWallet();


      const availableBalance = response?.data?.availableBalance ?? response?.data?.balance ?? 0;

      setUserData(prev => ({
        ...prev,
        // Ensure we treat it as a number
        balance: Number(availableBalance)
      }));
    } catch (error) {
      console.error('Error fetching wallet balance:', error);

    }
  };

  const handleDownloadReceipt = async () => {
  if (!selectedTxn) return;

  try {
    // 1. Create a fresh PDF (A4 size)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const centerX = 105; // Center of A4 page

    // 2. Add Branding (Logo placeholder or Text)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text("XPAY DIGITAL", centerX, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text("TRANSACTION RECEIPT", centerX, 38, { align: 'center' });

    // 3. Draw a Decorative Line
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.line(20, 45, 190, 45);

    // 4. Amount Section
    doc.setFontSize(12);
    doc.text("AMOUNT", centerX, 60, { align: 'center' });
    doc.setFontSize(28);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(`NGN ${selectedTxn.amount.toLocaleString()}`, centerX, 72, { align: 'center' });

    // 5. Status Box
    doc.setFillColor(240, 253, 244); // Light Green
    doc.roundedRect(80, 80, 50, 8, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(22, 101, 52); // Green 800
    doc.text("SUCCESSFUL", centerX, 85.5, { align: 'center' });

    // 6. Details Table
    const startY = 105;
    const rowHeight = 12;
    const details = [
      { label: "DATE", value: formatDate(selectedTxn.createdAt) },
      { label: "REFERENCE", value: selectedTxn.reference },
      { label: "TYPE", value: selectedTxn.category.toUpperCase() },
      { label: "DESCRIPTION", value: selectedTxn.description },
      { label: "STATUS", value: selectedTxn.status.toUpperCase() }
    ];

    doc.setFontSize(10);
    details.forEach((item, i) => {
      const currentY = startY + (i * rowHeight);
      
      // Label
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(item.label, 25, currentY);
      
      // Value
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(String(item.value), 185, currentY, { align: 'right' });
      
      // Thin separator line
      doc.setDrawColor(248, 250, 252);
      doc.line(25, currentY + 4, 185, currentY + 4);
    });

    // 7. Footer
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Thank you for using XPay Digital.", centerX, 200, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString()}`, centerX, 205, { align: 'center' });

    // 8. Save
    doc.save(`XPay_Receipt_${selectedTxn.reference}.pdf`);

  } catch (err) {
    console.error("Manual PDF Error:", err);
    alert("Could not generate PDF. Please try again.");
  }
};


// Handle sharing the receipt as an image
const handleShareReceipt = async () => {
  if (!selectedTxn) return;

  try {
    // 1. Create the PDF (This is our 'safe' middle-man)
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: [100, 150] }); // Custom receipt size
    const centerX = 50;

    // --- DRAWING LOGIC (Identical to your PDF download) ---
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 100, 150, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text("XPAY DIGITAL", centerX, 20, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("TRANSACTION RECEIPT", centerX, 26, { align: 'center' });

    doc.setDrawColor(226, 232, 240);
    doc.line(10, 32, 90, 32);

    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text(`N${selectedTxn.amount.toLocaleString()}`, centerX, 45, { align: 'center' });

    // Details
    doc.setFontSize(9);
    doc.text(`Ref: ${selectedTxn.reference}`, centerX, 55, { align: 'center' });
    doc.text(`Date: ${formatDate(selectedTxn.createdAt)}`, centerX, 62, { align: 'center' });
    doc.text(`Type: ${selectedTxn.category.toUpperCase()}`, centerX, 69, { align: 'center' });

    // 2. Convert PDF to Image Data
    // We use the internal 'output' method to get a dataurl
    const imgData = doc.output('datauristring');

    // 3. Convert DataURL to a Blob/File for sharing
    const response = await fetch(imgData);
    const blob = await response.blob();
    const file = new File([blob], `XPay_Receipt_${selectedTxn.reference}.png`, { type: 'image/png' });

    // 4. Share
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'XPay Receipt',
      });
    } else {
      // Fallback: Download PNG
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `XPay_Receipt_${selectedTxn.reference}.png`;
      link.click();
    }
  } catch (err) {
    console.error("Share Error:", err);
    alert("Could not generate shareable image.");
  }
};

  // Fetch user profile and transactions on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      const authToken = getAuthToken();
      if (!authToken) {
        setError('Not authenticated. Please log in.');
        setLoading(false);
        setSnackbar({
          open: true,
          message: 'You need to be logged in to access this page',
          severity: 'error'
        });
        return;
      }

      try {
        const responseData = await getUserDetails();

        if (responseData && responseData.user) {
          const pData = (responseData.user.data || responseData.user || {}) as User;

          setUserData({
            username: pData.firstName
              ? `${pData.firstName} ${pData.lastName || ''}`.trim()
              : (pData.name as string) || "User",
            balance: 0,
            email: (pData.email as string) || "",
            lastTransactions: Array.isArray(pData.transactions) ? pData.transactions : []
          });

          await fetchWalletBalance(authToken);
          fetchTransactions();
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile. Please try again.');
        setSnackbar({
          open: true,
          message: axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : 'Failed to fetch user profile',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const fetchTransactions = async (): Promise<void> => {
    try {


      const data = await getUserTransactions();

      if (data.success && data.data) {
        setTransactions(data.data);

        setTransactionStats({
          totalTransactions: data.data.length,
          totalCredit: {
            success: data.data
              .filter((t: Transaction) => t.category === 'credit' && t.status === 'success')
              .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
            pending: data.data
              .filter((t: Transaction) => t.category === 'credit' && t.status === 'pending')
              .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
          },
          totalDebit: {
            success: data.data
              .filter((t: Transaction) => t.category === 'debit' && t.status === 'success')
              .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
            pending: data.data
              .filter((t: Transaction) => t.category === 'debit' && t.status === 'pending')
              .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
          }
        });
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again.');
      setSnackbar({
        open: true,
        message: (axios.isAxiosError(err) && err.response?.data?.message) || 'Failed to load transactions',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  const handleChangePage = (newPage: number): void => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (value: string): void => {
    setRowsPerPage(parseInt(value, 10));
    setPage(0);
  };

  const handleFilterChange = (value: string): void => {
    setFilter(value);
    setPage(0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const filteredTransactions = transactions.filter(txn => {
    if (filter === 'all') {
      return true;
    }
    else if (filter === 'success' && txn.status !== 'success') return false;
    else if (filter === 'pending' && txn.status !== 'pending') return false;
    else if (filter === 'credit' && txn.category !== 'credit') return false;
    else if (filter === 'debit' && txn.category !== 'debit') return false;

    if (searchTerm && !txn.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  const renderStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";

    if (status === 'success') {
      return (
        <span className={`${baseClasses} bg-green-100 text-green-800 flex items-center gap-1`}>
          <CheckCircle className="w-3 h-3" />
          Success
        </span>
      );
    } else if (status === 'pending') {
      return (
        <span className={`${baseClasses} bg-yellow-100 text-yellow-800 flex items-center gap-1`}>
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    }
    return (
      <span className={`${baseClasses} bg-red-100 text-red-800 flex items-center gap-1`}>
        <XCircle className="w-3 h-3" />
        Failed
      </span>
    );
  };

  const renderTypeBadge = (type: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";

    if (type === 'credit') {
      return (
        <span className={`${baseClasses} bg-blue-100 text-blue-800 flex items-center gap-1`}>
          <ArrowDown className="w-3 h-3" />
          Credit
        </span>
      );
    }
    return (
      <span className={`${baseClasses} bg-gray-100 text-gray-800 flex items-center gap-1`}>
        <ArrowUp className="w-3 h-3" />
        Debit
      </span>
    );
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSnackbarClose = (): void => {
    setSnackbar({ ...snackbar, open: false });
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-4/5 max-w-xl">
          <p className="mb-4 text-center text-lg font-medium">
            Loading ...
          </p>
          <div className="w-full h-1 bg-gray-200 rounded">
            <div className="h-1 bg-indigo-900 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header PsettingsPage="/psettings" />

      <div className="flex flex-1 relative">
        <div className="z-[100] fixed top-20 left-0 h-[calc(100vh-6rem)]">
          <Psidebar />
        </div>

        <main className="md:ml-65 flex-1 p-2 md:p-6 overflow-x-hidden">
          {/* User info card */}
          <div className="bg-white rounded-xl shadow-sm p-3 md:p-4 mb-4 md:mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base md:text-lg font-medium text-gray-800">Welcome, {userData.username}</h2>
                <p className="text-xs md:text-sm text-gray-600">{userData.email}</p>
              </div>
              <div className="bg-blue-50 px-3 py-2 rounded-lg">
                <p className="text-xs md:text-sm text-gray-600">Wallet Balance</p>
                <p className="text-lg md:text-xl font-bold text-blue-700">₦{(userData.balance ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Transaction history section */}
          <div className="bg-white rounded-xl shadow-sm p-3 md:p-6 mb-4 md:mb-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-2">
                <Receipt className="text-blue-600 w-5 h-5 md:w-6 md:h-6" />
                <h1 className="text-lg md:text-xl font-bold text-gray-800">Transaction History</h1>
              </div>

              <div className="flex flex-col gap-2 w-full md:w-auto">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="text-gray-400 w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    className="text-sm md:text-base text-gray-600 pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
                <select
                  aria-label="Filter transactions"
                  className="text-sm md:text-base text-gray-500 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-auto"
                  value={filter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                >
                  <option value="all">All Transactions</option>
                  <option value="success">Success</option>
                  <option value="pending">Pending</option>
                  <option value="credit">Credit Only</option>
                  <option value="debit">Debit Only</option>
                </select>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
              <div className="bg-blue-50 p-3 rounded-lg shadow-sm">
                <p className="text-xs md:text-sm font-medium text-blue-800">Total Transactions</p>
                <p className="text-lg md:text-xl font-bold text-blue-900">{transactionStats.totalTransactions}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg shadow-sm">
                <p className="text-xs md:text-sm font-medium text-green-800">Total Credit</p>
                <p className="text-lg md:text-xl font-bold text-green-900">₦{transactionStats.totalCredit.success.toLocaleString()}</p>
                <p className="text-xs text-green-700">Pending: ₦{transactionStats.totalCredit.pending.toLocaleString()}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg shadow-sm">
                <p className="text-xs md:text-sm font-medium text-red-800">Total Debit</p>
                <p className="text-lg md:text-xl font-bold text-red-900">₦{transactionStats.totalDebit.success.toLocaleString()}</p>
                <p className="text-xs text-red-700">Pending: ₦{transactionStats.totalDebit.pending.toLocaleString()}</p>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full divide-y divide-gray-200" style={{ minWidth: '900px' }}>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[120px]">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[180px]">Reference</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[100px]">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-[120px]">Amount (₦)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[100px]">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-[100px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((txn) => (
                        <tr key={txn._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(txn.createdAt)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{txn.reference}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{renderTypeBadge(txn.category)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{txn.description}</td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm font-bold text-right ${txn.category === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                            {txn.category === 'credit' ? '+' : '-'}₦{txn.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{renderStatusBadge(txn.status)}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => { setSelectedTxn(txn); setIsReceiptOpen(true); }}
                              className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg flex items-center gap-1 mx-auto"
                            >
                              <FileText className="w-4 h-4" />
                              <span className="text-xs font-bold">Receipt</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">No transactions found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Pagination Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 bg-white border border-gray-100 p-4 rounded-xl shadow-sm">

              {/* Left: Results Info */}
              <div className="text-xs md:text-sm text-gray-500 font-medium order-2 sm:order-1">
                Showing <span className="text-gray-900">{page * rowsPerPage + 1}</span> to{' '}
                <span className="text-gray-900">
                  {Math.min((page + 1) * rowsPerPage, filteredTransactions.length)}
                </span>{' '}
                of <span className="text-gray-900">{filteredTransactions.length}</span> results
              </div>

              {/* Right: Controls */}
              <div className="flex items-center gap-3 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleChangePage(page - 1)}
                    disabled={page === 0}
                    className={`flex items-center justify-center px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 ${page === 0
                      ? 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600 active:scale-95 shadow-sm'
                      }`}
                  >
                    Previous
                  </button>

                  <button
                    onClick={() => handleChangePage(page + 1)}
                    disabled={(page + 1) * rowsPerPage >= filteredTransactions.length}
                    className={`flex items-center justify-center px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 ${(page + 1) * rowsPerPage >= filteredTransactions.length
                      ? 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600 active:scale-95 shadow-sm'
                      }`}
                  >
                    Next
                  </button>
                </div>

                {/* Rows Per Page Selector */}
                <div className="flex items-center gap-2 border-l pl-3 border-gray-100">
                  <select
                    className="text-xs md:text-sm font-semibold border border-gray-200 rounded-lg px-2 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                    value={rowsPerPage}
                    onChange={(e) => handleChangeRowsPerPage(e.target.value)}
                  >
                    {[5, 10, 25, 50].map((size) => (
                      <option key={size} value={size}>
                        {size} / page
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />

      <style>
        {`
    .receipt-capture-area {
      /* Force standard colors to override OKLCH variables */
      color: #1e293b !important; 
      background-color: #ffffff !important;
    }
    /* If you are using Tailwind buttons or text-indigo-600 inside the ref */
    .receipt-capture-area * {
      --tw-text-opacity: 1 !important;
      color: rgb(30, 41, 59) !important; /* Fallback for all text */
    }
  `}
      </style>

      {isReceiptOpen && selectedTxn && (
        /* 1. Added onClick to the background overlay to close when clicking outside */
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
          onClick={() => setIsReceiptOpen(false)}
        >
          {/* 2. Important: Added onClick={(e) => e.stopPropagation()} to the white box 
        so clicking inside the receipt doesn't trigger the background close */}
          <div
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >

            {/* 3. Added a Header with a Close (X) Button */}
            <div className="flex justify-between items-center p-4 border-b border-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction Details</span>
              <button
                onClick={() => setIsReceiptOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            {/* --- SECTION TO BE CAPTURED --- */}
            <div className="p-8 bg-white relative receipt-capture-area" ref={receiptRef}>
              <div className="text-center mb-6 relative z-10">
                <img
                  src="/xpay.jpeg"
                  alt="xpay-logo"
                  crossOrigin="anonymous"
                  className='w-20 h-20 mx-auto my-2'
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <h2 className="text-xl font-black text-slate-800 uppercase">XPay Receipt</h2>
              </div>

              <div className="text-center py-5 bg-slate-50 rounded-2xl mb-6 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                <h1 className="text-3xl font-black text-slate-900">₦{selectedTxn.amount.toLocaleString()}</h1>
              </div>

              <div className="space-y-3 relative z-10 text-left">
                {[
                  { label: 'Date', value: formatDate(selectedTxn.createdAt) },
                  { label: 'Ref', value: selectedTxn.reference, mono: true },
                  { label: 'Type', value: selectedTxn.category.toUpperCase() },
                  { label: 'Status', value: selectedTxn.status.toUpperCase(), color: 'text-green-600' }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-50 pb-2">
                    <span className="font-medium text-slate-400">{item.label}</span>
                    <span className={`font-bold ${item.mono ? 'font-mono' : ''} ${item.color || 'text-slate-700'}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-4 border-t border-dashed border-slate-200 text-center">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Powered by XPay Digital</p>
              </div>
            </div>

            {/* --- ACTION BUTTONS (Outside Ref) --- */}
            <div className="p-4 bg-slate-50 flex gap-3">
              <button
                onClick={handleDownloadReceipt}
                className="flex-1 bg-white border border-slate-200 py-3 rounded-xl font-bold text-slate-600 text-xs flex items-center justify-center gap-2 hover:bg-slate-100 transition-all"
              >
                <Download size={14} /> PDF
              </button>
              <button
                onClick={handleShareReceipt}
                className="flex-1 bg-indigo-600 py-3 rounded-xl font-bold text-white text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Snackbar */}
      {snackbar.open && (
        <div className={`fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 px-4 py-3 rounded-lg shadow-lg z-[400] ${snackbar.severity === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{snackbar.message}</span>
            <button onClick={handleSnackbarClose} className="ml-2"><XCircle className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistoryPage;