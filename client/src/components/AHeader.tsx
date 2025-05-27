import React, { useState, useEffect } from 'react';
import {
  WalletIcon,
  Bell
} from 'lucide-react';

interface AgentData {
  name: string;
  walletBalance: number;
}

const AHeader = () => {
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 640);
  
  
  
  useEffect(() => {
    setTimeout(() => {
      setAgentData({
        name: "Agent Alpha",
        walletBalance: 250000,
      });

      setIsMobile(window.innerWidth < 640);
    }, 1000);
  }, []);

  const colors = {
    primary: '#3f51b5',
    secondary: '#f50057',
    success: '#4caf50',
    warning: '#ff9800',
    info: '#2196f3',
    background: '#f8faff',
    headerGradient: 'linear-gradient(120deg, #2c3e50 0%, #3f51b5 100%)',
  };


  return (
    <div className="flex m-2 flex-col bg-[#f8faff]">
      <div 
        className="text-white p-4 sm:p-6 flex justify-between items-center"
        style={{ background: colors.headerGradient }}
      >
        <div className="flex items-center gap-4">
          <WalletIcon className={`text-white ${isMobile ? 'text-3xl' : 'text-4xl'}`} />
          <div className="flex flex-col align-center justify-center">
            <h1 className={isMobile ? "text-xl font-bold leading-tight" : "text-2xl font-bold leading-tight"}>
              <span style={{ fontSize: isMobile ? '1.25rem' : '2.5rem' }}>{agentData?.name}</span>
            </h1>
            <p className="opacity-90 text-sm">Agent Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <h2 className={isMobile ? "text-lg font-bold" : "text-xl font-bold"}>
              ₦{agentData?.walletBalance.toLocaleString()}
            </h2>
            <p className="opacity-80 text-xs">Wallet Balance</p>
          </div>
          <button 
            className="text-white p-2 rounded-full hover:text-blue-600 hover:bg-blue-600 hover:bg-opacity-10"
            aria-label="notifications"
          >
            <Bell style={{ color: 'white' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
export default AHeader;