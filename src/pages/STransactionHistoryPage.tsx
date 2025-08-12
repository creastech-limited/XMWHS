import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
    ArrowLeft,
    Receipt, 
    Filter, 
    Search as SearchIcon,
    Download,
    Check,
    Clock,
    AlertCircle,
    User,
    Calendar,
    DollarSign,
} from 'lucide-react';
import StoreHeader from '../components/StoreHeader';
import StoreSidebar from '../components/StoreSidebar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

// API Base URL Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type Transaction = {
    id: string;
    date: string;
    amount: number;
    status: 'Completed' | 'Pending' | 'Failed';
    agent: string;
    agentId?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
};

type User = {
    _id: string;
    name: string;
    email: string;
    role: string;
    senderEmail?: string;
    senderWalletId?: string;
    // Add other user properties as needed
};

const STransactionHistoryPage = () => {
    const auth = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Handle authentication errors
    const handleAuthError = useCallback((message: string) => {
        setError(message);
        // Clear stored credentials
        localStorage.removeItem('token');
        auth?.logout?.();
        // Redirect to login page if needed
        // navigate('/login');
    }, [auth]);

    // Fetch user details from API
    const fetchUserDetails = useCallback(async (authToken: string): Promise<User> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/getuserone`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Handle different response structures
            let profile: User | undefined;
            if (data.user?.data) {
                profile = data.user.data;
            } else if (data.data) {
                profile = data.data;
            } else if (data.user) {
                profile = data.user as User;
            } else {
                profile = data as User;
            }

            if (!profile) {
                throw new Error('Invalid user data received from API');
            }

            return profile;
        } catch (error) {
            console.error('Error fetching user details:', error);
            throw error;
        }
    }, []);

    // Fetch transactions from API
    const fetchTransactions = useCallback(async (authToken: string): Promise<Transaction[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/transaction/getusertransaction`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Handle different response structures for transactions
            let transactionList: unknown[] = [];
            if (data.transactions) {
                transactionList = data.transactions;
            } else if (data.data) {
                transactionList = Array.isArray(data.data) ? data.data : [data.data];
            } else if (Array.isArray(data)) {
                transactionList = data;
            }

            // Transform API data to match our Transaction type
            const transformedTransactions: Transaction[] = transactionList.map((txn, index: number) => {
               const t = txn as Record<string, unknown> & {
    metadata?: { senderEmail?: string; receiverEmail?: string };
    senderWalletId?: { email?: string };
};
                // Determine status based on API response
                let status: 'Completed' | 'Pending' | 'Failed' = 'Completed';
                if (t.status) {
                    const statusLower = typeof t.status === 'string' ? t.status.toLowerCase() : '';
                    if (statusLower.includes('pending') || statusLower.includes('processing')) {
                        status = 'Pending';
                    } else if (statusLower.includes('failed') || statusLower.includes('cancelled') || statusLower.includes('rejected')) {
                        status = 'Failed';
                    } else if (statusLower.includes('completed') || statusLower.includes('success') || statusLower.includes('approved')) {
                        status = 'Completed';
                    }
                }

                // Format date
                let formattedDate = new Date().toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
                
                if (t.date || t.createdAt) {
                    const dateObj = new Date((t.date as string | number | Date) || (t.createdAt as string | number | Date));
                    if (!isNaN(dateObj.getTime())) {
                        formattedDate = dateObj.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        });
                    }
                }

                return {
                    id: String(t.id || t._id || `TX${1000 + index}`),
                    date: formattedDate,
                    amount: Math.abs(Number(t.amount) || 0),
                    status,
                agent: String(
    t.metadata?.senderEmail || 
    t.senderWalletId?.email || 
    t.agent || 
    t.agentName || 
    t.from || 
    t.to || 
    `Agent ${String.fromCharCode(65 + (index % 26))}`
),
                    agentId: t.agentId ? String(t.agentId) : t.agent_id ? String(t.agent_id) : undefined,
                    description: t.description ? String(t.description) : t.note ? String(t.note) : undefined,
                    createdAt: t.createdAt ? String(t.createdAt) : undefined,
                    updatedAt: t.updatedAt ? String(t.updatedAt) : undefined,
                };
            });

            return transformedTransactions;
        } catch (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }
    }, []);

    // Initialize authentication and fetch data
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                setLoading(true);
                setError(null);
                console.log('Starting auth initialization...');

                // Check if already in context
                if (auth?.user?._id && auth?.token) {
                    console.log('Found user in auth context:', auth.user);
                    setUser(auth.user);
                    
                    // Fetch transactions with existing token
                    try {
                        const transactionData = await fetchTransactions(auth.token);
                        setTransactions(transactionData);
                        setFilteredTransactions(transactionData);
                    } catch (transactionError) {
                        console.error('Error fetching transactions:', transactionError);
                        setError('Failed to load transactions');
                    }
                    
                    setLoading(false);
                    return;
                }

                // Try localStorage
                const storedToken = localStorage.getItem('token');
                if (!storedToken) {
                    console.log('No token in localStorage');
                    throw new Error('No authentication token found');
                }

                console.log('Found token in localStorage:', storedToken);

                // Fetch user from API to ensure fresh data
                console.log('Fetching user from API...');
                const profile = await fetchUserDetails(storedToken);
                console.log('Successfully fetched user profile:', profile);

                // Update local state
                setUser(profile);

                // Update auth context
                auth?.login?.(profile, storedToken);

                // Fetch transactions
                console.log('Fetching transactions from API...');
                const transactionData = await fetchTransactions(storedToken);
                console.log('Successfully fetched transactions:', transactionData);
                setTransactions(transactionData);
                setFilteredTransactions(transactionData);

            } catch (error) {
                console.error('Auth initialization error:', error);
                handleAuthError('Authentication error. Please login again.');
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, [auth, fetchUserDetails, fetchTransactions, handleAuthError]);

    // Filter transactions based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredTransactions(transactions);
        } else {
            const filtered = transactions.filter(txn =>
                txn.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                txn.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
                txn.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
                txn.status.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredTransactions(filtered);
        }
    }, [searchQuery, transactions]);

    // Retry function for failed requests
    const retryFetch = async () => {
        const retryToken = auth?.token || localStorage.getItem('token');
        if (retryToken) {
            setLoading(true);
            setError(null);
            try {
                const transactionData = await fetchTransactions(retryToken);
                setTransactions(transactionData);
                setFilteredTransactions(transactionData);
            } catch {
                setError('Failed to load transactions. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    // Function to render a status indicator with icon
    const getStatusChip = (status: Transaction['status']) => {
        switch(status) {
            case 'Completed':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-green-500 px-2 py-1 text-xs font-medium text-green-600">
                        <Check className="h-3 w-3" />
                        Completed
                    </span>
                );
            case 'Pending':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500 px-2 py-1 text-xs font-medium text-amber-600">
                        <Clock className="h-3 w-3" />
                        Pending
                    </span>
                );
            case 'Failed':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-500 px-2 py-1 text-xs font-medium text-red-600">
                        <AlertCircle className="h-3 w-3" />
                        Failed
                    </span>
                );
            default:
                return <span className="text-xs">{status}</span>;
        }
    };

    // Function to create agent avatar with first letter
    const getAgentAvatar = (agentName: string) => {
        const letter = agentName.charAt(0);
        const colors = ['bg-blue-600', 'bg-pink-600', 'bg-cyan-500', 'bg-orange-500', 'bg-green-500'];
        const colorIndex = letter.charCodeAt(0) % colors.length;
        
        return (
            <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${colors[colorIndex]} text-sm font-medium text-white`}>
                    {letter}
                </div>
                <span className="text-sm">{agentName}</span>
            </div>
        );
    };

    // Export functionality placeholder
    const handleExport = () => {
        // This would implement CSV/Excel export functionality
        console.log('Exporting transactions...', filteredTransactions);
        // You can implement actual export logic here
    };

    return (
        <div className="text-gray-600 flex min-h-screen flex-col bg-gray-50">
            {/* Header and Sidebar */}
            <StoreHeader />
            <div className="z-100">
      <StoreSidebar />  
      </div>

            {/* Main content wrapper with proper layout */}
           <main className="flex-grow p-4 lg:p-8 lg:ml-64 transition-all duration-300">
                {/* Main content */}
                <div className="flex flex-1 flex-col px-4 sm:px-6 mt-4 mb-4 max-w-6xl mx-auto w-full">
                    <div className="flex items-center mb-6">
                        <Receipt className="mr-2 text-blue-600 h-7 w-7" />
                        <h1 className="text-xl sm:text-2xl font-bold">
                            Transaction History
                        </h1>
                    </div>

                    {loading ? (
                        <div className="p-4 sm:p-6 rounded-xl shadow-sm bg-white mb-6 flex-1 w-full">
                            <div className="animate-pulse">
                                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                                <div className="h-64 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="p-4 sm:p-6 rounded-xl shadow-sm bg-white mb-6 flex-1 w-full">
                            <div className="text-center py-8">
                                <div className="text-red-500 mb-4">
                                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-lg font-medium">{error}</p>
                                </div>
                                <button
                                    onClick={retryFetch}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 sm:p-6 rounded-xl shadow-sm bg-white mb-6 flex-1 w-full">
                            {/* Search and filter bar */}
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 sm:gap-0">
                                <div className="relative w-full sm:w-72">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <SearchIcon className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="Search transactions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                        title="Filter Transactions"
                                    >
                                        <Filter className="h-4 w-4" />
                                        Filters
                                    </button>
                                    
                                    <button
                                        type="button"
                                        onClick={handleExport}
                                        className="inline-flex items-center gap-1 rounded-lg border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                                        title="Download Reports"
                                    >
                                        <Download className="h-4 w-4" />
                                        Export
                                    </button>
                                </div>
                            </div>
                            
                            <div className="border-b border-gray-200 mb-4"></div>

                            {filteredTransactions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg font-medium">
                                        {searchQuery ? 'No transactions match your search' : 'No transactions found'}
                                    </p>
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                                        >
                                            Clear search
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* Scrollable container for the table */}
                                    <div className="block md:hidden bg-gray-50 px-2 py-1 text-xs text-gray-600 border-b border-gray-200">
                                        Scroll horizontally to view all columns
                                    </div>
                                    <div className="overflow-x-auto">
                                        <div className="min-w-full inline-block align-middle">
                                            <div className="overflow-hidden">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                <div className="flex items-center">
                                                                    <Receipt className="mr-1 h-4 w-4 text-gray-400" />
                                                                    Transaction ID
                                                                </div>
                                                            </th>
                                                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                <div className="flex items-center">
                                                                    <User className="mr-1 h-4 w-4 text-gray-400" />
                                                                    Agent
                                                                </div>
                                                            </th>
                                                            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                <div className="flex items-center">
                                                                    <Calendar className="mr-1 h-4 w-4 text-gray-400" />
                                                                    Date
                                                                </div>
                                                            </th>
                                                            <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                <div className="flex items-center justify-end">
                                                                    <DollarSign className="mr-1 h-4 w-4 text-gray-400" />
                                                                    Amount (₦)
                                                                </div>
                                                            </th>
                                                            <th scope="col" className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Status
                                                            </th>
                                                            
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {filteredTransactions.map((txn) => (
                                                            <tr 
                                                                key={txn.id}
                                                                className="hover:bg-gray-50"
                                                            >
                                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                    {txn.id}
                                                                </td>
                                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                                    {getAgentAvatar(txn.agent)}
                                                                </td>
                                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {txn.date}
                                                                </td>
                                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                                                    ₦{txn.amount.toLocaleString()}
                                                                </td>
                                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                                                                    {getStatusChip(txn.status)}
                                                                </td>
                                                                
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="mt-auto mb-6 text-center">
                        <Link
                            to="/store"
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </div>
                </div>

                {/* Footer stays at the bottom */}
                <div className="fixed bottom-0 left-0 w-full">
        <Footer />
      </div>
            </main>
        </div>
    );
};

// Store user in localStorage for persistence
function setUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
}

export default STransactionHistoryPage;