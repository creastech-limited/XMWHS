import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import html2canvas from 'html2canvas';
import KidsHeader from '../../components/KidsHeader';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';

// Icons
import { 
  ArrowLeft, 
  History,
  ArrowDown,
  ArrowUp,
  User,
  CreditCard,
  GraduationCap, 
  Settings,
  MessageSquare,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Share2,
  AlertCircle
} from 'lucide-react';

// Type definitions
interface Profile {
  _id: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  profilePic?: string;
  qrCodeId?: string;
}

interface Wallet {
  id?: string;
  balance: number;
  currency?: string;
}

interface APITransaction {
  _id: string;
  transactionType: string;
  category: 'credit' | 'debit';
  amount: number;
  description: string;
  status: string;
  reference: string;
  senderWalletId?: {
    email: string;
    firstName: string;
    lastName: string;
  };
  receiverWalletId?: {
    email: string;
    firstName: string;
    lastName: string;
  };
  metadata?: {
    senderEmail: string;
    receiverEmail: string;
  };
  createdAt: string;
  direction: 'credit' | 'debit';
  balanceBefore: number;
  balanceAfter: number;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'payment' | 'reward' | 'transfer';
  amount: number;
  description: string;
  date: string;
  from?: string;
  to?: string;
  status: string;
  reference: string;
  category: 'credit' | 'debit';
  direction: 'credit' | 'debit';
}

const KidPaymentHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const token = auth?.token;
  const receiptRef = useRef<HTMLDivElement>(null);
  
  // State management
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const activeTab = 2; 
  const [loading, setLoading] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [copiedReference, setCopiedReference] = useState<string | null>(null);

  // Receipt Modal State
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;
  
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const navItems = [
    { label: "Dashboard", icon: <User className="w-5 h-5" />, route: "/kidswallet" },
    { label: "Pay Agent", icon: <CreditCard className="w-5 h-5" />, route: "/kidpayagent" },
    { label: "History", icon: <History className="w-5 h-5" />, route: "/kidpaymenthistory" },
    { label: "School Bills", icon: <GraduationCap className="w-5 h-5" />, route: "/schoolbills" },
    { label: "Settings", icon: <Settings className="w-5 h-5" />, route: "/ksettings" },
    { label: "Dispute", icon: <MessageSquare className="w-5 h-5" />, route: "/kdispute" },
  ];

  // Helper to check for success consistently
  const isSuccessful = (status: string) => {
    const s = status?.toLowerCase();
    return s === 'success' || s === 'successful' || s === 'completed';
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    console.log(`${type}: ${message}`);
  };

  const copyToClipboard = async (reference: string) => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopiedReference(reference);
      setTimeout(() => setCopiedReference(null), 2000);
      showNotification("Reference copied", "success");
    } catch {
      showNotification("Failed to copy", "error");
    }
  };

  const transformTransaction = (apiTransaction: APITransaction): Transaction => {
    let type: 'deposit' | 'payment' | 'reward' | 'transfer' = 'transfer';
    if (apiTransaction.transactionType.includes('deposit')) type = 'deposit';
    else if (apiTransaction.transactionType.includes('payment')) type = 'payment';
    else if (apiTransaction.transactionType.includes('reward')) type = 'reward';

    let from: string | undefined;
    let to: string | undefined;

    if (apiTransaction.direction === 'credit') {
      if (apiTransaction.senderWalletId) {
        from = `${apiTransaction.senderWalletId.firstName} ${apiTransaction.senderWalletId.lastName}`;
      } else if (apiTransaction.metadata?.senderEmail) {
        from = apiTransaction.metadata.senderEmail;
      }
    } else {
      if (apiTransaction.receiverWalletId) {
        to = `${apiTransaction.receiverWalletId.firstName} ${apiTransaction.receiverWalletId.lastName}`;
      } else if (apiTransaction.metadata?.receiverEmail) {
        to = apiTransaction.metadata.receiverEmail;
      }
    }

    return {
      id: apiTransaction._id,
      type,
      amount: apiTransaction.direction === 'credit' ? apiTransaction.amount : -apiTransaction.amount,
      description: apiTransaction.description || 'Transaction',
      date: apiTransaction.createdAt,
      from,
      to,
      status: apiTransaction.status || 'failed',
      reference: apiTransaction.reference,
      category: apiTransaction.category,
      direction: apiTransaction.direction
    };
  };

  const fetchUserProfile = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/api/users/getuserone`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = response.data.user?.data || response.data.user || response.data.data || response.data;
      setProfile(userData);
    } catch {
      console.error("Profile load failed");
    }
  }, [API_URL, token]);

  const fetchUserWallet = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/api/wallet/getuserwallet`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWallet(response.data.data || response.data);
    } catch {
      console.error("Wallet load failed");
    }
  }, [API_URL, token]);

  const fetchTransactions = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/api/transaction/getusertransaction`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = response.data.data || response.data.transactions || response.data;
      const transformed = (list as APITransaction[])
        .map(transformTransaction)
        .sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(transformed);
    } catch {
      setTransactions([]);
    }
  }, [API_URL, token]);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchUserProfile(), fetchUserWallet(), fetchTransactions()]);
      setLoading(false);
    };
    loadAll();
  }, [token, navigate, fetchUserProfile, fetchUserWallet, fetchTransactions]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  // Receipt handling functions

  const handleDownloadReceipt = () => window.print();


  // New unified share/download function with better sharing logic

  const handleShareReceipt = async (): Promise<void> => {
    if (!receiptRef.current || !selectedTransaction) return;
    try {
      setIsSharing(true);
      const canvas = await html2canvas(receiptRef.current, {
        useCORS: true,
        background: "#ffffff",
        scale: 2,
        ignoreElements: (element: Element) => 
          element.classList.contains('print:hidden') && element.tagName === 'BUTTON'
      } as Record<string, unknown> as Parameters<typeof html2canvas>[1]);

      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) return;
        const file = new File([blob], `XPAY-Receipt-${selectedTransaction.reference}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'XPAY Transaction Receipt',
              text: `Receipt for transaction: ${selectedTransaction.reference}`,
            });
          } catch { /* cancelled */ }
        } else {
          const link = document.createElement('a');
          link.download = `XPAY-Receipt-${selectedTransaction.reference}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(link.href);
          showNotification("Image downloaded", "success");
        }
      }, 'image/png');
    } catch {
      showNotification("Could not share image", "error");
    } finally {
      setIsSharing(false);
    }
  };

  // Pagination logic

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const currentTransactions = transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-4 md:py-8">
      <div className="container mx-auto max-w-5xl px-4 flex flex-col min-h-screen">
        <KidsHeader profile={profile} wallet={wallet || { balance: 0 }} />

        {/* Navigation Section */}
        <div className="mb-6 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:hidden">
          <div className="flex overflow-x-auto scrollbar-hide">
            {navItems.map((item, index) => (
              <Link 
                key={item.label} to={item.route}
                className={`flex-shrink-0 flex items-center px-6 py-5 gap-3 border-b-2 transition-all ${index === activeTab ? "border-indigo-600 text-indigo-600 bg-indigo-50/30" : "border-transparent text-slate-500 hover:text-indigo-600"}`}
              >
                {item.icon} <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* History List Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8 print:hidden">
          <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-white">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" /> Recent Transactions
            </h2>
            <div className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500">{transactions.length} Total</div>
          </div>
          
          <div className="divide-y divide-slate-50">
            {currentTransactions.length > 0 ? (
                currentTransactions.map((t) => {
                    const success = isSuccessful(t.status);
                    return (
                        <div key={t.id} onClick={() => { setSelectedTransaction(t); setShowReceipt(true); }} className="p-5 hover:bg-slate-50/80 cursor-pointer flex items-center gap-4 transition-all group">
                            <div className={`rounded-xl p-3 shadow-sm transition-transform group-hover:scale-110 ${!success ? 'bg-red-500' : t.direction === 'credit' ? 'bg-green-500' : 'bg-red-500'}`}>
                                {!success ? <AlertCircle className="w-5 h-5 text-white" /> : t.direction === 'credit' ? <ArrowDown className="w-5 h-5 text-white" /> : <ArrowUp className="w-5 h-5 text-white" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                  <div>
                                      <h3 className="font-semibold text-slate-700">{t.description}</h3>
                                      <p className="text-[11px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">{t.reference.substring(0, 14)}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className={`text-base font-bold ${!success ? 'text-red-500' : t.direction === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          {t.direction === 'credit' ? '+' : '-'}₦{Math.abs(t.amount).toLocaleString()}
                                      </p>
                                      <p className="text-[10px] text-slate-400 font-medium">{formatDate(t.date)}</p>
                                  </div>
                              </div>
                            </div>
                        </div>
                    )
                })
            ) : (
                <div className="py-24 text-center text-slate-400 font-medium">No transaction records found</div>
            )}
          </div>

          {/* Pagination (Ellipsis/Older Logic) */}
          {totalPages > 1 && (
            <div className="px-6 py-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500 font-medium">
                Showing <span className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, transactions.length)}</span> of {transactions.length}
              </p>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 hover:bg-slate-50 rounded-lg disabled:opacity-20 text-slate-600"><ChevronLeft size={20}/></button>
                {[...Array(totalPages)].map((_, i) => {
                   const page = i + 1;
                   if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                     return (
                      <button key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${currentPage === page ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"}`}>
                        {page}
                      </button>
                     );
                   }
                   if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} className="px-1 text-slate-300">...</span>;
                   return null;
                })}
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 hover:bg-slate-50 rounded-lg disabled:opacity-20 text-slate-600"><ChevronRight size={20}/></button>
              </div>
            </div>
          )}
        </div>

        {/* Receipt Modal */}
        {showReceipt && selectedTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:p-0 print:bg-white print:static">
            <div ref={receiptRef} className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl print:shadow-none print:w-full">
              <div className="relative p-10 text-center border-b border-dashed border-slate-200">
                <button onClick={() => setShowReceipt(false)} className="absolute right-8 top-8 p-2 hover:bg-slate-100 rounded-full print:hidden transition-colors"><X className="text-slate-400" /></button>
                <div className="mb-6 flex justify-center">
                  <div className="bg-indigo-600 px-4 py-2 rounded-xl flex items-center gap-2">
                   <img src="/xpay.jpeg" alt="xpay-logo" className='h-12 w-12 rounded-xl'/>
                  </div>
                </div>
                <h2 className="text-4xl font-black text-slate-800 tracking-tight">₦{Math.abs(selectedTransaction.amount).toLocaleString()}</h2>
                
                {/* Binary Success Logic */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase mt-3 tracking-widest border ${
                  isSuccessful(selectedTransaction.status)
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-red-50 text-red-600 border-red-100'
                }`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                      isSuccessful(selectedTransaction.status) ? 'bg-emerald-500' : 'bg-red-500'
                    }`}></div>
                    {selectedTransaction.status.toUpperCase()}
                </div>
              </div>

              <div className="p-10 space-y-6">
                {[
                  { label: 'Description', val: selectedTransaction.description },
                  { label: 'Date & Time', val: formatDate(selectedTransaction.date) },
                  { label: 'Transaction Reference', val: selectedTransaction.reference, copy: true },
                  { label: 'Sender', val: selectedTransaction.from || 'Wallet User' },
                  { label: 'Recipient', val: selectedTransaction.to || 'Wallet User' }
                ].map((item, i) => item.val && (
                  <div key={i} className="flex justify-between items-start text-sm">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider pt-1">{item.label}</span>
                    <div className="flex items-center gap-2 max-w-[65%] text-right">
                      <span className="font-bold text-slate-700 leading-tight">{item.val}</span>
                      {item.copy && (
                        <button onClick={() => copyToClipboard(item.val)} className="print:hidden text-indigo-400 p-1 hover:bg-indigo-50 rounded">
                          {copiedReference === item.val ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="pt-8 flex gap-4 print:hidden">
                  <button onClick={handleDownloadReceipt} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl active:scale-95">
                    <Download size={18} /> Print PDF
                  </button>
                  <button onClick={handleShareReceipt} disabled={isSharing} className="w-16 bg-slate-100 flex items-center justify-center rounded-2xl hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-50">
                    {isSharing ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div> : <Share2 size={18} className="text-slate-600" />}
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 py-5 text-center border-t border-slate-100"><p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em]">Official XPAY Digital Receipt</p></div>
            </div>
          </div>
        )}

        {/* BACK TO DASHBOARD BUTTON */}
        <div className="text-center mt-4 mb-16 print:hidden">
            <Link to="/kidswallet" className="inline-flex items-center gap-2 px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm">
              <ArrowLeft size={18} /> Back to Dashboard
            </Link>
        </div>
        <Footer />
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .fixed.inset-0, .fixed.inset-0 * { visibility: visible; }
          .fixed.inset-0 { position: absolute; left: 0; top: 0; width: 100%; height: auto; background: white !important; }
          .print\\:hidden { display: none !important; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default KidPaymentHistoryPage;