import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; 
import LoginPage from './pages/Public Pages/LoginPage.js';
import SchoolsPage from './pages/School/SchoolDashboard';
import SignUpPage from './pages/Public Pages/SignUpPage.js';
import StudentPage from './pages/School/StudentPage';
import { StorePage } from './pages/School/StorePage.js';
import SettingsPage from './pages/School/SettingsPage.js';
import ParentDashboard from './pages/Parent/ParentDashboard.js';
import FundWalletPage from './pages/Parent/FundWalletPage.js';
import PaystackCallback from './pages/Public Pages/PaystackCallback.js';
import PTransactionHistoryPage from './pages/Parent/PTransactionHistoryPage.js';
import PsettingsPage from './pages/Parent/PsettingsPage.js';
import TransferToKidsPage from './pages/Parent/TransferToKidsPage';
import PaySchoolBillsPage from './pages/Parent/PaySchoolBillsPage.js';
import PayToAgentPage from './pages/Parent/PayToAgentPage.js';
import SchoolFeesModule from './pages/School/SchoolFeesModule.js';
import TransactionModule from './pages/School/TransactionModule.js';
import WithdrawalPage from './pages/School/WithdrawalPage.js';
import KidsDashboard from './pages/Student/KidsDashboard.js';
import KidsSettingsPage from './pages/Student/KidsSettingsPage.js';
import KidPayAgentPage from './pages/Student/KidPayAgentPage.js';
import KidPaymentHistoryPage from './pages/Student/KidPaymentHistoryPage.js';
import SchoolSignUpPage from './pages/Public Pages/SchoolSignupPage.js';
import StudentRegistrationForm from './pages/Public Pages/StudentRegistrationForm.js';
import SchoolBillsPage from './pages/Student/SchoolBillsPage.js';
import StoreRegistrationForm from './pages/Public Pages/StoreRegistrationForm.js';
import StoreDashboard from './pages/Store/StoreDashboard.js';
import AgentDashboard from './pages/Agent/AgentDashboard.js';
import AgentScanQR from './pages/Agent/AgentScanOR.js';
import AgentTransferToStore from './pages/Agent/AgentTransferToStore.js';
import AgentTransactionHistory from './pages/Agent/AgentTransactionHistory.js';
import ManageAgentsPage from './pages/Store/ManageAgentsPage.js';
import STransactionHistoryPage from './pages/Store/STransactionHistoryPage.js';
import SWithdrawalPage from './pages/Store/SWithdrawalPage.js';
import StoreSettingsPage from './pages/Store/StoreSettingsPage.js';
import EditStudentDetails from './pages/School/EditStudentDetails.js';
import EditStoreDetails from './pages/Store/EditStoreDetails.js';
import ViewStudentTransactions from './pages/School/ViewStudentTransactions.js';
import Pdispute from './pages/Parent/Pdispute.js'; 
import Kdispute from './pages/Student/Kdispute.js'; 
import DisputePage from './pages/School/Sdiputes.js';
import Storedispute from './pages/Store/Storedispute.js';
import Terms from './pages/Public Pages/TermsAndConditions.js';
import Overview from './pages/Admin/overview';
import AllUsers from './pages/Admin/AllUsers';
import SchoolTransferPage from './pages/School/schooltransfer.js';

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

          {/* Registration Pages */}
          <Route path="/signup" element={<SignUpPage />} />
          <Route path='/schoolsignup' element={<SchoolSignUpPage />} />
          <Route path="/students/new" element={<StudentRegistrationForm />} />
          <Route path="/stores/new" element={<StoreRegistrationForm />} />


          {/* School dashboard */}
          <Route path="/schools" element={<SchoolsPage />} />
          <Route path="/students" element={<StudentPage />} />
          <Route path="/stores" element={<StorePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/schoolfees" element={<SchoolFeesModule />} />
          <Route path="/schooltransfer" element={<SchoolTransferPage />} />
          <Route path='/transactions' element={<TransactionModule />} />
          <Route path="/withdrawal" element={<WithdrawalPage />} />
          <Route path="/students/edit/:_id" element={<EditStudentDetails />} />
          <Route path="/students/transactions/:_id" element={<ViewStudentTransactions />} />
          <Route path="/Sdisputes" element={<DisputePage />} />


          {/* Parent dashboard */}
          <Route path="/parent" element={<ParentDashboard />} />
          <Route path="/fundwallet" element={<FundWalletPage />} />
          <Route path="/ptransactionhistory" element={<PTransactionHistoryPage />} />
          <Route path="/psettings" element={<PsettingsPage />} />
          <Route path="/transfertokids" element={<TransferToKidsPage />} />
          <Route path="/payschoolbills" element={<PaySchoolBillsPage />} />
          <Route path="/paytoagent" element={<PayToAgentPage />} />
          <Route path="/pdispute" element={<Pdispute />} />


          

          {/* Kids dashboard */}
          <Route path="/kidswallet" element={<KidsDashboard/>} />
          <Route path="/ksettings" element={<KidsSettingsPage />} />
          <Route path="/kidpayagent" element={<KidPayAgentPage />} />
          <Route path="/kidpaymenthistory" element={<KidPaymentHistoryPage />} />
          <Route path="/schoolbills" element={<SchoolBillsPage />} />
          <Route path="/kdispute" element={<Kdispute />} />
          

          {/* Store dashboard */}
          <Route path="/store" element={<StoreDashboard />} />
          <Route path="/agents" element={<ManageAgentsPage />} />
          <Route path="/stransactions" element={<STransactionHistoryPage />} />
          <Route path='/swithdrawal' element={<SWithdrawalPage />} />
          <Route path="/store/settings" element={<StoreSettingsPage />} />
          <Route path="/stores/edit/:id" element={<EditStoreDetails />} />
          <Route path="/Storedispute" element={<Storedispute />} />



          {/* Agent dashboard */}
          <Route path="/agent" element={<AgentDashboard />} />
          <Route path="/agent/scanqr" element={<AgentScanQR />} />
          <Route path="/agent/transfertostore" element={<AgentTransferToStore />} />
          <Route path="/agent/transactions" element={<AgentTransactionHistory />} />
          

          {/* admin routes */}
          <Route path="/admin" element={<Overview />} />
          <Route path="/admin/management/all-users" element={<AllUsers />} />

        
          {/* Paystack Page */}
          <Route path="/payment/callback" element={<PaystackCallback />} />


        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;