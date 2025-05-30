import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { 
  QrCode, 
  ArrowLeft, 
  Camera, 
  CheckCircle2, 
  RefreshCw,
  User,
  Mail,
  Wallet
} from 'lucide-react';
import Footer from '../components/Footer';
import AHeader from '../components/AHeader';
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging.up.railway.app';

interface QRCodeData {
  id: string;
  name: string;
  email: string;
  walletBalance: number;
  pin: string;
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

interface TransactionResponse {
  transactionId: string;
  message: string;
}

const AgentScanQR: React.FC = () => {
  const auth = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
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
  const [pin, setPin] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean>(false);

  const colors = {
    primary: '#3f51b5',
    success: '#4caf50',
    info: '#2196f3',
    background: '#f8faff',
  };

  // Initialize code reader and get video devices
  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();
    
    const initializeCamera = async () => {
      try {
        // First request camera access
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraPermissionGranted(true);
        
        // Stop the stream immediately after getting permission
        stream.getTracks().forEach(track => track.stop());
        
        // Then list devices
        const devices = await codeReader.current!.listVideoInputDevices();
        setVideoDevices(devices);
        
        if (devices.length > 0) {
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
          );
          setSelectedDeviceId(backCamera?.deviceId || devices[0].deviceId);
        } else {
          setCameraError('No cameras found on this device');
        }
      } catch (err) {
        console.error('Camera initialization error:', err);
        setCameraError('Camera access denied or not available');
      }
    };
    
    initializeCamera();

    return () => {
      stopScanning();
    };
  }, []);

  // Initialize authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        if (auth?.user?._id && auth?.token) {
          setToken(auth.token);
          setLoading(false);
          return;
        }
        
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          throw new Error('No authentication token found');
        }
        
        setToken(storedToken);
        
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError('Authentication error. Please login again.');
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, [auth]);

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

  const startScanning = async (): Promise<void> => {
    if (!codeReader.current || !videoRef.current) {
      setCameraError('Scanner not initialized');
      return;
    }

    try {
      setScanning(true);
      setError(null);
      setCameraError(null);

      // Start video stream
      const constraints = {
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          facingMode: 'environment'
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Start QR code scanning
      codeReader.current.decodeFromVideoDevice(
        selectedDeviceId || null,
        videoRef.current, 
        (result, err) => {
          if (result) {
            try {
              const decodedData = atob(result.getText());
              const qrData: QRCodeData = JSON.parse(decodedData);
              
              if (!qrData.id || !qrData.name || !qrData.email || !qrData.pin) {
                throw new Error('Invalid QR code format');
              }
              
              setScanResult({ qrData });
              setShowConfirmDialog(true);
              stopScanning();
            } catch (decodeError) {
              console.error('QR decode error:', decodeError);
              setError("Invalid QR code format. Please try again.");
            }
          }
          
          if (err && !(err instanceof NotFoundException)) {
            console.error('Scan error:', err);
            setCameraError('Scanning error occurred');
          }
        }
      );
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Failed to access camera. Please ensure permissions are granted.');
      setScanning(false);
    }
  };

  const stopScanning = (): void => {
    if (codeReader.current) {
      codeReader.current.reset();
    }
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setScanning(false);
  };

  const handleStartScan = (): void => {
    if (scanning) {
      stopScanning();
    } else {
      startScanning();
    }
  };

  const switchCamera = (): void => {
    if (videoDevices.length > 1) {
      const currentIndex = videoDevices.findIndex(device => device.deviceId === selectedDeviceId);
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      setSelectedDeviceId(videoDevices[nextIndex].deviceId);
      
      if (scanning) {
        stopScanning();
        setTimeout(() => startScanning(), 100);
      }
    }
  };

  const handleConfirmTransaction = (): void => {
    if (!scanResult || !amount) return;
    setShowConfirmDialog(false);
    setShowPinDialog(true);
  };

  const handlePinSubmit = async (): Promise<void> => {
    if (!scanResult || !amount || !pin) return;

    if (pin !== scanResult.qrData.pin) {
      setError('Invalid PIN. Transaction cancelled.');
      setShowPinDialog(false);
      setPin('');
      return;
    }

    setProcessingTransaction(true);
    setShowPinDialog(false);
    
    try {
      const transactionData: TransactionData = {
        recipientId: scanResult.qrData.id,
        amount: parseFloat(amount),
        description: description || 'QR Code Transfer',
        pin: pin
      };

      const result = await processWalletTransfer(transactionData);
      setTransactionId(result.transactionId);
      setProcessingTransaction(false);
      setTransactionComplete(true);
      setPin('');
    } catch (err) {
      setProcessingTransaction(false);
      setError(`Transaction failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setPin('');
    }
  };

  const resetScan = (): void => {
    stopScanning();
    setScanResult(null);
    setAmount('');
    setDescription('');
    setPin('');
    setError(null);
    setTransactionComplete(false);
    setCameraError(null);
  };

  const handleManualEntry = (): void => {
    const userIdInput = document.getElementById('userId') as HTMLInputElement;
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const pinInput = document.getElementById('manualPin') as HTMLInputElement;
    
    if (!userIdInput?.value || !nameInput?.value || !emailInput?.value || !pinInput?.value) {
      setError('Please fill in all required fields');
      return;
    }

    const manualQRData: QRCodeData = {
      id: userIdInput.value,
      name: nameInput.value,
      email: emailInput.value,
      walletBalance: 0,
      pin: pinInput.value
    };

    setScanResult({ qrData: manualQRData, manual: true });
    setShowConfirmDialog(true);
  };

  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermissionGranted(true);
      stream.getTracks().forEach(track => track.stop());
      
      const devices = await codeReader.current?.listVideoInputDevices();
      if (devices && devices.length > 0) {
        setVideoDevices(devices);
        setSelectedDeviceId(devices[0].deviceId);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Camera access denied. Please allow camera permissions.');
    }
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
      <AHeader />
      <main className="flex-grow p-4 sm:p-6">
        <div className="container mx-auto py-6 px-4 flex-grow max-w-4xl">
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 text-center">
            {(error || cameraError) && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 flex flex-col gap-2">
                <p className="font-medium">{error || cameraError}</p>
                {cameraError && (
                  <div className="text-sm">
                    <p>Make sure:</p>
                    <ul className="list-disc pl-5">
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
                <h3 className="text-xl font-bold mb-2">Transaction Successful!</h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-lg font-semibold">₦{parseFloat(amount).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Sent to: {scanResult?.qrData.name}</p>
                  <p className="text-sm text-gray-600">Transaction ID: {transactionId}</p>
                </div>
                <div className="mt-6 flex gap-4 justify-center">
                  <button 
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    onClick={resetScan}
                  >
                    <RefreshCw size={18} />
                    <span>Scan Another</span>
                  </button>
                  <Link
                    to="/agent"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <ArrowLeft size={18} />
                    <span>Back to Dashboard</span>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="w-full max-w-[350px] h-[350px] bg-black rounded-lg relative overflow-hidden mx-auto">
                  {scanning ? (
                    <>
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                        muted
                      />
                      
                      <div className="absolute inset-0 border-2 border-white opacity-30">
                        <div className="absolute inset-4 border-2 border-blue-500 rounded-lg">
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
                        </div>
                      </div>
                      
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        {videoDevices.length > 1 && (
                          <button 
                            onClick={switchCamera}
                            className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30"
                            aria-label="Switch camera"
                          >
                            <RefreshCw size={20} className="text-white" />
                          </button>
                        )}
                      </div>
                      
                      <div className="absolute bottom-4 left-4">
                        <p className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                          Position QR code within the frame
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Camera size={60} className="text-white" />
                      <p className="text-white mt-2">
                        {cameraPermissionGranted ? 'Click below to start scanning' : 'Camera access required'}
                      </p>
                      {!cameraPermissionGranted && (
                        <button
                          onClick={requestCameraAccess}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Allow Camera Access
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg mx-auto ${
                      !selectedDeviceId || !cameraPermissionGranted
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    onClick={handleStartScan}
                    disabled={!selectedDeviceId || !cameraPermissionGranted}
                  >
                    <QrCode size={20} />
                    {scanning ? 'Stop Scanning' : 'Start Scanning'}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Manual Entry Form */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <h3 className="text-gray-600 text-lg font-medium mb-4">Can't scan? Enter payment manually</h3>
            <div className="mt-4 max-w-md mx-auto">
              <div className="mb-4">
                <label htmlFor="userId" className="text-gray-600 block text-left mb-2">User ID *</label>
                <input
                  type="text"
                  id="userId"
                  className="text-gray-600 w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Enter user ID"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="name" className="text-gray-600 block text-left mb-2">Name *</label>
                <input
                  type="text"
                  id="name"
                  className="text-gray-600 w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Enter recipient name"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="text-gray-600 block text-left mb-2">Email *</label>
                <input
                  type="email"
                  id="email"
                  className="text-gray-600 w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Enter recipient email"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="manualPin" className="text-gray-600 block text-left mb-2">PIN *</label>
                <input
                  type="password"
                  id="manualPin"
                  className="text-gray-600 w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Enter recipient PIN"
                />
              </div>
              <button
                className="text-white bg-blue-600 w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-blue-700"
                onClick={handleManualEntry}
              >
                Continue with Manual Entry
              </button>
            </div>
          </div>
        </div>

        {/* Confirm Transaction Dialog */}
        {showConfirmDialog && scanResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-gray-600 text-lg font-bold mb-4">Confirm Transaction</h3>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold mb-2 text-gray-700">Recipient Details:</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-gray-500" />
                    <span className="text-gray-600">{scanResult.qrData.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mail size={16} className="text-gray-500" />
                    <span className="text-gray-600">{scanResult.qrData.email}</span>
                  </div>
                  {!scanResult.manual && (
                    <div className="flex items-center gap-2">
                      <Wallet size={16} className="text-gray-500" />
                      <span className="text-gray-600">Balance: ₦{scanResult.qrData.walletBalance?.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label htmlFor="confirmAmount" className="text-gray-600 block text-left mb-2">Amount (₦) *</label>
                  <input
                    type="number"
                    id="confirmAmount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-gray-600 w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="confirmDescription" className="text-gray-600 block text-left mb-2">Description (Optional)</label>
                  <input
                    type="text"
                    id="confirmDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="text-gray-600 w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Enter description"
                  />
                </div>

                <div className="text-gray-600 flex justify-end gap-3">
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    onClick={() => setShowConfirmDialog(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    onClick={handleConfirmTransaction}
                    disabled={!amount}
                  >
                    Continue
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
                <h3 className="text-gray-600 text-lg font-bold mb-4">PIN Verification</h3>
                <p className="text-gray-600 mb-4">Please ask <strong>{scanResult.qrData.name}</strong> to enter their PIN to verify this transaction:</p>
                
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-blue-800 font-semibold">Transaction Summary:</p>
                  <p className="text-blue-700">Amount: ₦{parseFloat(amount).toLocaleString()}</p>
                  <p className="text-blue-700">To: {scanResult.qrData.name}</p>
                  {description && <p className="text-blue-700">Note: {description}</p>}
                </div>

                <div className="mb-4">
                  <label htmlFor="pinInput" className="text-gray-600 block text-left mb-2">Enter PIN:</label>
                  <input
                    type="password"
                    id="pinInput"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="text-gray-600 w-full p-3 border border-gray-300 rounded-lg text-center text-lg tracking-wider"
                    placeholder="••••"
                    maxLength={4}
                  />
                </div>

                <div className="text-gray-600 flex justify-end gap-3">
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    onClick={() => {
                      setShowPinDialog(false);
                      setPin('');
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    onClick={handlePinSubmit}
                    disabled={!pin || pin.length < 4}
                  >
                    Verify & Process
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
              <p>Processing wallet transfer...</p>
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <Link
            to="/agent"
            className="bg-blue-600 px-6 py-2 rounded hover:bg-blue-700"
          >
            <span className="text-white">Back to Dashboard</span>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AgentScanQR;