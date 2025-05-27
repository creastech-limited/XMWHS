import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, History, Info } from 'lucide-react';
import AHeader from '../components/AHeader';
import Footer from '../components/Footer';

type TransferData = {
  amount: string;
  description: string;
  agentId: string;
  storeAccount: string;
};

const api = {
  async processTransfer(transferData: TransferData) {
    try {
      const response = await fetch('/api/transactions/transfer-to-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Transfer failed');
      return data;
    } catch (error) {
      console.error('Transfer processing error:', error);
      throw error;
    }
  },

  async getRecentTransfers() {
    return [
      { id: 'TXN123456', amount: 50000, date: '2025-03-01', status: 'success' },
      { id: 'TXN123455', amount: 25000, date: '2025-02-28', status: 'success' },
    ];
  },
};

const AgentTransferToStore = () => {
  const [agentData, setAgentData] = useState({
    name: 'Agent Alpha',
    walletBalance: 250000,
  });

  const [parentStoreData] = useState({
    name: 'Parent Store',
    accountNumber: 'STORE-12345',
  });

  const [form, setForm] = useState({ amount: '', description: '' });
  const [formErrors, setFormErrors] = useState({ amount: '' });
  const [processing, setProcessing] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const transactions = await api.getRecentTransfers();
        setRecentTransactions(transactions);
      } catch (err) {
        console.error('Failed to load transactions:', err);
      }
    };
    loadTransactions();
  }, []);

  const validateForm = useCallback(() => {
    let errorMsg = '';
    if (!form.amount) errorMsg = 'Amount is required';
    else if (isNaN(+form.amount) || +form.amount <= 0) errorMsg = 'Enter a valid amount';
    else if (+form.amount > agentData.walletBalance) errorMsg = 'Insufficient balance';

    setFormErrors({ amount: errorMsg });
    return errorMsg === '';
  }, [form.amount, agentData.walletBalance]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTransfer = async () => {
    if (!validateForm()) {
      setShowConfirm(false);
      return;
    }

    setProcessing(true);
    setShowConfirm(false);

    try {
      const transferData = {
        amount: form.amount,
        description: form.description,
        agentId: localStorage.getItem('agentId') || 'AGENT-001',
        storeAccount: parentStoreData.accountNumber,
      };

      const result = await api.processTransfer(transferData);
      const newBalance = agentData.walletBalance - Number(form.amount);

      setAgentData(prev => ({ ...prev, walletBalance: newBalance }));
      const newTransactionId = result.transactionId || 'TXN' + Math.floor(Math.random() * 1000000);
      setTransactionId(newTransactionId);
      setTransferComplete(true);

      setRecentTransactions(prev => [
        {
          id: newTransactionId,
          amount: Number(form.amount),
          date: new Date().toISOString().split('T')[0],
          status: 'success',
        },
        ...prev,
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setSnackbar(`Transfer failed: ${message}`);
    } finally {
      setProcessing(false);
    }
  };

  const resetTransfer = () => {
    setForm({ amount: '', description: '' });
    setFormErrors({ amount: '' });
    setTransferComplete(false);
    setTransactionId(null);
  };

  // Detect if the device is mobile (simple check)
  const isMobile = window.innerWidth <= 640;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8faff]">
      <AHeader />
      <main className="flex-grow p-4 sm:p-6">
        <div className="mx-auto py-8 px-4" 
        style={ isMobile ? { maxWidth: '100%' } : { maxWidth: '800px' }}>
          {transferComplete ? (
            <div className="bg-white shadow-md rounded-lg p-6 text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="text-green-600 w-10 h-10" />
              </div>
              <h2 className="text-green-700 text-xl font-bold mb-2">Transfer Successful!</h2>
              <p>
                You transferred <strong>₦{parseInt(form.amount).toLocaleString()}</strong> to{' '}
              {parentStoreData.name}.
            </p>
            <div className="bg-gray-100 p-4 rounded my-4 text-sm text-gray-700">
              <p><strong>Transaction ID:</strong> {transactionId}</p>
              <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
            </div>
            <div className="flex justify-center gap-4">
              <button onClick={resetTransfer} className="border px-4 py-2 rounded hover:bg-gray-50">New Transfer</button>
              <Link to="/agent/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Dashboard</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if (validateForm()) setShowConfirm(true); }}>
            <div className="text-gray-600 bg-white shadow-md rounded-lg p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Wallet className="w-5 h-5" />
                Transfer to {parentStoreData.name}
              </h2>

              <div className="flex items-center gap-2 bg-blue-100 text-blue-800 p-3 rounded mb-4 text-sm">
                <Info className="w-4 h-4" />
                Store Account: <strong>{parentStoreData.accountNumber}</strong>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Amount (₦)</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter amount"
                />
                {formErrors.amount && <p className="text-red-500 text-sm mt-1">{formErrors.amount}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter description"
                />
              </div>

              <button
                type="submit"
                disabled={!form.amount}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
              >
                Transfer Funds
              </button>
            </div>
          </form>
        )}

        {!transferComplete && (
          <div className="text-gray-600 bg-white shadow-md rounded-lg p-4 mt-6">
            <h3 className="flex items-center gap-2 font-semibold mb-3">
              <History className="w-4 h-4" />
              Recent Transfers
            </h3>
            {recentTransactions.length > 0 ? (
              recentTransactions.map(tx => (
                <div key={tx.id} className="flex justify-between bg-gray-100 p-3 rounded mb-2">
                  <div>
                    <div className="text-sm font-medium">{tx.id}</div>
                    <div className="text-xs text-gray-500">{tx.date}</div>
                  </div>
                  <div className="font-bold text-green-600">₦{tx.amount.toLocaleString()}</div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-gray-500 py-4">No recent transfers</p>
            )}
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="text-gray-600 fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-md w-full">
            <h4 className="font-semibold text-lg mb-2">Confirm Transfer</h4>
            <p>Please confirm the following details:</p>
            <ul className="text-sm my-4 space-y-1">
              <li><strong>Store:</strong> {parentStoreData.name}</li>
              <li><strong>Account:</strong> {parentStoreData.accountNumber}</li>
              <li><strong>Amount:</strong> ₦{parseInt(form.amount).toLocaleString()}</li>
              {form.description && <li><strong>Description:</strong> {form.description}</li>}
            </ul>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleTransfer} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {processing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent animate-spin rounded-full"></div>
            <p>Processing transfer...</p>
          </div>
        </div>
      )}

      {snackbar && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow z-50">
          {snackbar}
          <button onClick={() => setSnackbar('')} className="ml-4 underline text-sm">Dismiss</button>
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

export default AgentTransferToStore;
