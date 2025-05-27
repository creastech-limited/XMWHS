import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import QrScanner from 'react-qr-scanner';
import { 
  QrCode, 
  ArrowLeft, 
  Zap, 
  ZapOff, 
  Camera, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import Footer from '../components/Footer';
import AHeader from '../components/AHeader';


interface ScanResult {
  userId: string;
  amount: string | number;
  manual?: boolean;
  text?: string;
}

interface TransactionResponse {
  transactionId: string;
  [key: string]: string;
}

const AgentScanQR: React.FC = () => {

  useEffect(() => {
    const handleResize = () => {
    
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  

  const [scanning, setScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [processingTransaction, setProcessingTransaction] = useState<boolean>(false);
  const [transactionComplete, setTransactionComplete] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const colors = {
    primary: '#3f51b5',
    success: '#4caf50',
    info: '#2196f3',
    background: '#f8faff',
  };

  const processTransaction = async (qrData: ScanResult, amount: string | number | null = null): Promise<TransactionResponse> => {
    try {
      const response = await fetch('/api/transactions/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrData,
          amount: amount || qrData.amount,
          agentId: localStorage.getItem('agentId'),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Transaction failed');
      return data;
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  };

  const handleStartScan = (): void => {
    setScanning(true);
    setError(null);
    setScanResult(null);
    setTransactionComplete(false);
    setCameraError(null);
  };

  const handleConfirmTransaction = async (): Promise<void> => {
    if (!scanResult) return;

    setProcessingTransaction(true);
    setShowConfirmDialog(false);
    try {
      const result = await processTransaction(scanResult, amount || undefined);
      setTransactionId(result.transactionId);
      setProcessingTransaction(false);
      setTransactionComplete(true);
    } catch (err) {
      setProcessingTransaction(false);
      setError(`Transaction failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const resetScan = (): void => {
    setScanResult(null);
    setAmount('');
    setError(null);
    setTransactionComplete(false);
    setCameraError(null);
  };

  const toggleFlash = (): void => {
    setFlashOn(!flashOn);
  };

  const toggleCamera = (): void => {
    setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: colors.background }}>
      <AHeader />
 <main className="flex-grow p-4 sm:p-6">
      <div className="container mx-auto py-6 px-4 flex-grow max-w-4xl">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 text-center">
          {(error || cameraError) && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 flex justify-between items-center">
              <p>{error || cameraError}</p>
              <button 
                className="text-red-700 hover:text-red-900 text-sm font-medium"
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
              <p className="text-lg">₦{parseInt(amount || scanResult?.amount?.toString() || '0').toLocaleString()}</p>
              <p className="text-sm">Transaction ID: {transactionId}</p>
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
                    <QrScanner
                      delay={300}
                      style={{ width: '100%', height: '100%' }}
                      onError={(err: Error) => {
                        console.error("QR error:", err);
                        setCameraError("Camera error: " + err.message);
                        setScanning(false);
                      }}
                      onScan={(data: { text?: string } | null) => {
                        if (data) {
                          try {
                            interface ParsedQR {
                              userId: string;
                              amount: string | number;
                              [key: string]: unknown;
                            }
                            const parsed: ParsedQR = JSON.parse(data.text || (data as unknown as string));
                            setScanResult(parsed);
                            setShowConfirmDialog(true);
                            setScanning(false);
                          } catch {
                            setError("Invalid QR code format. Please try again.");
                          }
                        }
                      }}
                      facingMode={facingMode}
                    />
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <button 
                        onClick={toggleFlash}
                        className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30"
                        aria-label={flashOn ? "Turn flash off" : "Turn flash on"}
                      >
                        {flashOn ? <Zap size={20} /> : <ZapOff size={20} />}
                      </button>
                      <button 
                        onClick={toggleCamera}
                        className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30"
                        aria-label="Switch camera"
                      >
                        <RefreshCw size={20} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Camera size={60} className="text-white" />
                    <p className="text-white mt-2">Click below to start scanning</p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <button
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
                  onClick={scanning ? resetScan : handleStartScan}
                >
                  <QrCode size={20} />
                  {scanning ? 'Cancel Scanning' : 'Start Scanning'}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <h3 className="text-gray-600 text-lg font-medium mb-4">Can't scan? Enter payment manually</h3>
          <div className="mt-4 max-w-md mx-auto">
            <div className="mb-4">
              <label htmlFor="userId" className="text-gray-600 block text-left mb-2">User ID</label>
              <input
                type="text"
                id="userId"
                className="text-gray-600 w-full p-3 border border-gray-300 rounded-lg"
                placeholder="Enter user ID"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="amount" className="text-gray-600 block text-left mb-2">Amount (₦)</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-gray-600 w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
            <button
              className="text-white bg-blue-600 w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!amount}
              onClick={() => {
                const userId = (document.getElementById('userId') as HTMLInputElement)?.value;
                setScanResult({ userId: userId || "MANUAL", amount, manual: true });
                setShowConfirmDialog(true);
              }}
            >
              Process Manual Payment
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-gray-600 text-lg font-bold mb-4">Confirm Transaction</h3>
              <p className="text-gray-600 mb-4">Please confirm payment details:</p>
              <p className="text-gray-600 mb-2"><strong>User ID:</strong> {scanResult?.userId}</p>
              <p className="text-gray-600 mb-4"><strong>Amount:</strong> ₦{parseInt(amount || scanResult?.amount?.toString() || '0').toLocaleString()}</p>
              <div className="text-gray-600 flex justify-end gap-3">
                <button 
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  onClick={() => setShowConfirmDialog(false)}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={handleConfirmTransaction}
                >
                  Confirm
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
            <p>Processing payment...</p>
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
