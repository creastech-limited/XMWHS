import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const API_BASE_URL = 'https://nodes-staging.up.railway.app';

interface IScannerProps {
  onResult: (result: { text: string } | null) => void;
  onError: (error: unknown) => void;
  constraints: { facingMode: string };
  containerStyle: { width: string; height: string };
  videoStyle: { width: string; height: string; objectFit: string };
}

interface QRCodeData {
  userId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  accountNumber: string;
  walletId: string;
  balance: number;
  currency: string;
  pin: string;
  timestamp: number;
  transactionType: string;
  qrCodeVersion: string;
}

interface ScanResult {
  qrData: QRCodeData;
  manual?: boolean;
}

interface TransactionData {
  recipientId: string;
  amount: number;
  description: string;
  pin: string;
}

interface PinVerificationData {
  userId: string;
  pin: string;
}

interface TransactionResponse {
  transactionId: string;
  message: string;
}

const AgentScanQR: React.FC<IScannerProps> = () => {
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [showPinDialog, setShowPinDialog] = useState<boolean>(false);
  const [processingTransaction, setProcessingTransaction] = useState<boolean>(false);
  const [verifyingPin, setVerifyingPin] = useState<boolean>(false);
  const [transactionComplete, setTransactionComplete] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [userEnteredPin, setUserEnteredPin] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrBoxId = 'qr-reader';

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

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
          scannerRef.current.clear();
        } catch (error) {
          console.error("Failed to clear html5 qrcode scanner", error);
        }
      }
    };
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
      
      // Set default camera (prefer rear camera if available)
      const rearCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      );
      setSelectedCameraId(rearCamera?.deviceId || videoDevices[0].deviceId);
    } catch (err) {
      console.error('Camera enumeration error:', err);
      setCameraError('Could not access camera. Please ensure permissions are granted and a camera is available.');
    }
  };

  const parseQRData = (data: string): QRCodeData => {
    try {
      // Try to parse directly first
      try {
        return JSON.parse(data);
      } catch {
        // If direct parse fails, try base64 decoding
        try {
          const decodedData = atob(data);
          return JSON.parse(decodedData);
        } catch {
          // If still fails, try URI component decoding
          const uriDecoded = decodeURIComponent(data);
          return JSON.parse(uriDecoded);
        }
      }
    } catch (error) {
      console.error('QR decode error:', error);
      throw new Error('Invalid QR code format');
    }
  };

  const handleScan = useCallback((data: string) => {
    if (data && !scanResult) {
      try {
        const qrData = parseQRData(data);
        
        if (!qrData.userId || !qrData.name || !qrData.email || !qrData.walletId) {
          throw new Error('Invalid QR code format');
        }

        if (qrData.transactionType !== 'payment') {
          throw new Error('Invalid QR code - not a payment QR code');
        }
        
        setScanResult({ qrData });
        setShowConfirmDialog(true);
        stopScanning();
      } catch (decodeError) {
        console.error('QR decode error:', decodeError);
        setError("Invalid QR code format. Please ensure this is a valid payment QR code.");
      }
    }
  }, [scanResult]);

  const startScanning = useCallback(() => {
    if (!selectedCameraId) {
      setCameraError('No camera selected');
      return;
    }

    setScanning(true);
    setError(null);
    setScanResult(null);

    // Configuration for the scanner
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
    };

    // Initialize the scanner
    scannerRef.current = new Html5Qrcode(qrBoxId);

    scannerRef.current.start(
      { deviceId: { exact: selectedCameraId } },
      config,
      (decodedText: string) => {
        handleScan(decodedText);
      },
      (error: unknown) => {
        // Parse error message to handle specific cases
        if (
          typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof (error as Record<string, unknown>).message === 'string'
        ) {
          const message = (error as Record<string, unknown>).message as string;
          if (message.includes('No MultiFormat Readers were able to detect the code')) {
            // This is normal - just means no QR code is detected yet
            return;
          }

          console.error('QR Scanner error:', message);

          // Handle camera start errors specifically
          if (message.includes('Could not start video stream')) {
            setCameraError('Could not start camera. Please check permissions and try again.');
          } else {
            setCameraError(message);
          }
        } else {
          setCameraError('Unknown scanner error');
        }

        stopScanning();
      }
    ).catch((err: unknown) => {
      console.error('Failed to start scanner:', err);
      setCameraError('Failed to start camera. Please try again.');
      stopScanning();
    });
  }, [selectedCameraId, handleScan]);

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const toggleScanning = () => {
    if (scanning) {
      stopScanning();
    } else {
      startScanning();
    }
  };

  const switchCamera = async (deviceId: string) => {
    setSelectedCameraId(deviceId);
    if (scanning) {
      await stopScanning();
      // Small delay to ensure scanner is fully stopped before restarting
      setTimeout(startScanning, 300);
    }
  };

  const verifyUserPin = async (pinData: PinVerificationData): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pin/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(pinData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'PIN verification failed');
      }
      return data.success || data.verified;
    } catch (error) {
      console.error('PIN verification error:', error);
      throw error;
    }
  };

  const processWalletTransfer = async (transactionData: TransactionData): Promise<TransactionResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/wallet/walletToWalletTransfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(transactionData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Transaction failed');
      }
      return data;
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  };

  const handleConfirmTransaction = () => {
    if (!scanResult || !amount) return;
    setShowConfirmDialog(false);
    setShowPinDialog(true);
  };

  const handlePinSubmit = async () => {
    if (!scanResult || !amount || !userEnteredPin) return;

    setVerifyingPin(true);
    
    try {
      const pinVerificationData: PinVerificationData = {
        userId: scanResult.qrData.userId,
        pin: userEnteredPin
      };

      const isPinValid = await verifyUserPin(pinVerificationData);
      
      if (!isPinValid) {
        setError('Invalid PIN. Please ask the customer to enter their correct PIN.');
        setVerifyingPin(false);
        setUserEnteredPin('');
        return;
      }

      setVerifyingPin(false);
      setProcessingTransaction(true);
      setShowPinDialog(false);
      
      const transactionData: TransactionData = {
        recipientId: scanResult.qrData.userId,
        amount: parseFloat(amount),
        description: description || 'QR Code Payment',
        pin: scanResult.qrData.pin
      };

      const result = await processWalletTransfer(transactionData);
      setTransactionId(result.transactionId);
      setProcessingTransaction(false);
      setTransactionComplete(true);
      setUserEnteredPin('');
    } catch (err) {
      setVerifyingPin(false);
      setProcessingTransaction(false);
      setError(`Transaction failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setUserEnteredPin('');
    }
  };

  const resetScan = () => {
    stopScanning();
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
                    <div id={qrBoxId} className="w-full h-full"></div>
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

                {/* Camera selection dropdown */}
                {availableCameras.length > 1 && (
                  <div className="mt-4">
                    <label htmlFor="camera-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Select Camera:
                    </label>
                    <select
                      id="camera-select"
                      value={selectedCameraId}
                      onChange={(e) => switchCamera(e.target.value)}
                      className="block w-full max-w-xs mx-auto p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      disabled={scanning}
                    >
                      {availableCameras.map((camera) => (
                        <option key={camera.deviceId} value={camera.deviceId}>
                          {camera.label || `Camera ${availableCameras.indexOf(camera) + 1}`}
                        </option>
                      ))}
                    </select>
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
                        Balance: {formatCurrency(scanResult.qrData.balance, scanResult.qrData.currency)}
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
                    className="w-full p-3 border border-gray-300 rounded-lg text-lg"
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
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="e.g., School fees, Meal payment"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
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
                    className="w-full p-3 border border-gray-300 rounded-lg text-center text-xl tracking-widest"
                    placeholder="••••"
                    maxLength={4}
                    disabled={verifyingPin}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    The customer must enter their 4-digit PIN
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    onClick={() => {
                      setShowPinDialog(false);
                      setUserEnteredPin('');
                    }}
                    disabled={verifyingPin}
                  >
                    Cancel
                  </button>
                  <button 
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    onClick={handlePinSubmit}
                    disabled={!userEnteredPin || userEnteredPin.length !== 4 || verifyingPin}
                  >
                    {verifyingPin ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Verifying...
                      </>
                    ) : (
                      'Verify & Process Payment'
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