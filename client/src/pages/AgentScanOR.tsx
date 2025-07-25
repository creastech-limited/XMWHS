import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  QrCode, 
  ArrowLeft, 
  Camera, 
  CheckCircle2, 
  RefreshCw,
  User,
  Mail,
  Wallet, 
  CreditCard,
  Shield,
  X
} from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface QRCodeData {
  userld?: string; 
  userId?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  accountNumber: string;
  walletId?: string;
  wallet?: {
    currency: string;
  };
  balance?: number;
  currency?: string;
  pin?: string;
  timestamp: number | string;
  transactionType: string;
  qrCodeVersion?: string;
  type?: string; 
}

interface ScanResult {
  qrData: QRCodeData;
  manual?: boolean;  
}

interface TransactionData {
  receiverEmail: string;
  amount: number;
  pin: string;
}

interface TransactionResponse {
  transactionId?: string;
  message: string;
  // Add other possible response fields based on your API
}

const AgentScanQR: React.FC = () => {
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [showPinDialog, setShowPinDialog] = useState<boolean>(false);
  const [processingTransaction, setProcessingTransaction] = useState<boolean>(false);
  const [transactionComplete, setTransactionComplete] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [userEnteredPin, setUserEnteredPin] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const colors = {
    primary: '#3f51b5',
    success: '#4caf50',
    info: '#2196f3',
    background: '#f8faff',
  };

  // Initialize authentication and camera
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setError('Authentication required. Please login.');
      return;
    }
    setToken(storedToken);
    enumerateCameras();
    setLoading(false);
  }, []);

  // Enumerate available cameras
  const enumerateCameras = async () => {
    try {
      // First request permission
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Then enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw new Error('No cameras found');
      }
      
      setAvailableCameras(videoDevices);
    } catch (err) {
      console.error('Camera enumeration error:', err);
      setCameraError('Could not access camera. Please ensure permissions are granted and a camera is available.');
    }
  };

 const parseQRData = (data: string): QRCodeData => {
  try {
    // First try to parse directly
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(data);
    } catch {
      // If direct parse fails, try cleaning the string
      const cleanedData = data
        .replace(/['']/g, '"') // Replace curly quotes
        .replace(/'/g, '"');    // Replace single quotes
      parsedData = JSON.parse(cleanedData);
    }

    // Normalize the data structure
    if (typeof parsedData !== 'object' || parsedData === null) {
      throw new Error('Invalid QR code format');
    }
    const normalizedData: QRCodeData = {
      ...(parsedData as object),
      // Handle userld vs userId
      userId: (typeof parsedData === 'object' && parsedData !== null && 'userId' in parsedData ? (parsedData as { userId?: string }).userId : undefined)
        || (typeof parsedData === 'object' && parsedData !== null && 'userld' in parsedData ? (parsedData as { userld?: string }).userld : undefined),
      // Required fields with fallback to empty string if missing
      name: (parsedData as Record<string, unknown>).name as string || '',
      email: (parsedData as Record<string, unknown>).email as string || '',
      role: (parsedData as Record<string, unknown>).role as string || '',
      accountNumber: (parsedData as Record<string, unknown>).accountNumber as string || '',
      timestamp: (parsedData as Record<string, unknown>).timestamp as number || Date.now(),
      // Handle wallet currency
      currency: (parsedData as Record<string, unknown>).currency as string || ((parsedData as Record<string, unknown>).wallet as { currency?: string } | undefined)?.currency,
      // Handle different transaction type fields
      transactionType: (parsedData as Record<string, unknown>).transactionType as string || (parsedData as Record<string, unknown>).type as string,
    };

    // Validate required fields
    if (!normalizedData.userId || !normalizedData.name || !normalizedData.accountNumber || !normalizedData.email) {
      throw new Error('Invalid QR code - missing required fields');
    }

    return normalizedData;
  } catch (error) {
    console.error('QR decode error:', error);
    throw new Error('Invalid QR code format');
  }
};

 const handleScan = useCallback((data: string) => {
  if (data && !scanResult) {
    try {
      const qrData = parseQRData(data);
      
      // Check if this is a payment QR code
      if (qrData.transactionType !== 'payment' && qrData.type !== 'payment_request') {
        throw new Error('Invalid QR code - not a payment QR code');
      }
      
      setScanResult({ qrData });
      setShowConfirmDialog(true);
      setScanning(false);
    } catch (decodeError) {
      console.error('QR decode error:', decodeError);
      setError("Couldn't read QR code. Please ensure this is a valid payment QR code.");
      setScanning(false);
    }
  }
}, [scanResult]);

  const toggleScanning = () => {
    setScanning(!scanning);
    setError(null);
    setScanResult(null);
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Single function to handle both PIN verification and transfer
  const processTransfer = async (transactionData: TransactionData): Promise<TransactionResponse> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/transaction/transfertoagent`,
        {
          senderEmail: transactionData.receiverEmail,
          amount: transactionData.amount,
          pin: transactionData.pin
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Transfer error:', error);
      
      // Handle axios error response
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.message || 'Transaction failed';
        throw new Error(errorMessage);
      }
      
      throw new Error('Transaction failed. Please try again.');
    }
  };

  const handleConfirmTransaction = () => {
    if (!scanResult || !amount) return;
    setShowConfirmDialog(false);
    setShowPinDialog(true);
  };

  const handlePinSubmit = async () => {
    if (!scanResult || !amount || !userEnteredPin) return;

    setProcessingTransaction(true);
    setShowPinDialog(false);
    
    try {
      if (!scanResult.qrData.email) {
        setError('Invalid QR code: missing email address.');
        setProcessingTransaction(false);
        return;
      }

      const transactionData: TransactionData = {
        receiverEmail: scanResult.qrData.email,
        amount: Number(amount),
        pin: userEnteredPin
      };

      const result = await processTransfer(transactionData);
      
      // Handle successful response
      setTransactionId(result.transactionId || 'N/A');
      setProcessingTransaction(false);
      setTransactionComplete(true);
      setUserEnteredPin('');
      
    } catch (err) {
      setProcessingTransaction(false);
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      
      // Handle specific error cases
      if (errorMessage.toLowerCase().includes('pin')) {
        setError('Invalid PIN. Please ask the customer to enter their correct PIN.');
      } else if (errorMessage.toLowerCase().includes('insufficient')) {
        setError('Insufficient funds. Please check the customer\'s account balance.');
      } else if (errorMessage.toLowerCase().includes('email')) {
        setError('Invalid recipient email. Please verify the QR code.');
      } else {
        setError(`Transaction failed: ${errorMessage}`);
      }
      
      setUserEnteredPin('');
      setShowPinDialog(true); // Allow user to retry PIN entry
    }
  };

  const resetScan = () => {
    setScanning(false);
    setScanResult(null);
    setAmount('');
    setDescription('');
    setUserEnteredPin('');
    setError(null);
    setTransactionComplete(false);
    setCameraError(null);
  };

  const formatCurrency = (amount: number, currency: string = 'NGN'): string => {
    const symbol = currency === 'NGN' ? '₦' : currency;
    return `${symbol}${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: colors.background }}>
      <main className="flex-grow p-4 sm:p-6">
        <div className="container mx-auto py-6 px-4 flex-grow max-w-4xl">
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 text-center">
            {(error || cameraError) && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 flex flex-col gap-2">
                <p className="font-medium">{error || cameraError}</p>
                {cameraError && (
                  <div className="text-sm">
                    <p>Make sure:</p>
                    <ul className="list-disc pl-5 text-left">
                      <li>You've granted camera permissions</li>
                      <li>Your device has a working camera</li>
                      <li>No other app is using the camera</li>
                    </ul>
                  </div>
                )}
                <button 
                  className="self-end text-red-700 hover:text-red-900 text-sm font-medium mt-2"
                  onClick={resetScan}
                >
                  Try Again
                </button>
              </div>
            )}

            {transactionComplete ? (
              <>
                <CheckCircle2 size={80} className="mx-auto mb-4" style={{ color: colors.success }} />
                <h3 className="text-xl font-bold mb-2">Payment Successful!</h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(parseFloat(amount), scanResult?.qrData.currency)}
                  </p>
                  <p className="text-sm text-gray-600">Paid to: {scanResult?.qrData.name}</p>
                  <p className="text-sm text-gray-600">Email: {scanResult?.qrData.email}</p>
                  <p className="text-sm text-gray-600">Account: {scanResult?.qrData.accountNumber}</p>
                  <p className="text-xs text-gray-500 mt-2">Transaction ID: {transactionId}</p>
                </div>
                <div className="mt-6 flex gap-4 justify-center">
                  <button 
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    onClick={resetScan}
                  >
                    <RefreshCw size={18} />
                    <span>Process Another Payment</span>
                  </button>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => window.history.back()}
                  >
                    <ArrowLeft size={18} />
                    <span>Back to Dashboard</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">QR Code Payment Scanner</h2>
                <p className="text-gray-600 mb-6">Scan customer's payment QR code to process transaction</p>
                
                <div className="w-full max-w-[350px] h-[350px] bg-black rounded-lg relative overflow-hidden mx-auto">
       {scanning ? (
  <div className="relative w-full h-full">
  <Scanner
    onScan={(data) => {
      if (Array.isArray(data) && data.length > 0 && data[0]?.rawValue) {
        handleScan(data[0].rawValue);
      } else if (typeof data === 'string') {
        handleScan(data);
      }
    }}
    constraints={{
      facingMode,
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }}
    onError={(error) => {
      console.error('Scanner error:', error);
      setCameraError('Failed to access camera. Please ensure permissions are granted.');
      setScanning(false);
    }}
    components={{
      tracker: () => null,
      torch: true,
    }}
    styles={{
      container: {
        width: '100%',
        height: '100%',
        position: 'relative'
      } as React.CSSProperties,
      video: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
      } as React.CSSProperties
    }}
  />
    <div className="absolute inset-0 border-4 border-blue-500 rounded-lg pointer-events-none"></div>
  </div>
) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <QrCode size={60} className="text-white mb-2" />
                      <Camera size={40} className="text-white" />
                      <p className="text-white mt-2 text-center">
                      {availableCameras.length > 0 ? 'Ready to scan payment QR code' : 'Camera access required'}
                      </p>
                      {availableCameras.length === 0 && (
                      <button
                        onClick={enumerateCameras}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Allow Camera Access
                      </button>
                      )}
                    </div>
                    )}
                </div>

                {scanning && availableCameras.length > 1 && (
                  <div className="mt-4">
                    <button
                      onClick={switchCamera}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                    >
                      Switch to {facingMode === 'environment' ? 'Front' : 'Rear'} Camera
                    </button>
                  </div>
                )}

                <div className="mt-6">
                  <button
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg mx-auto font-medium ${
                      availableCameras.length === 0
                        ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                        : scanning
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    onClick={toggleScanning}
                    disabled={availableCameras.length === 0}
                  >
                    <QrCode size={20} />
                    {scanning ? 'Stop Scanning' : 'Start Scanning'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Confirm Transaction Dialog */}
        {showConfirmDialog && scanResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Confirm Payment Details</h3>
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold mb-3 text-blue-800 flex items-center gap-2">
                    <User size={16} />
                    Customer Information:
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-blue-600" />
                      <span className="text-blue-700 font-medium">{scanResult.qrData.name}</span>
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {scanResult.qrData.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-blue-600" />
                      <span className="text-blue-700">{scanResult.qrData.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard size={14} className="text-blue-600" />
                      <span className="text-blue-700">Account: {scanResult.qrData.accountNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wallet size={14} className="text-blue-600" />
                      <span className="text-blue-700">
                        Balance: {formatCurrency(scanResult.qrData.balance ?? 0, scanResult.qrData.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="confirmAmount" className="block text-left mb-2 font-medium text-gray-700">
                    Payment Amount ({scanResult.qrData.currency || 'NGN'}) *
                  </label>
                  <input
                    type="number"
                    id="confirmAmount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-lg text-black"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="confirmDescription" className="block text-left mb-2 font-medium text-gray-700">
                    Payment Description (Optional)
                  </label>
                  <input
                    type="text"
                    id="confirmDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-black"
                    placeholder="e.g., School fees, Meal payment"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-black"
                    onClick={() => setShowConfirmDialog(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    onClick={handleConfirmTransaction}
                    disabled={!amount || parseFloat(amount) <= 0}
                  >
                    Continue to PIN Verification
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PIN Verification Dialog */}
        {showPinDialog && scanResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="text-green-600" size={24} />
                  <h3 className="text-lg font-bold text-gray-800">Customer PIN Verification</h3>
                </div>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <p className="text-yellow-800 font-medium">
                    🔒 Ask customer to enter their PIN to authorize this payment
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Payment Summary:</h4>
                  <div className="space-y-1">
                    <p className="text-gray-700">
                      <span className="font-medium">Amount:</span> {formatCurrency(parseFloat(amount), scanResult.qrData.currency)}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">To:</span> {scanResult.qrData.name}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Email:</span> {scanResult.qrData.email}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Account:</span> {scanResult.qrData.accountNumber}
                    </p>
                    {description && (
                      <p className="text-gray-700">
                        <span className="font-medium">Description:</span> {description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <label htmlFor="pinInput" className="block text-left mb-2 font-medium text-gray-700">
                    Customer's PIN:
                  </label>
                  <input
                    type="password"
                    id="pinInput"
                    value={userEnteredPin}
                    onChange={(e) => setUserEnteredPin(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-center text-xl tracking-wides text-black"
                    placeholder="••••"
                    maxLength={4}
                    disabled={processingTransaction}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    The customer must enter their 4-digit PIN
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-black"
                    onClick={() => {
                      setShowPinDialog(false);
                      setUserEnteredPin('');
                    }}
                    disabled={processingTransaction}
                  >
                    Cancel
                  </button>
                  <button 
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    onClick={handlePinSubmit}
                    disabled={!userEnteredPin || userEnteredPin.length !== 4 || processingTransaction}
                  >
                    {processingTransaction ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      'Verify PIN & Process Payment'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing Dialog */}
        {processingTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-medium">Processing payment...</p>
              <p className="text-sm text-gray-600 mt-2">Please wait while we complete the transaction</p>
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 bg-gray-600 px-6 py-2 rounded hover:bg-gray-700 text-white"
          >
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default AgentScanQR;