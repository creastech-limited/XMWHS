// src/components/store/StoreStatCards.tsx
import React from 'react';
import { FaWallet } from 'react-icons/fa';
import { TrendingUp, DollarSign, Users } from 'lucide-react';
import type { DashboardData } from '../../types/store';

interface StoreStatCardsProps {
  data: DashboardData;
}

const StoreStatCards: React.FC<StoreStatCardsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {/* Wallet Balance */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm font-medium">Wallet Balance</p>
            <p className="text-3xl font-bold mt-2">
              ₦{data.balance.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/20 p-3 rounded-lg">
            <FaWallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Daily Revenue */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-sm font-medium">Daily Revenue</p>
            <p className="text-3xl font-bold mt-2">
              ₦{data.dailyRevenue.toLocaleString()}
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span className="text-sm">+{data.growth.revenue}%</span>
            </div>
          </div>
          <div className="bg-white/20 p-3 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Number of Agents */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">Number of Agents</p>
            <p className="text-3xl font-bold mt-2">{data.numberOfAgents}</p>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span className="text-sm">+{data.growth.agents}%</span>
            </div>
          </div>
          <div className="bg-white/20 p-3 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreStatCards;