import React from 'react';
import { Clock, Package, CreditCard, AlertTriangle } from 'lucide-react';

const RefundPolicyPage: React.FC = () => {
  const refundConditions = [
    {
      icon: <Clock size={24} />,
      title: "14-Day Return Window",
      description: "Items must be returned within 14 days of delivery date"
    },
    {
      icon: <Package size={24} />,
      title: "Original Condition",
      description: "Items must be unworn, undamaged, and in original packaging"
    },
    {
      icon: <CreditCard size={24} />,
      title: "Proof of Purchase",
      description: "Original receipt or order confirmation required. (screenshot accepted)"
    }
  ];

  const nonRefundableItems = [
    "Custom or personalized footwear",
    "Items worn outdoors or showing signs of wear",
    "Items returned after 14 days",
    "Items without original packaging or tags",
    "Sale or clearance items (unless defective)",
    "Gift cards or store credit"
  ];

  const refundProcess = [
    {
      step: "1",
      title: "Initiate Return",
      description: "Contact our customer service to start the process"
    },
    {
      step: "2",
      title: "Receive Return Label",
      description: "We'll email you a prepaid return shipping label within 24 hours"
    },
    {
      step: "3",
      title: "Package & Ship",
      description: "Securely package your items and attach the return label"
    },
    {
      step: "4",
      title: "Inspection",
      description: "We inspect returned items within 3-5 business days of receipt"
    },
    {
      step: "5",
      title: "Refund Processed",
      description: "Approved refunds are processed within 5-7 business days"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Refund Policy</h1>
        <p className="text-sm mb-6">
          At Kixora, we want you to be completely satisfied with your purchase. Our refund policy is designed to be fair and straightforward.
        </p>

        {/* Refund Conditions */}
        <section className="mb-6">
          <h2 className="text-base font-semibold mb-4">Refund Conditions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {refundConditions.map((condition, index) => (
              <div key={index} className="border border-white p-3 text-center">
                <div className="flex justify-center mb-2 scale-75">{condition.icon}</div>
                <h3 className="text-sm font-semibold mb-2">{condition.title}</h3>
                <p className="text-xs opacity-90">{condition.description}</p>
              </div>
            ))}
          </div>
          <div className="border border-white p-3">
            <h3 className="text-sm font-semibold mb-2">General Requirements</h3>
            <ul className="space-y-1 text-xs">
              <li>• Items must be returned in their original, unworn condition</li>
              <li>• All original packaging, tags, and labels must be included</li>
              <li>• Shoes must not show any signs of wear or outdoor use</li>
              <li>• Original receipt or order confirmation must be provided</li>
              <li>• Return must be initiated within 14 days of delivery</li>
            </ul>
          </div>
        </section>

        {/* Refund Process */}
        <section className="mb-6">
          <h2 className="text-base font-semibold mb-4">How to Return Items</h2>
          <div className="space-y-3">
            {refundProcess.map((step, index) => (
              <div key={index} className="flex items-start space-x-3 border border-white p-3">
                <div className="flex-shrink-0 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-xs">
                  {step.step}
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">{step.title}</h3>
                  <p className="text-xs opacity-90">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Non-Refundable Items */}
        <section className="mb-6">
          <h2 className="text-base font-semibold mb-4">Non-Refundable Items</h2>
          <div className="border border-white p-3">
            <div className="flex items-start space-x-2 mb-2">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium">The following items cannot be returned for refund:</p>
            </div>
            <ul className="space-y-1 ml-4">
              {nonRefundableItems.map((item, index) => (
                <li key={index} className="text-xs">• {item}</li>
              ))}
            </ul>
            <p className="text-xs opacity-90 mt-2">
              Note: Defective items are always eligible for return regardless of sale status.
            </p>
          </div>
        </section>

        {/* Refund Timeline & Methods */}
        <section className="mb-6">
          <h2 className="text-base font-semibold mb-4">Refund Timeline & Methods</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="border border-white p-3">
              <h3 className="text-sm font-semibold mb-2">Processing Time</h3>
              <ul className="space-y-1 text-xs">
                <li><strong>Inspection:</strong> 3-5 business days after we receive your return</li>
                <li><strong>Refund Processing:</strong> 5-7 business days after approval</li>
                <li><strong>Bank Processing:</strong> 3-10 business days (varies by bank)</li>
                <li><strong>Total Time:</strong> Typically 10-20 business days from return shipment</li>
              </ul>
            </div>

            <div className="border border-white p-3">
              <h3 className="text-sm font-semibold mb-2">Refund Methods</h3>
              <ul className="space-y-1 text-xs">
                <li><strong>Original Payment Method:</strong> Refunds are issued to the original payment method</li>
                <li><strong>Payhere:</strong> Refunded to the same payment method used for purchase within payhere</li>
                <li><strong>Bank Transfer:</strong> Refunded via bank transfer</li>
                <li><strong>Cash on Delivery:</strong> Refunded via bank transfer</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Exchanges */}
        <section className="mb-6">
          <h2 className="text-base font-semibold mb-4">Exchanges</h2>
          <div className="border border-white p-3">
            <p className="mb-2 text-sm">
              We currently don't offer direct exchanges. To exchange an item for a different size or style:
            </p>
            <ol className="space-y-1 text-xs ml-3">
              <li>1. Return your original item following our return process</li>
              <li>2. Place a new order for the desired item</li>
              <li>3. Once your return is processed, you'll receive a full refund</li>
            </ol>
            <p className="text-xs opacity-90 mt-2">
              This ensures you get the exact item you want and the fastest possible service.
            </p>
          </div>
        </section>

        {/* Defective Items */}
        <section className="mb-6">
          <h2 className="text-base font-semibold mb-4">Defective or Damaged Items</h2>
          <div className="border border-white p-3">
            <p className="mb-2 text-sm">
              If you receive a defective or damaged item, we'll make it right immediately:
            </p>
            <ul className="space-y-1 text-xs mb-2">
              <li>• Contact us within 3 days of receiving the item</li>
              <li>• Provide photos showing the defect or damage</li>
              <li>• We'll arrange for immediate replacement or full refund (depends on stock availability )</li>
              <li>• No return shipping costs for defective items</li>
            </ul>
            <p className="text-xs opacity-90">
              We stand behind the quality of our products and will resolve any quality issues promptly.
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <section className="border border-white p-3">
          <h2 className="text-base font-semibold mb-3">Questions About Returns?</h2>
          <p className="mb-3 text-sm">
            Our customer service team is here to help with any questions about returns or refunds.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href="/contact"
              className="bg-white text-black px-4 py-2 text-xs font-medium hover:opacity-80 transition-opacity text-center"
            >
              Contact Support
            </a>
            <a
              href="/submit-request"
              className="border border-white px-4 py-2 text-xs font-medium hover:bg-white hover:bg-opacity-10 transition-colors text-center"
            >
              Start Return Process
            </a>
            <a
              href="/faq"
              className="border border-white px-4 py-2 text-xs font-medium hover:bg-white hover:bg-opacity-10 transition-colors text-center"
            >
              View FAQ
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default RefundPolicyPage;