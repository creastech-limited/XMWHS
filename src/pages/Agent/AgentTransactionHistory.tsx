import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowDown, 
  ArrowUp, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Download, 
  Share2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toBlob, toPng } from 'html-to-image';
import Footer from '../../components/Footer';
import AHeader from '../../components/AHeader';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type Transaction = {
  id: number | string;
  type: 'credit' | 'transfer'; // transfer = debit/outbound
  amount: number;
  description: string;
  date: string;
  status?: string;
};

interface RawTransaction {
  _id?: string | number;
  id?: string | number;
  type?: string;
  transactionType?: string;
  direction?: string; // Added to catch inbound/outbound
  amount: number;
  description?: string;
  note?: string;
  date?: string;
  createdAt?: string;
  status?: string;
}

const AgentTransactionHistory = () => {
  const auth = useAuth();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  const handleAuthError = useCallback((message: string) => {
    setFetchError(message);
    auth?.logout?.();
  }, [auth]);

  const handleDownload = async () => {
    if (receiptRef.current === null) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `XPAY-Receipt-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download receipt', err);
    }
  };

  const handleShare = async () => {
    if (receiptRef.current === null || !selectedTxn) return;
    try {
      const blob = await toBlob(receiptRef.current, { 
        cacheBust: true, 
        backgroundColor: '#ffffff' 
      });
      if (!blob) return;
      const file = new File([blob], `XPAY_Receipt_${selectedTxn.id}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'XPAY Receipt',
          text: `Transaction receipt for ₦${selectedTxn.amount.toLocaleString()}`,
        });
      } else {
        alert("Your browser doesn't support sharing image files. Please use the 'Save' button instead.");
      }
    } catch (err) {
      console.error('Sharing failed', err);
    }
  };

  const fetchTransactions = useCallback(async (authToken: string): Promise<Transaction[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transaction/getusertransaction`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      // Robust data extraction
      const transactionData: RawTransaction[] = data.transactions || data.data || (Array.isArray(data) ? data : []);

      return transactionData.map((txn, index) => {
        // IMPROVED DEBIT DETECTION
        const typeAttr = (txn.type || '').toLowerCase();
        const transTypeAttr = (txn.transactionType || '').toLowerCase();
        const directionAttr = (txn.direction || '').toLowerCase();
        
        const isDebit = 
          typeAttr === 'debit' || 
          transTypeAttr === 'debit' || 
          directionAttr === 'outbound' || 
          directionAttr === 'debit' ||
          txn.amount < 0;

        const rawDesc = txn.description || txn.note || (isDebit ? 'Transfer' : 'Payment');
        
        return {
          id: txn._id || txn.id || `idx-${index}`,
          type: isDebit ? 'transfer' : 'credit',
          amount: Math.abs(txn.amount || 0),
          description: `XPAY - ${rawDesc}`,
          date: txn.date || txn.createdAt || new Date().toISOString(),
          status: (txn.status || 'success').toLowerCase(),
        };
      });
    } catch (err) {
      console.error('Error fetching transactions:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        const activeToken = auth?.token || localStorage.getItem('token');
        if (!activeToken) throw new Error('No authentication token found');
        const data = await fetchTransactions(activeToken);
        setTransactions(data);
      } catch {
        handleAuthError('Could not load transactions. Please login again.');
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, [auth?.token, fetchTransactions, handleAuthError]);

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8faff]">
      <AHeader />
      <main className="text-gray-600 flex-grow relative">
        <div className="max-w-3xl mx-auto py-8 px-4">
          {loading ? (
            <div className="space-y-4">
              <div className="h-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-96 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : fetchError ? (
            <div className="bg-white p-8 text-center rounded-xl shadow-sm">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-800 font-medium">{fetchError}</p>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-xl overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-50">
                <h2 className="text-lg font-bold text-gray-800">History</h2>
                <Search className="w-5 h-5 text-blue-600" />
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-20 text-gray-400">No transactions found</div>
              ) : (
                <>
                  <ul className="divide-y divide-gray-50">
                    {currentTransactions.map((txn) => (
                      <li 
                        key={txn.id} 
                        onClick={() => setSelectedTxn(txn)}
                        className="flex items-center justify-between py-4 hover:bg-blue-50/40 transition-colors px-6 cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${txn.type === 'transfer' ? 'bg-orange-50' : 'bg-green-50'}`}>
                            {txn.type === 'transfer' ? <ArrowUp className="w-4 h-4 text-orange-600" /> : <ArrowDown className="w-4 h-4 text-green-600" />}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors text-sm sm:text-base">{txn.description}</p>
                            <p className="text-xs text-gray-400">{new Date(txn.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-sm ${txn.type === 'transfer' ? 'text-orange-600' : 'text-green-600'}`}>
                            {txn.type === 'transfer' ? '-' : '+'}₦{txn.amount.toLocaleString()}
                          </p>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">{txn.status}</span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
                      <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-white"><ChevronLeft className="w-4 h-4" /></button>
                      <div className="text-xs font-bold text-gray-500">{currentPage} / {totalPages}</div>
                      <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-white"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/agent" className="inline-flex items-center gap-1 rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50">
              Back to Dashboard
            </Link>
          </div>
        </div>

        {selectedTxn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
              <div ref={receiptRef}>
                <div className="bg-blue-600 p-8 text-center text-white relative">
                  <button onClick={() => setSelectedTxn(null)} className="absolute right-4 top-4 p-2 hover:bg-white/20 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                  <div className="bg-white w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                    {selectedTxn.status === 'failed' ? <AlertCircle className="w-8 h-8 text-red-500" /> : <CheckCircle2 className="w-8 h-8 text-green-500" />}
                  </div>
                  <h2 className="text-xl font-bold italic tracking-tighter">XPAY RECEIPT</h2>
                </div>

                <div className="p-6 bg-white">
                  <div className="text-center mb-6 pt-2">
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">Amount</p>
                    <h3 className="text-3xl font-black text-gray-900">
                      {selectedTxn.type === 'transfer' ? '-' : '+'}₦{selectedTxn.amount.toLocaleString()}
                    </h3>
                  </div>

                  <div className="space-y-4 border-t border-dashed border-gray-200 pt-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Remark</span>
                      <span className="font-semibold text-gray-800 text-right">{selectedTxn.description}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Date</span>
                      <span className="font-semibold text-gray-800">{new Date(selectedTxn.date).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Ref</span>
                      <span className="font-mono text-xs text-gray-800 uppercase">#TXN-{selectedTxn.id.toString().slice(-6)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <button onClick={handleDownload} className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all">
                    <Download className="w-4 h-4" /> Save
                  </button>
                  <button onClick={handleShare} className="flex items-center justify-center gap-2 py-3 bg-blue-600 rounded-xl text-sm font-bold text-white shadow-md active:scale-95 transition-all">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AgentTransactionHistory;