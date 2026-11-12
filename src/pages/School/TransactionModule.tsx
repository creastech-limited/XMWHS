import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toBlob, toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Download, Share2, FileText, RefreshCw } from 'lucide-react';
import autoTable from 'jspdf-autotable';
import { getUserTransactions } from '../../services';
import type { Transaction, TransactionsResponse } from '../../types/user';

const TransactionModule: React.FC = () => {
  const auth = useAuth();
  const receiptRef = useRef<HTMLDivElement>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Server-side pagination info
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Get authentication token
  const getAuthToken = useCallback((): string | null => {
    if (auth?.token) return auth.token;
    return localStorage.getItem('token');
  }, [auth?.token]);

  // Fetch ONE page of transactions from the API
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        console.warn('No authentication token found');
      }

      const data: TransactionsResponse = await getUserTransactions({
        page: currentPage,
        limit: itemsPerPage,
      });

      if (data.success === false) {
        setTransactions([]);
        return;
      }

      // The list can come back under either key
      const list = data.data ?? data.transactions ?? [];
      setTransactions(list);

      // Look for the total in the common places
      const total = data.pagination?.total ?? data.total ?? data.totalCount;
      const pages =
        data.pagination?.totalPages ??
        data.totalPages ??
        (total != null ? Math.ceil(total / itemsPerPage) : undefined);

      if (total != null) {
        setTotalItems(total);
        setTotalPages(Math.max(1, pages ?? 1));
      } else {
        // Backend sent no total: a full page means there may be a next one
        const seenSoFar = (currentPage - 1) * itemsPerPage + list.length;
        setTotalItems(seenSoFar);
        setTotalPages(list.length === itemsPerPage ? currentPage + 1 : currentPage);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, currentPage, itemsPerPage]);

  // Refetch whenever the page or page size changes
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // --- RECEIPT EXPORT LOGIC ---

  const downloadImage = async () => {
    if (!receiptRef.current) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { backgroundColor: '#ffffff', cacheBust: true });
      const link = document.createElement('a');
      link.download = `XPAY-Receipt-${selectedTxn?.reference || 'txn'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Image export failed', err);
    }
  };

  const downloadPDF = async () => {
    if (!receiptRef.current) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { backgroundColor: '#ffffff' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      // Calculate height to maintain aspect ratio, roughly centered
      pdf.addImage(dataUrl, 'PNG', 10, 10, width - 20, 150);
      pdf.save(`XPAY-Receipt-${selectedTxn?.reference || 'txn'}.pdf`);
    } catch (err) {
      console.error('PDF export failed', err);
    }
  };

  const shareReceipt = async () => {
    if (!receiptRef.current || !selectedTxn) return;
    try {
      const blob = await toBlob(receiptRef.current, { backgroundColor: '#ffffff' });
      if (!blob) return;
      const file = new File([blob], `XPAY_Receipt.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Transaction Receipt',
          text: `Receipt for transaction: ${selectedTxn.reference}`,
        });
      } else {
        alert("Sharing is not supported on this browser. Please download the image instead.");
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // Formatters
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const getTransactionName = (transaction: Transaction) => {
    const raw = transaction as unknown as Record<string, unknown>;
    const nestedRecipient = (typeof raw.recipient === 'object' && raw.recipient !== null ? raw.recipient : undefined) as Record<string, unknown> | undefined;
    const nestedCustomer = (typeof raw.customer === 'object' && raw.customer !== null ? raw.customer : undefined) as Record<string, unknown> | undefined;
    const nestedStudent = (typeof raw.student === 'object' && raw.student !== null ? raw.student : undefined) as Record<string, unknown> | undefined;
    const nestedUser = (typeof raw.user === 'object' && raw.user !== null ? raw.user : undefined) as Record<string, unknown> | undefined;

    if (transaction.receiverWalletId && typeof transaction.receiverWalletId === 'object') {
      const fn = `${transaction.receiverWalletId.firstName || ''} ${transaction.receiverWalletId.lastName || ''}`.trim();
      if (fn) return fn;
    }
    if (nestedStudent?.fullName || nestedStudent?.name) return String(nestedStudent.fullName || nestedStudent.name);
    if (nestedStudent && (nestedStudent.firstName || nestedStudent.lastName)) {
      return `${nestedStudent.firstName || ''} ${nestedStudent.lastName || ''}`.trim();
    }
    if (nestedRecipient?.name || nestedRecipient?.fullName) return String(nestedRecipient.name || nestedRecipient.fullName);
    if (nestedCustomer?.name || nestedCustomer?.fullName) return String(nestedCustomer.name || nestedCustomer.fullName);
    if (nestedUser?.name || nestedUser?.fullName) return String(nestedUser.name || nestedUser.fullName);
    if (raw.recipientName) return String(raw.recipientName);
    if (raw.customerName) return String(raw.customerName);
    if (raw.studentName) return String(raw.studentName);
    if (raw.accountName) return String(raw.accountName);
    if (raw.storeName) return String(raw.storeName);
    return 'Recipient Not Specified';
  };

  const getSenderName = (transaction: Transaction) => {
    const raw = transaction as unknown as Record<string, unknown>;
    const nestedSender = (typeof raw.sender === 'object' && raw.sender !== null ? raw.sender : undefined) as Record<string, unknown> | undefined;
    const nestedUser = (typeof raw.user === 'object' && raw.user !== null ? raw.user : undefined) as Record<string, unknown> | undefined;
    const nestedStudent = (typeof raw.student === 'object' && raw.student !== null ? raw.student : undefined) as Record<string, unknown> | undefined;

    if (transaction.senderWalletId && typeof transaction.senderWalletId === 'object') {
      const fn = `${transaction.senderWalletId.firstName || ''} ${transaction.senderWalletId.lastName || ''}`.trim();
      if (fn) return fn;
    }
    if (nestedStudent?.fullName || nestedStudent?.name) return String(nestedStudent.fullName || nestedStudent.name);
    if (nestedStudent && (nestedStudent.firstName || nestedStudent.lastName)) {
      return `${nestedStudent.firstName || ''} ${nestedStudent.lastName || ''}`.trim();
    }
    if (nestedSender?.name || nestedSender?.fullName) return String(nestedSender.name || nestedSender.fullName);
    if (nestedUser?.name || nestedUser?.fullName) return String(nestedUser.name || nestedUser.fullName);
    if (raw.senderName) return String(raw.senderName);
    if (raw.userName) return String(raw.userName);
    if (raw.studentName) return String(raw.studentName);
    if (raw.storeName) return String(raw.storeName);
    if (raw.email) return String(raw.email);
    return 'System/External';
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isDebitTxn = (t: Transaction) =>
    t.direction === 'debit' ||
    (t.transactionType?.toLowerCase() ?? '').includes('debit') ||
    t.amount < 0;

  const getTransactionTypeColor = (transaction: Transaction) =>
    isDebitTxn(transaction) ? 'text-red-600' : 'text-green-600';

  // Filters run in the browser on the CURRENT page only
  const filteredTransactions = transactions.filter((transaction) => {
    const sender = getSenderName(transaction).toLowerCase();
    const recipient = getTransactionName(transaction).toLowerCase();
    const reference = transaction.reference?.toLowerCase() ?? "";
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      sender.includes(term) ||
      recipient.includes(term) ||
      reference.includes(term);

    const matchesStatus =
      statusFilter === "all" ||
      transaction.status.toLowerCase() === statusFilter;

    const isDebit = isDebitTxn(transaction);

    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "debit" && isDebit) ||
      (typeFilter === "credit" && !isDebit);

    const transactionDate = new Date(transaction.createdAt);

    const matchesFrom =
      !fromDate || transactionDate >= new Date(`${fromDate}T00:00:00`);

    const matchesTo =
      !toDate || transactionDate <= new Date(`${toDate}T23:59:59.999`);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesType &&
      matchesFrom &&
      matchesTo
    );
  });

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // --- LIST EXPORT LOGIC ---
  // NOTE: with server-side pagination this exports only the rows on the current
  // page (after filters). For a full export, fetch all records on click.

  const buildExportRows = () =>
    filteredTransactions.map((t) => ({
      date: new Date(t.createdAt).toLocaleString('en-NG'),
      sender: getSenderName(t),
      recipient: getTransactionName(t),
      type: isDebitTxn(t) ? 'Debit' : 'Credit',
      amount: Math.abs(t.amount),
      status: t.status,
      reference: t.reference || '',
      id: t._id || '',
    }));

  const getExportFileName = (ext: string) => {
    const range =
      fromDate || toDate
        ? `${fromDate || 'start'}_to_${toDate || 'today'}`
        : `page-${currentPage}`;
    return `XPAY-Transactions-${range}.${ext}`;
  };

  const exportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = ['Date', 'Sender', 'Recipient', 'Type', 'Amount (NGN)', 'Status', 'Reference', 'Transaction ID'];
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

    const lines = [
      headers.map(escape).join(','),
      ...buildExportRows().map((r) =>
        [r.date, r.sender, r.recipient, r.type, r.amount.toFixed(2), r.status, r.reference, r.id]
          .map(escape)
          .join(',')
      ),
    ];

    // \uFEFF (BOM) makes Excel read the file as UTF-8
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getExportFileName('csv');
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportListPDF = () => {
    if (filteredTransactions.length === 0) return;

    const doc = new jsPDF('l', 'mm', 'a4'); // landscape
    const rows = buildExportRows();

    doc.setFontSize(16);
    doc.text('XPAY Transaction History', 14, 15);

    doc.setFontSize(9);
    const rangeLabel =
      fromDate || toDate
        ? `Period: ${fromDate || 'Beginning'} to ${toDate || 'Today'}`
        : `Page ${currentPage}`;
    doc.text(`${rangeLabel}   |   ${rows.length} transaction(s)   |   Generated: ${new Date().toLocaleString('en-NG')}`, 14, 22);

    autoTable(doc, {
      startY: 27,
      head: [['Date', 'Sender', 'Recipient', 'Type', 'Amount (NGN)', 'Status', 'Reference']],
      body: rows.map((r) => [
        r.date,
        r.sender,
        r.recipient,
        r.type,
        r.amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        r.status,
        r.reference,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] }, // indigo-600
    });

    doc.save(getExportFileName('pdf'));
  };

  return (
    <>
      <main className="flex-grow p-4 md:p-8 md:ml-64 overflow-x-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-900">Transaction Module</h1>
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{loading ? 'Loading...' : 'Refresh'}</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-black mb-6">
              History ({totalItems})
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Filter Transactions
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    onClick={exportCSV}
                    disabled={filteredTransactions.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition disabled:opacity-40"
                  >
                    <Download className="w-4 h-4" /> CSV
                  </button>
                  <button
                    onClick={exportListPDF}
                    disabled={filteredTransactions.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition disabled:opacity-40"
                  >
                    <FileText className="w-4 h-4" /> PDF
                  </button>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setTypeFilter("all");
                      setFromDate("");
                      setToDate("");
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">

                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>

                  <input
                    type="text"
                    placeholder="Reference, Sender..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black placeholder:text-gray-400" />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black"
                  >
                    <option value="all">All Status</option>
                    <option value="success">Success</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black"
                  >
                    <option value="all">All Types</option>
                    <option value="credit">Credit</option>
                    <option value="debit">Debit</option>
                  </select>
                </div>

                {/* From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From
                  </label>

                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black placeholder:text-gray-400" />
                </div>

                {/* To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To
                  </label>

                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black placeholder:text-gray-400" />
                </div>

              </div>
            </div>
            {loading ? (
              <div className="text-center py-12 text-gray-500">Fetching transactions...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Recipient</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Reference</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden xl:table-cell">Txn ID</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((transaction) => {
                          const isDebit = isDebitTxn(transaction);
                          return (
                            <tr key={transaction._id} className="hover:bg-gray-50">
                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="font-medium">{getSenderName(transaction)}</div>
                                <div className="text-gray-500 text-xs">{formatDate(transaction.createdAt)}</div>
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${isDebit ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                  }`}>
                                  {isDebit ? '↓ Debit' : '↑ Credit'}
                                </span>
                              </td>
                              <td className={`px-3 py-4 whitespace-nowrap text-sm font-medium ${getTransactionTypeColor(transaction)}`}>
                                {formatCurrency(transaction.amount)}
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">
                                {getTransactionName(transaction)}
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-400 font-mono hidden lg:table-cell">
                                {transaction.reference || '—'}
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-400 font-mono hidden xl:table-cell">
                                {transaction._id || '—'}
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                                  {transaction.status}
                                </span>
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => setSelectedTxn(transaction)}
                                  className="text-indigo-600 hover:text-indigo-900 font-bold flex items-center gap-1"
                                >
                                  <FileText className="w-4 h-4" />
                                  Receipt
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-3 py-8 text-center text-gray-400">No transactions found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Uses totalItems (not the filtered count) so the footer stays
                    visible even when filters hide every row on this page */}
                {totalItems > 0 && (
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6 text-black">
                    {/* Page size + range */}
                    <div className="flex items-center gap-3 text-sm">
                      <label htmlFor="pageSize" className="text-gray-600 font-medium">
                        Rows per page
                      </label>
                      <select
                        id="pageSize"
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-black"
                      >
                        {[10, 25, 50, 100].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                      <span className="text-gray-500">
                        {startItem}–{endItem} of {totalItems}
                      </span>
                    </div>

                    {/* Prev / Next */}
                    <div className="flex items-center justify-center gap-4">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className="px-4 py-2 border rounded-lg disabled:opacity-30 hover:bg-gray-50 text-sm font-medium"
                      >
                        Previous
                      </button>
                      <span className="text-sm font-semibold">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="px-4 py-2 border rounded-lg disabled:opacity-30 hover:bg-gray-50 text-sm font-medium"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* --- RECEIPT MODAL --- */}
      {selectedTxn && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            {/* Capture Area */}
            <div ref={receiptRef} className="bg-white p-6">
              <div className="text-center border-b border-dashed border-gray-200 pb-6">
                {/* XPAY Logo Addition */}
                <div className="flex justify-center mb-4">
                  <img src="/xpay.jpeg" alt="XPAY Logo" className="h-10 w-auto object-contain" />
                </div>

                <h2 className="text-xl font-bold text-gray-900 tracking-tight">TRANSACTION RECEIPT</h2>
              </div>

              <div className="py-5 space-y-3">
                {/* Type */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm font-medium">Type</span>
                  <span className={`text-sm font-black uppercase ${isDebitTxn(selectedTxn) ? 'text-red-600' : 'text-green-600'}`}>
                    {isDebitTxn(selectedTxn) ? '↓ Debit' : '↑ Credit'}
                  </span>
                </div>
                {/* Amount */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm font-medium">Amount</span>
                  <span className="text-xl font-black text-gray-900">{formatCurrency(selectedTxn.amount)}</span>
                </div>
                {/* Sender */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm font-medium">Sender</span>
                  <span className="text-sm font-bold text-gray-800 text-right">{getSenderName(selectedTxn)}</span>
                </div>
                {/* Recipient */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm font-medium">Recipient</span>
                  <span className="text-sm font-bold text-gray-800 text-right">{getTransactionName(selectedTxn)}</span>
                </div>
                {/* Description */}
                {selectedTxn.description && (
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-gray-400 text-sm font-medium shrink-0">Description</span>
                    <span className="text-sm font-medium text-gray-700 text-right">{selectedTxn.description}</span>
                  </div>
                )}
                {/* Date */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm font-medium">Date</span>
                  <span className="text-sm font-bold text-gray-800">{new Date(selectedTxn.createdAt).toLocaleString()}</span>
                </div>
                {/* Reference */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm font-medium">Reference</span>
                  <span className="text-xs font-mono text-gray-600 break-all text-right">{selectedTxn.reference || '—'}</span>
                </div>
                {/* Charges */}
                {selectedTxn.charges != null && selectedTxn.charges > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm font-medium">Charges</span>
                    <span className="text-sm font-bold text-red-500">{formatCurrency(selectedTxn.charges)}</span>
                  </div>
                )}

                {/* Status */}
                <div className="flex justify-between items-center pt-1 border-t border-dashed border-gray-100">
                  <span className="text-gray-400 text-sm font-medium">Status</span>
                  <span className={`text-sm font-black uppercase ${selectedTxn.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedTxn.status}
                  </span>
                </div>
              </div>

              <div className="bg-indigo-50 p-3 rounded-lg text-[10px] text-indigo-400 text-center font-bold uppercase tracking-wider">
                Official XPAY Digital Receipt
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-gray-50 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={downloadImage} className="flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all active:scale-95">
                  <Download size={14} /> Image
                </button>
                <button onClick={downloadPDF} className="flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all active:scale-95">
                  <FileText size={14} /> PDF
                </button>
              </div>
              <button onClick={shareReceipt} className="flex items-center justify-center gap-2 py-3 bg-indigo-600 rounded-lg text-sm font-bold text-white shadow-lg active:scale-95 transition-all hover:bg-indigo-700">
                <Share2 size={16} /> Share Receipt
              </button>
              <button
                onClick={() => setSelectedTxn(null)}
                className="mt-2 text-gray-400 text-xs font-bold hover:text-gray-600 uppercase tracking-widest text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionModule;