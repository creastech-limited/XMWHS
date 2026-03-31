import Logo from '/xpay.jpeg';
import Footer from '../../components/Footer';

type PolicySection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

const policySections: PolicySection[] = [
  {
    title: '1. Information We Collect',
  },
  {
    title: '1.1 Personal Information',
    paragraphs: [
      'When you create an XPay account, we collect the following personal information:',
    ],
    bullets: [
      'Full name',
      'Email address and phone number',
      'Address',
      'Profile photo (optional)',
    ],
  },
  {
    title: '1.2 Device and Usage Information',
    paragraphs: [
      'We automatically collect information about your device and how you use XPay:',
    ],
    bullets: [
      'Device type, operating system, and unique device identifiers',
      'IP address and geographic location data',
      'App usage patterns, features accessed, and time spent in the app',
      'Login times and authentication methods used',
      'Crash reports and diagnostic data',
    ],
  },
  {
    title: '1.3 Communication Data',
    paragraphs: [
      'If you contact our customer support team, we collect the content of your communications, including messages, emails, and call recordings for quality assurance and training purposes.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    paragraphs: [
      'We use the information we collect for the following purposes:',
    ],
    bullets: [
      'To create and manage your XPay account',
      'To process transactions, transfers, and payments',
      'To verify your identity and prevent fraud or unauthorized access',
      'To comply with legal obligations and regulatory requirements',
      'To provide customer support and respond to your inquiries',
      'To improve our services, develop new features, and enhance user experience',
      'To send you important updates, security alerts, and promotional communications',
      'To detect and prevent security incidents, fraud, and illegal activity',
      'To analyze usage trends and conduct research',
    ],
  },
  {
    title: '3. How We Share Your Information',
    paragraphs: [
      'We do not sell your personal information to third parties. However, we may share your information in the following circumstances:',
    ],
  },
  {
    title: '3.1 Service Providers',
    paragraphs: [
      'We work with trusted third-party service providers who help us operate XPay, including payment processors, banking partners, identity verification services, cloud storage providers, and analytics platforms. These providers are contractually obligated to protect your information and use it only for the services they provide to us.',
    ],
  },
  {
    title: '3.2 Legal Compliance',
    paragraphs: [
      'We may disclose your information when required by law, such as in response to court orders, subpoenas, government investigations, or to comply with financial regulations and anti-money laundering laws.',
    ],
  },
  {
    title: '3.3 With Your Consent',
    paragraphs: [
      'We may share your information with other parties when you give us explicit consent to do so, such as when you authorize a transaction with a specific merchant or connect XPay with third-party apps.',
    ],
  },
  {
    title: '4. Data Security',
    paragraphs: [
      'We take the security of your information seriously and implement industry-standard security measures to protect it, including:',
      'While we strive to protect your information, no method of transmission or storage is completely secure. We cannot guarantee absolute security, but we continuously work to improve our security practices.',
    ],
    bullets: [
      'End-to-end encryption for sensitive data transmission',
      'Secure socket layer (SSL) technology for all communications',
      'Multi-factor authentication and biometric security options',
      'Regular security audits and vulnerability assessments',
      'Restricted access to personal information by authorized personnel only',
      'Secure data centers with physical and electronic safeguards',
    ],
  },
  {
    title: '5. Your Privacy Rights',
    paragraphs: [
      'Depending on your location, you may have certain rights regarding your personal information:',
      'To exercise these rights, please contact us at privacy@xpay.ng. We will respond to your request within 30 days. Please note that we may need to retain certain information for legal or operational purposes.',
    ],
    bullets: [
      'Access: You can request a copy of the personal information we hold about you',
      'Correction: You can update or correct inaccurate information in your account settings',
      'Portability: You can request your data in a portable format',
      'Opt-out: You can opt out of marketing communications at any time',
      'Object: You can object to certain processing of your information',
    ],
  },
  {
    title: '6. Data Retention',
    paragraphs: [
      'We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreement.',
    ],
  },
  {
    title: '7. International Data Transfers',
    paragraphs: [
      'XPay operates currently in Nigeria, and your information may be transferred to and processed within Nigeria other than your country of residence. These countries may have different data protection laws than your country. When we transfer your information internationally, we ensure appropriate safeguards are in place, such as standard contractual clauses or adequacy decisions, to protect your information in accordance with this Privacy Policy.',
    ],
  },
  {
    title: '8. Cookies and Tracking Technologies',
    paragraphs: [
      'XPay uses cookies and similar tracking technologies to improve your experience, analyze usage patterns, and deliver personalized content. Cookies are small data files stored on your device. You can control cookie preferences through your device settings, but disabling cookies may limit your ability to use certain features of XPay.',
      'We use the following types of cookies:',
    ],
    bullets: [
      'Essential cookies: Necessary for the app to function properly',
      'Analytics cookies: Help us understand how users interact with XPay',
      'Preference cookies: Remember your settings and personalize your experience',
    ],
  },
  {
    title: '9. Third-Party Links',
    paragraphs: [
      'XPay may contain links to third-party websites, apps, or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any personal information. This Privacy Policy applies only to information collected by XPay.',
    ],
  },
  {
    title: '10. Changes to This Privacy Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make significant changes, we will notify you through the app or via email. The updated policy will include a new effective date at the top. We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.',
    ],
  },
  {
    title: '11. Contact Us',
    paragraphs: [
      'If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:',
      'Email: privacy@xpay.ng',
      'Customer Support: support@xpay.ng',
      'Mailing Address:',
      'Privacy@xpay.ng',
      '16A, Oguntona crescent,',
      'Gbagada phase 1, Lagos, 100234',
      'Nigeria.',
      'We are committed to protecting your privacy and earning your trust. Thank you for choosing XPay.',
    ],
  },
];

const PrivacyAndPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-6">
          <img src={Logo} alt="XPay Logo" className="w-16 sm:w-24" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              XPAY PRIVACY POLICY
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Effective Date: February 16, 2026
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-slate-800 shadow-sm">
          <p className="mb-4 leading-7">
            Welcome to XPay. We are committed to protecting your privacy and
            ensuring the security of your personal and financial information.
            This Privacy Policy explains how we collect, use, share, and
            protect your information when you use our mobile wallet application
            and related services.
          </p>
          <p className="leading-7">
            By using XPay, you agree to the terms of this Privacy Policy. If
            you do not agree with our practices, please do not use our
            services.
          </p>
        </section>

        <section className="mt-8 space-y-6">
          {policySections.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-slate-900">
                {section.title}
              </h2>

              {section.paragraphs?.map((paragraph) => (
                <p
                  key={`${section.title}-${paragraph}`}
                  className="mt-4 leading-7 text-slate-700"
                >
                  {paragraph}
                </p>
              ))}

              {section.bullets && (
                <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
                  {section.bullets.map((bullet) => (
                    <li key={`${section.title}-${bullet}`}>{bullet}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="leading-7 text-slate-700">
            By using XPay, you acknowledge that you have read and understood
            this Privacy Policy.
          </p>
        </section>

        <div className="mt-8">
          <Footer />
        </div>
      </main>
    </div>
  );
};

export default PrivacyAndPolicy;
