import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { QrCode, Send, History, SearchIcon } from 'lucide-react';

import AHeader from '../components/AHeader';

interface Transaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  store: string;
  date: string;
}

interface AgentData {
  monthlyTarget: number;
  performance: number;
  targetCompletion: number;
}

const AgentDashboard = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );

  useEffect(() => {
    setTimeout(() => {
      setAgentData({
        monthlyTarget: 500000,
        performance: 92,
        targetCompletion: 65,
      });

      setRecentTransactions([
        {
          id: 1,
          type: 'credit',
          amount: 50000,
          store: 'MegaMart',
          date: '2025-02-28',
        },
        {
          id: 2,
          type: 'debit',
          amount: 25000,
          store: 'ValueStore',
          date: '2025-02-27',
        },
        {
          id: 3,
          type: 'credit',
          amount: 75000,
          store: 'SuperMart',
          date: '2025-02-25',
        },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const colors = {
    primary: '#3f51b5',
    secondary: '#f50057',
    success: '#4caf50',
    warning: '#ff9800',
    info: '#2196f3',
    background: '#f8faff',
  };

  if (loading) {
    return (
      <div className="bg-[#f8faff] min-h-screen p-4">
        <div className="bg-gray-200 h-28 mb-4 rounded-xl animate-pulse"></div>
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-gray-200 h-20 rounded-xl animate-pulse"
              ></div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="bg-gray-200 h-40 rounded-xl animate-pulse"
              ></div>
            ))}
          </div>
          <div className="bg-gray-200 h-48 rounded-xl animate-pulse mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8faff]">
      <AHeader />

      <main className="flex-grow p-4 sm:p-6">
        <div className="container mx-auto">
          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Link
              to="/agent/scanqr"
              className="flex items-center justify-center gap-2 py-4 sm:py-6 px-4 rounded-xl text-white font-medium shadow-md"
              style={{
                color: 'white',
                background: `linear-gradient(135deg, ${colors.info} 0%, ${colors.info}CC 100%)`,
              }}
              aria-label="Scan QR Code"
            >
              <QrCode />  
              <span>Scan QR Code</span>
            </Link>

            <Link
              to="/agent/transfertostore"
              className="flex items-center justify-center gap-2 py-4 sm:py-6 px-4 rounded-xl text-white font-medium shadow-md"
              style={{
                color: 'white',
                background: `linear-gradient(135deg, ${colors.warning} 0%, ${colors.warning}CC 100%)`,
              }}
              aria-label="Transfer to Store"
            >
              <Send />
              <span>Transfer to Store</span>
            </Link>

            <Link
              to="/agent/transactions"
              className="flex items-center justify-center gap-2 py-4 sm:py-6 px-4 rounded-xl text-white font-medium shadow-md"
              style={{
                color: 'white',
                background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.secondary}CC 100%)`,
              }}
              aria-label="Transaction History"
            >
              <History />
              <span>Transaction History</span>
            </Link>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div
              className="rounded-xl shadow-md p-6 text-white"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}CC 100%)`,
              }}
            >
              <h3 className="text-lg">Monthly Target</h3>
              <h2 className="text-2xl font-bold">
                ₦{agentData?.monthlyTarget.toLocaleString()}
              </h2>
              <div className="mt-4 mb-2">
                <p className="text-sm mb-1">
                  Progress: {agentData?.targetCompletion}%
                </p>
                <div className="w-full bg-white bg-opacity-30 rounded-full h-2.5">
                  <div
                    className="bg-white h-2.5 rounded-full"
                    style={{ width: `${agentData?.targetCompletion}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl shadow-md p-6 text-white"
              style={{
                background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.success}CC 100%)`,
              }}
            >
              <h3 className="text-lg">Performance</h3>
              <h2 className="text-2xl font-bold">{agentData?.performance}%</h2>
              <div className="mt-4 mb-2">
                <p className="text-sm mb-1">Agent Ranking: Top 10%</p>
                <div className="w-full bg-white bg-opacity-30 rounded-full h-2.5">
                  <div
                    className="bg-white h-2.5 rounded-full"
                    style={{ width: `90%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="rounded-xl shadow-sm bg-white mb-6">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-900 text-lg font-bold">
                  Recent Transactions
                </h3>
                <div className="flex gap-2">
                  <SearchIcon style={{ color: '#3f51b5' }} />
                  <Link
                    to="/agent/transactions"
                    className="p-2 text-gray-600 hover:text-[#3f51b5]"
                    aria-label="Search transactions"
                  >
                    
                  </Link>
                  <Link
                    to="/agent/transactions"
                    className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                    aria-label="View all transactions"
                  >
                    <span>View All</span>
                    <History className="text-sm" />
                  </Link>
                </div>
              </div>

              {/* Transactions list */}
              <div className="text-gray-900 space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex justify-between items-center p-3 border-b border-gray-100"
                  >
                    <div>
                      <p className="font-medium">{transaction.store}</p>
                      <p className="text-sm text-gray-500">
                        {transaction.date}
                      </p>
                    </div>
                    <div
                      className={`font-bold ${
                        transaction.type === 'credit'
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {transaction.type === 'credit' ? '+' : '-'}₦
                      {transaction.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
      </main>

      <Footer />
    </div>
  );
};

export default AgentDashboard;
