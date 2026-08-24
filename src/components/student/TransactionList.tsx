// src/components/student/TransactionList.tsx
import React from 'react';
import {
  DocumentTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import type { Bill } from '../../types/student';

interface TransactionListProps {
  bills: Bill[];
  studentName: string;
}

const TransactionList: React.FC<TransactionListProps> = ({ bills, studentName }) => {
  if (bills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <DocumentTextIcon className="h-16 w-16 text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg">
          No transactions found for {studentName}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Transactions will appear here when payments are made
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {bills.map((bill) => (
        <div
          key={bill.id}
          className={`bg-white rounded-xl shadow-sm p-6 transition-all duration-200 hover:shadow-md
            ${bill.status === 'paid' ? 'border-2 border-green-500' : 'border border-gray-100'}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  {bill.description}
                </h3>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-gray-500">
                  {bill.status === 'paid' ? 'Paid on' : 'Due'}: {bill.dueDate}
                </p>
              </div>
              <p className="text-xs text-gray-400">
                {bill.term} - {bill.session}
              </p>
            </div>
            <span
              className={`
                px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1
                ${bill.status === 'paid'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                }
              `}
            >
              {bill.status === 'paid' ? (
                <>
                  <CheckCircleIcon className="h-3 w-3" /> Paid
                </>
              ) : (
                <>
                  <ExclamationCircleIcon className="h-3 w-3" /> Unpaid
                </>
              )}
            </span>
          </div>
          <hr className="my-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-lg font-semibold text-gray-800">
                ₦{bill.amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount Paid</p>
              <p className="text-lg font-semibold text-green-600">
                ₦{bill.amountPaid.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Remaining</p>
              <p className="text-lg font-semibold text-orange-600">
                ₦{bill.remainingAmount.toLocaleString()}
              </p>
            </div>
          </div>
          {bill.transactionId !== 'N/A' && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">Transaction ID</p>
              <p className="text-sm font-mono text-gray-700">
                {bill.transactionId}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TransactionList;