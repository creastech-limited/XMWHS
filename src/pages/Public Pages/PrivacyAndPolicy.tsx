import { useState } from 'react';
import { ChevronDown, ChevronRight, Shield, CreditCard, Users, AlertCircle, FileText, Lock, Globe, Eye } from 'lucide-react';
import Footer from '../../components/Footer';
import Logo from '../5.png';

const PrivacyAndPolicy = () => {
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
      id: 'collection',
      title: '1. Information We Collect',
      icon: <FileText className="w-5 h-5" />,
      content: `1.1 Personal Information: We collect your full name, date of birth, email, phone number, physical address, and government-issued ID for verification.

1.2 Financial Information: We collect bank account details, card information, transaction history, wallet balances, and recipient details to enable services.

1.3 Device and Usage: We automatically track device types, unique identifiers, IP addresses, geographic location, and app usage patterns.`
    },
    {
      id: 'usage',
      title: '2. How We Use Your Information',
      icon: <Eye className="w-5 h-5" />,
      content: `We use your data to:
- Create and manage your XPay account.
- Process transactions, transfers, and payments.
- Verify identity and prevent fraud or unauthorized access.
- Comply with legal obligations and regulatory requirements.
- Provide customer support and improve user experience.
- Send security alerts and promotional communications.`
    },
    {
      id: 'sharing',
      title: '3. How We Share Your Information',
      icon: <Users className="w-5 h-5" />,
      content: `We do not sell your personal information. We share data only with:
- Service Providers: Trusted partners (payment processors, banking partners, cloud storage) obligated to protect your data.
- Legal Compliance: When required by law, court orders, or anti-money laundering regulations.
- Business Transfers: In the event of a merger or sale of assets.
- Consent: When you explicitly authorize sharing with a merchant or third-party app.`
    },
    {
      id: 'security',
      title: '4. Data Security',
      icon: <Lock className="w-5 h-5" />,
      content: `We implement industry-standard measures including:
- End-to-end encryption and SSL technology.
- Multi-factor authentication and biometric security.
- Regular security audits and restricted internal access.
While we strive for absolute security, no method of transmission is 100% secure.`
    },
    {
      id: 'rights',
      title: '5. Your Privacy Rights',
      icon: <Shield className="w-5 h-5" />,
      content: `Depending on your location, you may:
- Access a copy of your personal information.
- Correct inaccurate data in your account settings.
- Request data portability or object to certain processing.
- Opt-out of marketing communications at any time.
Contact privacy@xpay.ng to exercise these rights; we respond within 30 days.`
    },
    {
      id: 'international',
      title: '6. Data Retention & International Transfers',
      icon: <Globe className="w-5 h-5" />,
      content: `Data Retention: We keep your information as long as necessary to provide services and comply with legal duties.

International Transfers: XPay operates in Nigeria. Your information may be processed in Nigeria, which may have different data laws than your residence. We ensure appropriate safeguards are in place.`
    },
    {
      id: 'children',
      title: "7. Children's Privacy",
      icon: <AlertCircle className="w-5 h-5" />,
      content: `XPay is not intended for individuals under the age of 18. We do not knowingly collect children's data. If we discover we have inadvertently collected info from a child under 18, we will delete it as soon as possible.`
    },
    {
      id: 'cookies',
      title: '8. Cookies & Third-Party Links',
      icon: <CreditCard className="w-5 h-5" />,
      content: `Cookies: We use essential, analytics, and preference cookies to improve your experience. You can control these in your device settings.

Third-Party Links: We are not responsible for the privacy practices of external websites linked within XPay.`
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <img src={Logo} alt="XPay Logo" className="w-16 sm:w-30 mb-2 sm:mb-0 sm:mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">XPAY PRIVACY POLICY</h1>
              <p className="text-sm text-gray-600">Protecting your personal and financial information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Welcome to XPay</h2>
              <p className="text-blue-800 leading-relaxed">
                By using XPay, you agree to the terms of this Privacy Policy. This document explains how we collect, use, and protect your information.
              </p>
              <p className="text-blue-800 mt-2 text-sm">
                <strong>Effective Date:</strong> February 16, 2026
              </p>
            </div>
          </div>
        </div>

        {/* Accordion Sections */}
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="border border-gray-200 rounded-lg bg-white">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-blue-600">{section.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                </div>
                {expandedSections[section.id] ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
              </button>

              {expandedSections[section.id] && (
                <div className="px-4 pb-4">
                  <div className="pl-8 border-l-2 border-blue-200">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Us</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-900 mb-2">Privacy & Support</p>
              <p>Privacy Email: privacy@xpay.ng</p>
              <p>Support Email: support@xpay.ng</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-2">Mailing Address</p>
              <p>XPay Privacy Team</p>
              <p>16A Oguntona Crescent</p>
              <p>Gbagada, Lagos, 100234, Nigeria</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p className="bg-gray-100 py-4 px-2 rounded mb-4">
            By using XPay, you acknowledge that you have read and understood this Privacy Policy.
          </p>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default PrivacyAndPolicy;