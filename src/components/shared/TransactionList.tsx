// src/components/shared/TransactionList.tsx
import React from 'react';
import { FaWallet } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit' | 'pending';
  category?: string;
  status?: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  title?: string;
  viewAllLink?: string;
  emptyMessage?: string;
  maxItems?: number;
  className?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  title = 'Recent Transactions',
  viewAllLink,
  emptyMessage = 'No transactions available.',
  maxItems = 4,
  className = ''
}) => {
  const navigate = useNavigate();
  const displayTransactions = transactions.slice(0, maxItems);

  const getStatusColor = (transaction: Transaction) => {
    if (transaction.type === 'credit') return 'bg-green-100 text-green-600';
    if (transaction.type === 'pending') return 'bg-yellow-100 text-yellow-600';
    return 'bg-red-100 text-red-600';
  };

  const getAmountColor = (transaction: Transaction) => {
    if (transaction.type === 'credit') return 'text-green-600';
    if (transaction.type === 'pending') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAmountPrefix = (transaction: Transaction) => {
    if (transaction.type === 'credit') return '+';
    return '-';
  };

  const getStatusLabel = (status?: string) => {
    if (status === 'success') return 'Completed';
    if (status === 'failed') return 'Failed';
    return 'Pending';
  };

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-100 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {viewAllLink && (
          <button
            onClick={() => navigate(viewAllLink)}
            className="text-indigo-600 text-sm font-medium hover:underline"
          >
            View All
          </button>
        )}
      </div>
      <div className="overflow-y-auto max-h-72">
        {displayTransactions.length > 0 ? (
          <div className="space-y-3">
            {displayTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex justify-between items-center p-3 hover:bg-gray-50 rounded transition-colors"
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-3 ${getStatusColor(transaction)}`}>
                    <FaWallet className="text-sm" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {transaction.category || transaction.description}
                    </p>
                    <div className="flex items-center">
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {transaction.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${getAmountColor(transaction)}`}>
                    {getAmountPrefix(transaction)}₦
                    {(Number(transaction.amount) || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getStatusLabel(transaction.status)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600 text-center py-8">
            {emptyMessage}
          </p>
        )}
      </div>
    </div>
  );
};