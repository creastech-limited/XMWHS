import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; 
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
import StoreDashboard from './pages/StoreDashboard';
import AgentDashboard from './pages/AgentDashboard';
import AgentScanQR from './pages/AgentScanOR';
import AgentTransferToStore from './pages/AgentTransferToStore';
import AgentTransactionHistory from './pages/AgentTransactionHistory';
import ManageAgentsPage from './pages/ManageAgentsPage';
import STransactionHistoryPage from './pages/STransactionHistoryPage';
import SWithdrawalPage from './pages/SWithdrawalPage';
import StoreSettingsPage from './pages/StoreSettingsPage.js';
import EditStudentDetails from './pages/EditStudentDetails';
import EditStoreDetails from './pages/EditStoreDetails';
import ViewStudentTransactions from './pages/ViewStudentTransactions';
import Pdispute from './pages/Pdispute'; 
import Kdispute from './pages/Kdispute'; 
import DisputePage from './pages/Sdiputes';
import Storedispute from './pages/Storedispute';
import Terms from './pages/TermsAndConditions';
import Overview from './pages/Admin/overview.js';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Login page */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/terms" element={<Terms />} />

          {/* School dashboard */}
          <Route path="/schools" element={<SchoolsPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/students" element={<StudentPage />} />
          <Route path="/stores" element={<StorePage />} />
          <Route path="/settings" element={<SettingsPage />} />
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
          <Route path="/store" element={<StoreDashboard />} />
          <Route path="/agent" element={<AgentDashboard />} />
          <Route
            path="/agent/scanqr"
            element={
              <AgentScanQR />
            }
          />
          <Route path="/agent/transfertostore" element={<AgentTransferToStore />} />
          <Route path="/agent/transactions" element={<AgentTransactionHistory />} />
          <Route path="/agents" element={<ManageAgentsPage />} />
          <Route path="/stransactions" element={<STransactionHistoryPage />} />
          <Route path='/swithdrawal' element={<SWithdrawalPage />} />
          <Route path="/store/settings" element={<StoreSettingsPage />} />
          <Route path="/students/edit/:_id" element={<EditStudentDetails />} />
          <Route path="/students/transactions/:_id" element={<ViewStudentTransactions />} />
          <Route path="/stores/edit/:id" element={<EditStoreDetails />} />
          <Route path="/pdispute" element={<Pdispute />} />
          <Route path="/kdispute" element={<Kdispute />} />
          <Route path="/Sdisputes" element={<DisputePage />} />
          <Route path="/Storedispute" element={<Storedispute />} />

          //admin routes
          <Route path="/admin" element={<Overview />} />

        
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;