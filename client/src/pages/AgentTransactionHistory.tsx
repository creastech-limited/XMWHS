import React, { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import AHeader from '../components/AHeader';

const AgentTransactionHistory = () => {
  

  type Transaction = {
    id: number;
    type: 'credit' | 'transfer';
    amount: number;
    description: string;
    date: string;
  };

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setTransactions([
        {
          id: 1,
          type: 'credit',
          amount: 50000,
          description: 'Payment from Kid A',
          date: '2025-03-01',
        },
        {
          id: 2,
          type: 'credit',
          amount: 25000,
          description: 'Payment from Parent B',
          date: '2025-02-28',
        },
        {
          id: 3,
          type: 'transfer',
          amount: 30000,
          description: 'Transfer to Parent Store',
          date: '2025-02-27',
        },
        {
          id: 4,
          type: 'credit',
          amount: 75000,
          description: 'Payment from Kid C',
          date: '2025-02-25',
        },
        {
          id: 5,
          type: 'transfer',
          amount: 20000,
          description: 'Transfer to Parent Store',
          date: '2025-02-24',
        },
      ]);
      setLoading(false);
    }, 1500);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8faff]">
      {/* Header */}
      <AHeader />

      {/* Main content */}
      <main className="text-gray-600 flex-grow">
        <div className="max-w-3xl mx-auto py-8 px-4">
          {loading ? (
            <div>
              <div className="h-16 bg-gray-200 rounded mb-4 animate-pulse"></div>
              <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">All Transactions</h2>
                <Link
                  to="/agent/transactions"
                  className="p-2 rounded-full hover:bg-gray-100"
                  title="Search transactions"
                >
                  <Search className="w-5 h-5 text-blue-600" />
                </Link>
              </div>
              <ul>
                {transactions.map((txn, index) => (
                  <React.Fragment key={txn.id}>
                    <li className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        {txn.type === 'credit' ? (
                          <ArrowDown className="text-green-500 w-5 h-5" />
                        ) : (
                          <ArrowUp className="text-pink-500 w-5 h-5" />
                        )}
                        <div>
                          <p className="font-medium">{txn.description}</p>
                          <p className="text-sm text-gray-500">{txn.date}</p>
                        </div>
                      </div>
                      <p
                        className={`font-bold text-sm ${
                          txn.type === 'credit' ? 'text-green-600' : 'text-pink-600'
                        }`}
                      >
                        {txn.type === 'credit' ? '+' : '-'}₦{txn.amount.toLocaleString()}
                      </p>
                    </li>
                    {index < transactions.length - 1 && (
                      <li aria-hidden="true" tabIndex={-1} className="p-0 m-0">
                        <hr className="ml-8 border-gray-200" />
                      </li>
                    )}
                  </React.Fragment>
                ))}
              </ul>
            </div>
          )}

          {/* Back Button */}
          <div className="text-center mt-6">
            <Link
              to="/agent"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              <span className="text-white">Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AgentTransactionHistory;
