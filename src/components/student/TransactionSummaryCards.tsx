// src/components/student/TransactionSummaryCards.tsx
import React from 'react';
import type { TransactionSummary } from '../../types/student';

interface TransactionSummaryCardsProps {
  summary: TransactionSummary;
  transactionCount: number;
}

const TransactionSummaryCards: React.FC<TransactionSummaryCardsProps> = ({
  summary,
  transactionCount,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm text-gray-500 mb-1">Total Bills</p>
        <p className="text-2xl font-bold text-gray-800">
          ₦{summary.total.toLocaleString()}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {transactionCount} transaction(s)
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm text-gray-500 mb-1">Paid</p>
        <p className="text-2xl font-bold text-green-600">
          ₦{summary.paid.toLocaleString()}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {summary.total > 0
            ? ((summary.paid / summary.total) * 100).toFixed(0)
            : 0}
          % of total
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm text-gray-500 mb-1">Remaining</p>
        <p className="text-2xl font-bold text-red-600">
          ₦{summary.remaining.toLocaleString()}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Outstanding balance
        </p>
      </div>
    </div>
  );
};

export default TransactionSummaryCards;