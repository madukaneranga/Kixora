import React from 'react';

const TermsOfServicePage: React.FC = () => {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: (
        <>
          <p>
            By accessing and using the Kixora website ("Site"), you accept and agree to be bound by the terms and provision of this agreement.
            If you do not agree to abide by the above, please do not use this service.
          </p>
          <p className="mt-3">
            These Terms of Service ("Terms") govern your use of our website located at www.inkixora.com (the "Service")
            operated by Kixora ("us", "we", or "our").
          </p>
        </>
      ),
    },
    {
      title: "2. Use License",
      content: (
        <>
          <p>
            Permission is granted to temporarily download one copy of the materials on Kixora's website for personal,
            non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-3 text-xs">
            <li>modify or copy the materials</li>
            <li>use the materials for any commercial purpose or for any public display (commercial or non-commercial)</li>
            <li>attempt to decompile or reverse engineer any software contained on the website</li>
            <li>remove any copyright or other proprietary notations from the materials</li>
          </ul>
          <p className="mt-3">
            This license shall automatically terminate if you violate any of these restrictions and may be terminated by us at any time.
          </p>
        </>
      ),
    },
    {
      title: "3. User Accounts",
      content: (
        <>
          <p>
            When you create an account with us, you must provide information that is accurate, complete, and current at all times.
            You are responsible for safeguarding the password and for maintaining the confidentiality of your account.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-3 text-xs">
            <li>You must be at least 13 years old to create an account</li>
            <li>You are responsible for all activities that occur under your account</li>
            <li>You must notify us immediately of any unauthorized use of your account</li>
            <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
          </ul>
        </>
      ),
    },
    {
      title: "4. Orders and Payments",
      content: (
        <>
          <p>
            All orders are subject to acceptance and availability. We reserve the right to refuse or cancel orders at our discretion.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-3 text-xs">
            <li>Prices are subject to change without notice</li>
            <li>Payment must be received before order processing</li>
            <li>We accept major credit cards and PayHere payments</li>
            <li>All transactions are processed in Sri Lankan Rupees (LKR) unless otherwise stated</li>
            <li>Orders can be cancelled within 2 hours of placement</li>
          </ul>
        </>
      ),
    },
    {
      title: "5. Shipping and Delivery",
      content: (
        <>
          <p>
            We will make every effort to deliver products within the estimated timeframes, but delivery dates are not guaranteed.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-3 text-xs">
            <li>Shipping times are estimates and not guarantees</li>
            <li>Risk of loss passes to you upon delivery to the carrier</li>
            <li>International orders may be subject to customs duties and taxes</li>
            <li>We are not responsible for delays caused by customs or weather</li>
          </ul>
        </>
      ),
    },
    {
      title: "6. Returns and Refunds",
      content: (
        <>
          <p>
            Our return policy allows returns within 14 days of delivery. Please refer to our detailed Refund Policy for complete terms.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-3 text-xs">
            <li>Items must be returned in original, unworn condition</li>
            <li>Original packaging and tags must be included</li>
            <li>Refunds are processed to the original payment method</li>
            <li>Return shipping costs may apply unless item is defective</li>
          </ul>
        </>
      ),
    },
    {
      title: "7. Product Information",
      content: (
        <>
          <p>
            We strive to provide accurate product information, but we do not warrant that product descriptions or other content is accurate, complete, or error-free.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-3 text-xs">
            <li>Colors may vary due to monitor settings</li>
            <li>Sizes may vary slightly from measurements listed</li>
            <li>We reserve the right to correct errors in product information</li>
            <li>Product availability is subject to change</li>
          </ul>
        </>
      ),
    },
    {
      title: "8. Intellectual Property",
      content: (
        <>
          <p>
            The Service and its original content, features, and functionality are and will remain the exclusive property of Kixora and its licensors.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-3 text-xs">
            <li>All trademarks, logos, and brand names are our property</li>
            <li>You may not use our intellectual property without written permission</li>
            <li>User-generated content may be used by us for marketing purposes</li>
            <li>We respect the intellectual property rights of others</li>
          </ul>
        </>
      ),
    },
    {
      title: "9. Prohibited Uses",
      content: (
        <>
          <p>You may not use our Service:</p>
          <ul className="list-disc list-inside space-y-1 mt-3 text-xs">
            <li>For any unlawful purpose or to solicit others to unlawful acts</li>
            <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
            <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
            <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
            <li>To submit false or misleading information</li>
            <li>To upload or transmit viruses or any other type of malicious code</li>
            <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
            <li>For any obscene or immoral purpose</li>
          </ul>
        </>
      ),
    },
    {
      title: "10. Disclaimers",
      content: (
        <>
          <p>
            The information on this website is provided on an "as is" basis. To the fullest extent permitted by law, this Company:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-3 text-xs">
            <li>Excludes all representations and warranties relating to this website and its contents</li>
            <li>Does not warrant that the website will be constantly available or available at all</li>
            <li>Makes no warranties about the accuracy or completeness of the website's content</li>
            <li>Is not liable for any loss or damage arising from the use of this website</li>
          </ul>
        </>
      ),
    },
    {
      title: "11. Limitation of Liability",
      content: (
        <>
          <p>
            In no case shall Kixora, our directors, officers, employees, affiliates, agents, contractors, interns, suppliers,
            service providers, or licensors be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive,
            special, or consequential damages of any kind.
          </p>
          <p className="mt-3">
            Our total liability to you for any damages shall not exceed the amount paid by you to us in the 12 months preceding the claim.
          </p>
        </>
      ),
    },
    {
      title: "12. Governing Law",
      content: (
        <>
          <p>
            These Terms shall be interpreted and governed by the laws of Sri Lanka. Any disputes arising from these terms
            shall be subject to the exclusive jurisdiction of the courts of Sri Lanka.
          </p>
        </>
      ),
    },
    {
      title: "13. Changes to Terms",
      content: (
        <>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
            If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
          </p>
          <p className="mt-3">
            Your continued use of the Service after any such changes constitutes your acceptance of the new Terms of Service.
          </p>
        </>
      ),
    },
    {
      title: "14. Contact Information",
      content: (
        <>
          <p>If you have any questions about these Terms of Service, please contact us:</p>
          <ul className="list-disc list-inside space-y-1 mt-3 text-xs">
            <li>Email: <a href="mailto:support@kixora.com" className="underline">inkixora@gmail.com</a></li>
            <li>Phone: <a href="tel:+94112345678" className="underline">+94 74 128 5920</a></li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 space-y-3 sm:space-y-4">
      <h1 className="text-2xl font-bold mb-2">Terms of Service</h1>
      <p className="mb-3 text-xs">Last updated: September 22, 2025</p>
      <p className="mb-4 text-sm">
        Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the Kixora website
        (the "Service") operated by Kixora ("us", "we", or "our").
      </p>

      {sections.map((section, idx) => (
        <div key={idx} className="p-3 border border-white space-y-2">
          <h2 className="text-base font-semibold">{section.title}</h2>
          <div className="space-y-2 text-xs">{section.content}</div>
        </div>
      ))}

      <div className="p-3 border border-white space-y-2">
        <h2 className="text-base font-semibold">Acknowledgment</h2>
        <p className="text-xs">
          By using our Service, you acknowledge that you have read these Terms of Service and agree to be bound by them.
          If you do not agree to these Terms, you may not use our Service.
        </p>
      </div>
    </div>
  );
};

export default TermsOfServicePage;