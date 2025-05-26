import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SchoolsPage from './pages/SchoolDashboard';
import SignUpPage from './pages/SignUpPage';
import StudentPage from './pages/StudentPage';
import { StorePage } from './pages/StorePage';
import SettingsPage from './pages/SettingsPage';
import ParentDashboard from './pages/ParentDashboard';
import FundWalletPage from './pages/FundWalletPage';
import PaystackCallback from './pages/PaystackCallback.jsx';
import PTransactionHistoryPage from './pages/PTransactionHistoryPage';
import PsettingsPage from './pages/PsettingsPage';
import TransferToKidsPage from './pages/TransferToKidsPage';
import PaySchoolBillsPage from './pages/PaySchoolBillsPage';
import PayToAgentPage from './pages/PayToAgentPage';
import SchoolFeesModule from './pages/SchoolFeesModule';
import TransactionModule from './pages/TransactionModule';
import WithdrawalPage from './pages/WithdrawalPage';
import KidsDashboard from './pages/KidsDashboard';
import KidsSettingsPage from './pages/KidsSettingsPage';
import KidPayAgentPage from './pages/KidPayAgentPage';
import KidPaymentHistoryPage from './pages/KidPaymentHistoryPage';
import SchoolSignUpPage from './pages/SchoolSignupPage';
import StudentRegistrationForm from './pages/StudentRegistrationForm';
import SchoolBillsPage from './pages/SchoolBillsPage';
import StoreRegistrationForm from './pages/StoreRegistrationForm';
import AgentDashboard from './pages/AgentDashboard';
import AgentScanQR from './pages/AgentScanOR.js';
import AgentTransferToStore from './pages/AgentTransferToStore.js';
import AgentTransactionHistory from './pages/AgentTransactionHistory.js';


function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* School dashboard */}
        <Route path="/schools" element={<SchoolsPage />} />
        <Route path="/signup" element={<SignUpPage />} />
         <Route path="/students" element={<StudentPage />} />
        <Route path="/stores" element={<StorePage />} />
         <Route path="/settings" element={< SettingsPage />} />
         <Route path="/parent" element={<ParentDashboard />} />
         <Route path="/fundwallet" element={<FundWalletPage />} />
         <Route path="/payment/callback" element={<PaystackCallback />} />
         <Route path="/ptransactionhistory" element={<PTransactionHistoryPage />} />
         <Route path="/psettings" element={<PsettingsPage />} />
        <Route path="/transfertokids" element={<TransferToKidsPage />} />
        <Route path="/payschoolbills" element={<PaySchoolBillsPage />} />
        <Route path="/paytoagent" element={<PayToAgentPage />} />
         <Route path="/schoolfees" element={<SchoolFeesModule />} />
          <Route path='/transactions' element={<TransactionModule />} />
        <Route path="/withdrawal" element={<WithdrawalPage />} />
         <Route path="/kidswallet" element={<KidsDashboard/>} />
         <Route path="/ksettings" element={<KidsSettingsPage />} />
        <Route path="/kidpayagent" element={<KidPayAgentPage />} />
        <Route path="/kidpaymenthistory" element={<KidPaymentHistoryPage />} />
          <Route path='/schoolsignup' element={<SchoolSignUpPage />} />
            <Route path="/students/new" element={<StudentRegistrationForm />} />
         <Route path="/schoolbills" element={<SchoolBillsPage />} />
         <Route path="/stores/new" element={<StoreRegistrationForm />} />
         <Route path="/agent" element={<AgentDashboard />} />
         <Route path="/agent/scanqr" element={<AgentScanQR />} />
         <Route path="/agent/transfertostore" element={<AgentTransferToStore />} />
          <Route path="/agent/transactions" element={<AgentTransactionHistory />} />


      </Routes>
    </Router>
  );
}

export default App;
