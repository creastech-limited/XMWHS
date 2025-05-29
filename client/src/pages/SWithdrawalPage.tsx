import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Banknote,
  Send,
  CreditCard,
  ArrowLeft,
  Info,
  CheckCircle2,
  User,
  Receipt,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import StoreHeader from '../components/StoreHeader';
import StoreSidebar from '../components/StoreSidebar';
import Footer from '../components/Footer';

type BankOption = {
  value: string;
  label: string;
};

type FormData = {
  amount: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
};

const SWithdrawalPage = () => {
  // Sample bank options
  const bankOptions: BankOption[] = [
    { value: 'first-bank', label: 'First Bank' },
    { value: 'gtb', label: 'Guaranty Trust Bank' },
    { value: 'zenith', label: 'Zenith Bank' },
    { value: 'access', label: 'Access Bank' },
    { value: 'uba', label: 'United Bank for Africa' }
  ];

  // Form state for withdrawal details
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    bankName: '',
    accountNumber: '',
    accountName: ''
  });

  // Available balance (sample data)
  const availableBalance = 45000;

  // Snackbar state for feedback messages
  const [snackbar, setSnackbar] = useState<SnackbarState>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });
  
  // Loading state
  const [loading, setLoading] = useState(false);
  
  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate processing the withdrawal request via Paystack API.
    setTimeout(() => {
      setSnackbar({ 
        open: true, 
        message: 'Withdrawal request submitted successfully!', 
        severity: 'success' 
      });
      setFormData({
        amount: '',
        bankName: '',
        accountNumber: '',
        accountName: ''
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="text-gray-600 flex min-h-screen flex-col bg-gray-50">
      {/* Header and Sidebar */}
      <StoreHeader />
      <StoreSidebar />
      
      {/* Main content wrapper with proper layout */}
      <main className="flex flex-1 flex-col md:ml-[280px] pt-16 sm:pt-20">
        {/* Main content */}
        <div className="flex flex-1 flex-col px-4 sm:px-6 mt-4 mb-4 max-w-6xl mx-auto">
          {/* Withdrawal process steps */}
          <div className="hidden sm:flex mb-6">
            <div className="w-full flex justify-center">
              <div className="flex items-center">
                <div className="flex flex-col items-center mx-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">1</div>
                  <span className="mt-2 text-sm font-medium">Enter Details</span>
                </div>
                <ChevronRight className="text-gray-400" />
                <div className="flex flex-col items-center mx-4">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">2</div>
                  <span className="mt-2 text-sm font-medium text-gray-500">Review</span>
                </div>
                <ChevronRight className="text-gray-400" />
                <div className="flex flex-col items-center mx-4">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">3</div>
                  <span className="mt-2 text-sm font-medium text-gray-500">Confirmation</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left side - Withdrawal Form */}
            <div className="md:col-span-2">
              <div className="p-6 rounded-xl shadow-sm bg-white mb-6 h-full">
                <div className="flex items-center mb-6">
                  <Banknote className="mr-3 text-blue-600 h-7 w-7" />
                  <h1 className="text-2xl font-bold">
                    Withdrawal
                  </h1>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Enter your account details below to withdraw funds to your preferred account via Paystack.
                </p>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                      Withdrawal Amount (₦)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="amount"
                        className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={handleChange('amount')}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-500"
                          title="Maximum amount you can withdraw is ₦45,000"
                        >
                          <Info className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Available Balance: ₦{availableBalance.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Banknote className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="bankName"
                        className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                        value={formData.bankName}
                        onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                        required
                      >
                        <option value="">Select Bank</option>
                        {bankOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Receipt className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="accountNumber"
                        className="block w-full pl-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1234567890"
                        value={formData.accountNumber}
                        onChange={handleChange('accountNumber')}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">
                      Account Holder's Name
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="accountName"
                        className="block w-full pl-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="John Doe"
                        value={formData.accountName}
                        onChange={handleChange('accountName')}
                        required
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-200 flex items-center justify-center"
                  >
                    <Send className="mr-2 h-5 w-5" />
                    {loading ? 'Processing...' : 'Withdraw Now'}
                  </button>
                </form>
              </div>
            </div>
            
            {/* Right side - Information Panel */}
            <div className="md:col-span-1 space-y-6">
              <div className="p-6 rounded-xl shadow-sm bg-blue-600 text-white">
                <h2 className="text-lg font-medium mb-4 flex items-center">
                  <Info className="mr-2 h-5 w-5" /> Withdrawal Information
                </h2>
                <div className="border-b border-blue-500 mb-4"></div>
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-1">Processing Time:</h3>
                  <p className="text-sm opacity-90">1-2 business days</p>
                </div>
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-1">Withdrawal Fee:</h3>
                  <p className="text-sm opacity-90">₦100 for transactions below ₦5,000</p>
                  <p className="text-sm opacity-90">₦200 for transactions above ₦5,000</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Available Balance:</h3>
                  <p className="text-xl font-bold">₦{availableBalance.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="p-6 rounded-xl shadow-sm bg-gray-50">
                <h2 className="text-lg font-medium mb-4 flex items-center">
                  <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" /> Tips
                </h2>
                <div className="border-b border-gray-200 mb-4"></div>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Ensure the account details match the bank account information.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>The minimum withdrawal amount is ₦1,000.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>For any issues with your withdrawal, please contact our support team.</span>
                  </li>
                </ul>
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
      
      {/* Snackbar notification */}
      {snackbar.open && (
        <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg ${
          snackbar.severity === 'success' ? 'bg-green-600' :
          snackbar.severity === 'error' ? 'bg-red-600' :
          snackbar.severity === 'warning' ? 'bg-amber-600' : 'bg-blue-600'
        } text-white`}>
          <div className="flex items-center">
            {snackbar.severity === 'success' && <CheckCircle2 className="mr-2 h-5 w-5" />}
            {snackbar.severity === 'error' && <AlertCircle className="mr-2 h-5 w-5" />}
            <span>{snackbar.message}</span>
            <button 
              onClick={() => setSnackbar({...snackbar, open: false})}
              className="ml-4"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SWithdrawalPage;