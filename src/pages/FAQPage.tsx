import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQPage: React.FC = () => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const faqs: FAQItem[] = [
    {
      question: "How can I track my order?",
      answer: "You can track your order status by logging into your account and visiting the 'Orders' section."
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 14-day return policy for unworn items in original packaging. Items must be returned within 14 days of delivery. Please check our Refund Policy page for detailed terms and conditions."
    },
    {
      question: "How long does shipping take?",
      answer: "Standard shipping typically takes 3-7 business days within Sri Lanka. Express shipping is available for faster delivery (1-3 business days). International shipping times vary by location."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards via PayHere and bank transfers for secure online payments. We also offer cash on delivery for orders within Colombo."
    },
    {
      question: "How do I know what size to order?",
      answer: "Please refer to our Size Guide available on each product page. If you're between sizes, we recommend going up one size. For specific questions about sizing, contact our customer support."
    },
    {
      question: "Can I cancel or modify my order?",
      answer: "Orders can be cancelled or modified within 2 hours of placement. After that, the order enters processing and cannot be changed. Please contact us immediately if you need to make changes."
    },
    {
      question: "Do you offer international shipping?",
      answer: "No, Right now we don't ship internationally."
    },
    {
      question: "How can I contact customer support?",
      answer: "You can reach our customer support team via whatsapp, email, phone, or through our Submit a Request form. Our team responds within 24 hours during business days."
    },
    {
      question: "Are your shoes authentic?",
      answer: "Yes, all our footwear is 100% authentic and sourced directly from authorized suppliers. We guarantee the authenticity of every product we sell."
    },
    {
      question: "Do you have a physical store?",
      answer: "We are primarily an online retailer, but we have warehouses as storages."
    },
    {
      question: "How do I create an account?",
      answer: "Click the 'Sign In' button in the top right corner of our website. You can register using your email address."
    },
    {
      question: "What if I receive a defective item?",
      answer: "If you receive a defective or damaged item, please contact us immediately with photos of the issue. We'll arrange for a replacement or full refund at no cost to you."
    },
    {
      question: "Will you provide a order packing video?",
      answer: "Yes. We provide packing videos for all orders upon request to ensure transparency and trust."
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 sm:px-6 sm:py-10 md:px-20 md:py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Frequently Asked Questions</h1>
        <p className="text-lg mb-8">
          Find answers to the most common questions about Kixora. Can't find what you're looking for?
          <a href="/contact" className="underline ml-1">Contact our support team</a>.
        </p>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-white">
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-white hover:bg-opacity-5 transition-colors"
              >
                <h3 className="text-lg font-medium pr-4">{faq.question}</h3>
                {openItems.has(index) ? (
                  <ChevronUp size={20} className="flex-shrink-0" />
                ) : (
                  <ChevronDown size={20} className="flex-shrink-0" />
                )}
              </button>
              {openItems.has(index) && (
                <div className="px-6 pb-4 border-t border-white border-opacity-20">
                  <p className="pt-4 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 border border-white">
          <h2 className="text-2xl font-semibold mb-4">Still have questions?</h2>
          <p className="mb-4">
            Our customer support team is here to help you with any additional questions or concerns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/contact"
              className="bg-white text-black px-6 py-3 font-medium hover:opacity-80 transition-opacity text-center"
            >
              Contact Support
            </a>
            <a
              href="/submit-request"
              className="border border-white px-6 py-3 font-medium hover:bg-white hover:bg-opacity-10 transition-colors text-center"
            >
              Submit a Request
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;