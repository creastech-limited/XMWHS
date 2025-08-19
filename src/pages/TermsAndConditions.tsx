import { useState } from 'react';
import { ChevronDown, ChevronRight, Calendar, Shield, CreditCard, Users, AlertCircle, FileText } from 'lucide-react';
import Footer from '../components/Footer';
import  Logo  from './5.png';

const TermsAndConditions = () => {

  interface ExpandedSections {
    [key: string]: boolean;
  }


  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev: ExpandedSections) => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const sections = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      icon: <FileText className="w-5 h-5" />,
      content: `By accessing and using the School Wallet application ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service. The School Wallet is designed specifically for educational institutions and their communities, including students, parents, teachers, and administrative staff.

These terms apply to all users of the Service, regardless of whether you are a student, parent, guardian, teacher, administrator, or other authorized user. By creating an account or using any feature of the Service, you acknowledge that you have read, understood, and agree to be legally bound by these terms.`
    },
    {
      id: 'definitions',
      title: '2. Definitions',
      icon: <Users className="w-5 h-5" />,
      content: `For the purposes of these Terms and Conditions:

"School Wallet" or "Service" refers to the digital wallet application and related services provided for school communities.

"User" means any individual who accesses or uses the Service, including but not limited to students, parents, guardians, teachers, and school administrators.

"School Account" refers to institutional accounts created by educational institutions to manage their community's access to the Service.

"Digital Wallet" means the electronic system that stores, manages, and facilitates transactions of digital value within the school ecosystem.

"Educational Institution" or "School" refers to any accredited educational organization that has partnered with School Wallet to provide services to their community.

"Parent/Guardian" refers to the legal guardian or parent of a minor student using the Service.

"Transaction" means any transfer of digital value, payment, or financial activity conducted through the Service.`
    },
    {
      id: 'eligibility',
      title: '3. User Eligibility and Account Requirements',
      icon: <Shield className="w-5 h-5" />,
      content: `Age Requirements:
- Students under 13 years of age may only use the Service with explicit parental consent and supervision
- Students aged 13-17 may use the Service with parental knowledge and consent
- Adult users (18+) may create and manage their own accounts independently

Account Creation:
- All users must provide accurate, current, and complete information during registration
- Each user may maintain only one active account
- Schools must verify the identity of all users within their community
- Parents/guardians must verify and approve minor accounts

Account Security:
- Users are responsible for maintaining the confidentiality of their login credentials
- Users must immediately notify us of any unauthorized access or security breaches
- Sharing account credentials is strictly prohibited
- Strong passwords and two-factor authentication are required for all accounts`
    },
    {
      id: 'services',
      title: '4. Service Description and Functionality',
      icon: <CreditCard className="w-5 h-5" />,
      content: `School Wallet provides the following core services:

Payment Processing:
- Cafeteria meal payments and lunch account management
- School fee payments (tuition, activities, supplies)
- Field trip and event payment processing
- Fundraising and donation collection

Account Management:
- Real-time balance tracking and transaction history
- Automated low-balance notifications
- Spending limits and parental controls
- Budget tracking and financial literacy tools

Educational Features:
- Financial literacy modules and educational content
- Spending analytics and reporting
- Goal-setting and savings features
- Integration with school financial systems

Communication Tools:
- Payment reminders and notifications
- Transaction confirmations and receipts
- Account statements and reports
- Direct communication with school financial offices`
    },
    {
      id: 'financial',
      title: '5. Financial Terms and Payment Processing',
      icon: <CreditCard className="w-5 h-5" />,
      content: `Payment Methods:
- Credit and debit cards (Visa, MasterCard, American Express)
- Bank transfers and ACH payments
- Digital payment platforms (Apple Pay, Google Pay)
- Cash deposits through authorized school locations

Transaction Fees:
- Standard processing fees may apply to certain transactions
- Fee schedules are available in your account dashboard
- Schools may choose to absorb processing fees for their community
- No fees for account maintenance or basic features

Refund Policy:
- Unused funds may be refunded upon account closure
- Refund requests must be submitted through official school channels
- Processing time for refunds is 5-10 business days
- Certain transactions may be non-refundable as specified

Account Limits:
- Daily, weekly, and monthly spending limits may be imposed
- Parents can set additional restrictions for minor accounts
- Maximum account balances may be limited for security purposes
- Transaction limits help prevent fraud and unauthorized use`
    },
    {
      id: 'privacy',
      title: '6. Privacy and Data Protection',
      icon: <Shield className="w-5 h-5" />,
      content: `Data Collection:
- We collect only necessary information to provide our services
- Personal information includes names, contact details, and payment information
- Transaction data is collected to maintain accurate records
- Usage analytics help improve service quality and security

Data Protection:
- All data is encrypted in transit and at rest
- We comply with FERPA, COPPA, and other applicable privacy laws
- Regular security audits and penetration testing are conducted
- Data access is limited to authorized personnel only

Data Sharing:
- Information is shared only with your educational institution
- Third-party service providers are bound by strict confidentiality agreements
- We never sell or rent personal information to third parties
- Parents have full access to their minor children's account data

Data Retention:
- Account data is retained while the account remains active
- Inactive accounts are archived after 12 months of inactivity
- Data deletion requests are processed within 30 days
- Legal requirements may necessitate longer retention periods`
    },
    {
      id: 'security',
      title: '7. Security and Fraud Protection',
      icon: <AlertCircle className="w-5 h-5" />,
      content: `Security Measures:
- Multi-factor authentication for all accounts
- Real-time transaction monitoring and fraud detection
- Secure encryption protocols (AES-256, TLS 1.3)
- Regular security updates and patches

User Responsibilities:
- Keep login credentials secure and confidential
- Report suspicious activity immediately
- Review account statements regularly
- Update contact information promptly

Fraud Prevention:
- Automated systems monitor for unusual activity patterns
- Immediate account suspension for suspected fraud
- Zero-liability protection for verified unauthorized transactions
- Comprehensive investigation process for all fraud reports

Incident Response:
- 24/7 security monitoring and response team
- Immediate notification of security breaches
- Coordinated response with law enforcement when necessary
- Transparent communication about security incidents`
    },
    {
      id: 'conduct',
      title: '8. User Conduct and Prohibited Activities',
      icon: <AlertCircle className="w-5 h-5" />,
      content: `Acceptable Use:
- Use the Service only for legitimate school-related transactions
- Respect other users and maintain appropriate conduct
- Follow all school policies and guidelines
- Maintain accurate account information

Prohibited Activities:
- Using the Service for illegal or unauthorized purposes
- Attempting to circumvent security measures or access controls
- Sharing account credentials with unauthorized individuals
- Making fraudulent transactions or providing false information
- Using the Service to harass, threaten, or harm others
- Attempting to hack, disrupt, or damage the Service

Consequences:
- Violation of these terms may result in account suspension or termination
- Schools may impose additional disciplinary measures
- Legal action may be taken for serious violations
- Refund of account balances is at our discretion for terminated accounts`
    },
    {
      id: 'liability',
      title: '9. Limitation of Liability and Disclaimers',
      icon: <Shield className="w-5 h-5" />,
      content: `Service Availability:
- We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service
- Scheduled maintenance windows will be announced in advance
- Emergency maintenance may occur with minimal notice
- Service disruptions do not entitle users to refunds or compensation

Disclaimer of Warranties:
- The Service is provided "as is" without warranties of any kind
- We do not warrant that the Service will be error-free or uninterrupted
- No warranty regarding the accuracy or completeness of content
- Third-party services integrated with our platform have their own terms

Limitation of Liability:
- Our liability is limited to the amount of funds in your account
- We are not liable for indirect, incidental, or consequential damages
- Force majeure events (natural disasters, government actions) may affect service
- Users assume responsibility for their own financial decisions and transactions`
    },
    {
      id: 'termination',
      title: '10. Account Termination and Service Discontinuation',
      icon: <FileText className="w-5 h-5" />,
      content: `User-Initiated Termination:
- Users may close their accounts at any time through the application
- Account closure requires confirmation from parents for minor accounts
- Remaining account balances will be refunded according to our refund policy
- All user data will be deleted or anonymized upon account closure

Service-Initiated Termination:
- We reserve the right to terminate accounts for violations of these terms
- Suspected fraudulent activity may result in immediate account suspension
- Schools may request account termination for students who leave the institution
- 30 days notice will be provided for non-disciplinary account terminations

Service Discontinuation:
- We reserve the right to discontinue the Service with 90 days notice
- User funds will be returned through the original payment method
- Account data will be made available for download before service termination
- Alternative solutions will be recommended when possible`
    },
    {
      id: 'modifications',
      title: '11. Modifications to Terms and Services',
      icon: <Calendar className="w-5 h-5" />,
      content: `Terms Updates:
- These terms may be updated periodically to reflect changes in our services
- Material changes will be communicated via email and in-app notifications
- Continued use of the Service constitutes acceptance of updated terms
- Users who disagree with changes may terminate their accounts

Service Changes:
- We may modify, enhance, or discontinue features with reasonable notice
- New features may be subject to additional terms and conditions
- Beta features are provided without warranties and may be unstable
- User feedback is encouraged and helps guide service improvements

Communication:
- Important notices will be sent to your registered email address
- In-app notifications will alert you to significant changes
- Users are responsible for maintaining current contact information
- Check our website regularly for the most current terms and policies`
    },
    {
      id: 'legal',
      title: '12. Legal and Governing Law',
      icon: <FileText className="w-5 h-5" />,
      content: `Governing Law:
- These terms are governed by the laws of the jurisdiction where the Service is provided
- Any disputes will be resolved through binding arbitration
- Users waive the right to participate in class action lawsuits
- Local laws may provide additional consumer protections

Compliance:
- We comply with all applicable federal, state, and local laws
- Educational privacy laws (FERPA, COPPA) are strictly followed
- Financial regulations and anti-money laundering laws are observed
- Regular legal reviews ensure ongoing compliance

Dispute Resolution:
- Initial disputes should be addressed through customer support
- Mediation services are available for unresolved issues
- Arbitration proceedings will be conducted by qualified arbitrators
- Legal action may only be taken after exhausting alternative dispute resolution

Contact Information:
- Legal notices should be sent to our registered business address
- Customer support is available through multiple channels
- Emergency contact information is provided for urgent issues
- Response times vary based on the nature and urgency of inquiries`
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
             <img
        src={Logo}
        alt="Logo"
        className="w-16 sm:w-30 mb-2 sm:mb-0 sm:mr-3"
      />
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Terms and Conditions</h1>
              <p className="text-sm text-gray-600 text-center">Please read carefully</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Introduction */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Important Notice</h2>
              <p className="text-blue-800 leading-relaxed">
                These Terms and Conditions govern your use of the School Wallet application. 
                Please read them carefully before using our services. By creating an account or 
                using any feature of School Wallet, you agree to be bound by these terms.
              </p>
              <p className="text-blue-800 mt-2 text-sm">
                <strong>Last Updated:</strong> August 13, 2025
              </p>
            </div>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="border border-gray-200 rounded-lg bg-white">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-blue-600">
                    {section.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {section.title}
                  </h3>
                </div>
                {expandedSections[section.id] ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {expandedSections[section.id] && (
                <div className="px-4 pb-4">
                  <div className="pl-8 border-l-2 border-blue-200">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Information */}
        <div className="mt-12 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-900 mb-2">Customer Support</p>
              <p>Email: itsupport@creastech.com</p>
              <p>Phone: +234 708 475 5837</p>
              <p>Hours: Monday - Friday, 8:00 AM - 6:00 PM</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-2">Legal Department</p>
              <p>Email: itsupport@creastech.com</p>
              <p>Address: 16A Oguntuna </p>
              <p> Crescent Gbagada Phase 1 Lagos.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p className='bg-gray-100 pt-10 pb-0'>By using School Wallet, you acknowledge that you have read and agree to these Terms and Conditions.</p>
          <Footer />
            
          
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;