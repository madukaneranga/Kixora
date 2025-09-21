// pages/PrivacyPolicy.tsx
import React from 'react';

const PrivacyPolicy: React.FC = () => {
  const sections = [
    {
      title: "1. Information We Collect",
      content: (
        <>
          <p>We collect several types of information from and about users of our Site, including:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Personal Information:</strong> Name, email, mailing address, phone number, payment info, bank account details for transfers.</li>
            <li><strong>Device and Usage Information:</strong> IP address, browser type, OS, pages viewed, links clicked, date/time of visit.</li>
            <li><strong>Transaction Information:</strong> Details of transactions, product info, purchase price, date/time.</li>
            <li><strong>Cookies and Tracking Technologies:</strong> Files storing small amounts of data, may include anonymous unique identifiers.</li>
          </ul>
        </>
      ),
    },
    {
      title: "2. How We Use Your Information",
      content: (
        <ul className="list-disc list-inside space-y-1">
          <li>Process orders and manage accounts.</li>
          <li>Communicate about orders, products, services, promotions.</li>
          <li>Personalize your experience.</li>
          <li>Analyze trends and usage.</li>
          <li>Improve Site, products, and services.</li>
          <li>Detect and prevent fraudulent or unauthorized transactions.</li>
          <li>Comply with legal obligations.</li>
        </ul>
      ),
    },
    {
      title: "3. How We Share Your Information",
      content: (
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Service Providers:</strong> Payment processing (Payhere), shipping, data analysis, marketing services.</li>
          <li><strong>Legal Compliance:</strong> Disclosures required by law or to protect rights/property/safety.</li>
          <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets.</li>
        </ul>
      ),
    },
    {
      title: "4. Data Security",
      content: <p>We implement measures to secure personal information from loss, unauthorized access, use, alteration, and disclosure. No method of transmission or storage is 100% secure.</p>,
    },
    {
      title: "5. Your Rights and Choices",
      content: (
        <>
          <p>Depending on your location, you may have rights to access, correct, delete, or object to processing of your personal info.</p>

          <h3 className="text-lg font-semibold mt-3 mb-1">EU Users: GDPR Rights</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Right to Rectification</li>
            <li>Right to Erasure ('Right to be Forgotten')</li>
            <li>Right to Restriction of Processing</li>
            <li>Right to Data Portability</li>
            <li>Right to Object</li>
          </ul>

          <h3 className="text-lg font-semibold mt-3 mb-1">California (US) Users: CCPA/CPRA Rights</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Right to Know</li>
            <li>Right to Delete</li>
            <li>Right to Opt-Out of Sale or Sharing (we do not sell info)</li>
            <li>Right to Correct</li>
          </ul>
        </>
      ),
    },
    {
      title: "6. Cookies and Tracking Technologies",
      content: (
        <>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Essential Cookies:</strong> Necessary for core website functions.</li>
            <li><strong>Analytical/Performance Cookies:</strong> Track usage to improve website performance.</li>
          </ul>
          <p className="mt-2">You can refuse cookies in your browser, but some parts of the Site may not work properly.</p>
        </>
      ),
    },
    {
      title: "7. Children's Privacy",
      content: <p>The Site is not for children under 13. We do not knowingly collect info from children under 13.</p>,
    },
    {
      title: "8. Changes to This Privacy Policy",
      content: <p>We may update this Privacy Policy. Updates will be posted on this page.</p>,
    },
    {
      title: "9. Contact Us",
      content: (
        <>
          <p>Email: <a href="mailto:support@inkixora.com" className="underline">support@inkixora.com</a></p>
          <p>Phone: <a href="tel:+94741285920" className="underline">+94 74 128 5920</a></p>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 sm:px-6 sm:py-10 md:px-20 md:py-12 space-y-6 sm:space-y-8">
      <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
      <p className="mb-6">Last updated: October 26, 2023</p>
      <p className="mb-6">
        Welcome to KIXORA! Your privacy is important to us. This policy explains how we collect, use, 
        and protect your information when you use our website, <a href="https://www.inkixora.com" className="underline">www.inkixora.com</a>.
      </p>
      <p className="mb-6">
        By accessing or using the Site, you agree to the collection and use of information in accordance 
        with this Privacy Policy.
      </p>

      {sections.map((section, idx) => (
        <div key={idx} className="p-6 border border-white space-y-3">
          <h2 className="text-2xl font-semibold">{section.title}</h2>
          <div>{section.content}</div>
        </div>
      ))}
    </div>
  );
};

export default PrivacyPolicy;
