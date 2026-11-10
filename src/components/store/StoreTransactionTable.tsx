
import React from 'react';
import { Link } from 'react-router-dom';
import type { Transaction } from '../../types';

interface StoreTransactionTableProps {
  transactions: Transaction[];
  onRefresh: () => void;
  viewAllLink: string;
}

const StoreTransactionTable: React.FC<StoreTransactionTableProps> = ({
  transactions,
  onRefresh,
  viewAllLink,
}) => {
  const getStatusBadge = (status: Transaction['status']) => {
    const styles: Record<string, { badge: string; dot: string }> = {
      Completed: {
        badge: 'bg-[#ECFDF3] text-[#16A34A]',
        dot: 'bg-emerald-500',
      },
      Pending: {
        badge: 'bg-[#FEF3C7] text-[#92400E]',
        dot: 'bg-amber-500',
      },
      Failed: {
        badge: 'bg-[#FEE2E2] text-[#DC2626]',
        dot: 'bg-red-500',
      },
    };

    const style = styles[String(status)] ?? {
      badge: 'bg-gray-100 text-gray-600',
      dot: 'bg-gray-400',
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[12px] font-semibold ${style.badge}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
        {status}
      </span>
    );
  };

  const getAgentInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  };

  const getAgentColor = (name: string) => {
    const colors = [
      'bg-indigo-700',
      'bg-teal-600',
      'bg-orange-600',
      'bg-violet-600',
    ];

    const hash = name
      .split('')
      .reduce((total, char) => total + char.charCodeAt(0), 0);

    return colors[hash % colors.length];
  };

  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-[#0F1733]">
            Recent Transactions
          </h3>

          <p className="mt-1 text-[12px] text-[#6B7494]">
            Latest activity across your agents
          </p>
        </div>

        <Link
          to={viewAllLink}
          onClick={onRefresh}
          className="shrink-0 text-[13px] font-semibold text-[#1B2566] transition-colors hover:text-blue-700"
        >
          View all →
        </Link>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed border-collapse">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[25%]" />
            <col className="w-[20%]" />
            <col className="w-[13%]" />
            <col className="w-[18%]" />
          </colgroup>

          <thead className="bg-[#F4F6FB]">
            <tr>
              {[
                'Transaction',
                'Agent',
                'Date',
                'Status',
                'Amount',
              ].map((heading, index) => (
                <th
                  key={heading}
                  className={`whitespace-nowrap px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#6B7494] ${index === 4 ? 'text-right' : 'text-left'
                    }`}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {transactions.length > 0 ? (
              transactions.map((transaction) => {
                const agentName =
                  typeof transaction.agentName === 'string' && transaction.agentName.trim()
                    ? transaction.agentName
                    : 'Unknown Agent';

                const agentEmail =
                  typeof transaction.agentEmail === 'string'
                    ? transaction.agentEmail
                    : typeof transaction.customer === 'string'
                      ? transaction.customer
                      : 'Unknown Sender';

                return (
                  <tr
                    key={String(transaction.id)}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    {/* Transaction ID */}
                    <td className="px-5 py-5">
                      <span className="whitespace-nowrap font-mono text-[12px] font-medium text-[#2A3352]">
                        {String(transaction.id)}
                      </span>
                    </td>

                    {/* Agent */}
                    <td className="py-4 pl-6 pr-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-[10px] font-semibold text-white ${getAgentColor(agentName)}`}
                        >
                          {getAgentInitials(agentName)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-[#0F1733]">
                            {agentName}
                          </p>

                          <p className="mt-1 truncate text-[10px] text-slate-500">
                            {agentEmail}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-5">
                      <span className="whitespace-nowrap text-[13px] text-[#6B7494]">
                        {transaction.date}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-5">
                      {getStatusBadge(transaction.status)}
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-5 text-right">
                      <span
                        className={`whitespace-nowrap text-[14px] font-bold ${String(transaction.status) === 'Failed'
                          ? 'text-[#6B7494]'
                          : 'text-[#0F1733]'
                          }`}
                      >
                        {String(transaction.status) === 'Completed' ||
                          String(transaction.status) === 'Pending'
                          ? '+'
                          : ''}
                        ₦{Number(transaction.amount).toLocaleString('en-NG')}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm text-slate-500"
                >
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default StoreTransactionTable;
