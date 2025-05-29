import { useState } from 'react';
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
    Eye
} from 'lucide-react';
import StoreHeader from '../components/StoreHeader';
import StoreSidebar from '../components/StoreSidebar';
import Footer from '../components/Footer';

type Transaction = {
    id: string;
    date: string;
    amount: number;
    status: 'Completed' | 'Pending' | 'Failed';
    agent: string;
};

const STransactionHistoryPage = () => {
    // Dummy transaction data from agents to the store
    const [transactions] = useState<Transaction[]>([
        { id: 'TX1001', date: '28 Feb 2025', amount: 12500, status: 'Completed', agent: 'Agent A' },
        { id: 'TX1002', date: '27 Feb 2025', amount: 8750, status: 'Pending', agent: 'Agent B' },
        { id: 'TX1003', date: '27 Feb 2025', amount: 5000, status: 'Completed', agent: 'Agent C' },
        { id: 'TX1004', date: '26 Feb 2025', amount: 15250, status: 'Failed', agent: 'Agent D' },
        { id: 'TX1005', date: '25 Feb 2025', amount: 9800, status: 'Completed', agent: 'Agent E' }
    ]);

    const [searchQuery, setSearchQuery] = useState('');

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

    return (
        <div className="text-gray-600 flex min-h-screen flex-col bg-gray-50">
            {/* Header and Sidebar */}
            <StoreHeader />
            <StoreSidebar />

            {/* Main content wrapper with proper layout */}
            <main className="flex flex-1 flex-col md:ml-[280px] pt-16 sm:pt-20">
                {/* Main content */}
                <div className="flex flex-1 flex-col px-4 sm:px-6 mt-4 mb-4 max-w-6xl mx-auto w-full">
                    <div className="flex items-center mb-6">
                        <Receipt className="mr-2 text-blue-600 h-7 w-7" />
                        <h1 className="text-xl sm:text-2xl font-bold">
                            Transaction History
                        </h1>
                    </div>

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
                                    className="inline-flex items-center gap-1 rounded-lg border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                                    title="Download Reports"
                                >
                                    <Download className="h-4 w-4" />
                                    Export
                                </button>
                            </div>
                        </div>
                        
                        <div className="border-b border-gray-200 mb-4"></div>

                        {/* Scrollable container for the table */}
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
                                                <th scope="col" className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {transactions.map((txn) => (
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
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                        <button
                                                            type="button"
                                                            className="text-blue-600 hover:text-blue-900"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

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
                <Footer />
            </main>
        </div>
    );
};

export default STransactionHistoryPage;