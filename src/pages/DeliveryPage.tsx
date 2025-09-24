import React from 'react';
import { Truck, Clock, MapPin, CreditCard } from 'lucide-react';

const DeliveryPage: React.FC = () => {
  const deliveryOptions = [
    {
      icon: <Truck size={24} />,
      title: "Standard Delivery",
      time: "3-7 Business Days",
      cost: "LKR 399",
      description: "Regular delivery service across Sri Lanka"
    },
    {
      icon: <Clock size={24} />,
      title: "Express Delivery",
      time: "1-3 Business Days",
      cost: "LKR 699",
      description: "Fast delivery for urgent orders only within colombo"
    },
  ];

  const internationalRates = [];

  return (
    <div className="min-h-screen bg-black text-white px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Delivery Information</h1>
        <p className="text-sm mb-6">
          Fast, reliable delivery options to get your Kixora footwear to you quickly and safely.
        </p>

        {/* Domestic Delivery Options */}
        <section className="mb-6">
          <h2 className="text-base font-semibold mb-4">Delivery Options in Sri Lanka</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deliveryOptions.map((option, index) => (
              <div key={index} className="border border-white p-3">
                <div className="flex items-center mb-2">
                  <div className="mr-2 scale-75">{option.icon}</div>
                  <h3 className="text-sm font-semibold">{option.title}</h3>
                </div>
                <div className="space-y-1">
                  <p className="text-xs"><strong>Delivery Time:</strong> {option.time}</p>
                  <p className="text-xs"><strong>Cost:</strong> {option.cost}</p>
                  <p className="text-xs opacity-90">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* International Shipping */}
        <section className="mb-6">
          <h2 className="text-base font-semibold mb-4">International Shipping</h2>
        
          {internationalRates.length > 0 && (
            <div className="border border-white p-3 mb-3">
            <p className="mb-3 text-sm">
              We ship worldwide! International shipping rates and delivery times vary by destination.
              All international orders are shipped via DHL Express.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white">
                    <th className="text-left py-2 pr-4 text-xs">Region</th>
                    <th className="text-left py-2 pr-4 text-xs">Delivery Time</th>
                    <th className="text-left py-2 text-xs">Shipping Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {internationalRates.map((rate, index) => (
                    <tr key={index} className="border-b border-white border-opacity-30">
                      <td className="py-2 pr-4 text-xs">{rate.region}</td>
                      <td className="py-2 pr-4 text-xs">{rate.time}</td>
                      <td className="py-2 text-xs">{rate.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs opacity-90">
              * International customers are responsible for any customs duties, taxes, or additional fees imposed by their country.
            </p>
          </div>
          ) } 
          {internationalRates.length === 0 && (
            <p className="text-sm">No international shipping options available at this time.</p>
          )} 
        </section>

        {/* Important Information */}
        <section className="mb-6">
          <h2 className="text-base font-semibold mb-4">Important Delivery Information</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="border border-white p-3">
              <h3 className="text-sm font-semibold mb-2">Order Processing</h3>
              <ul className="space-y-1 text-xs">
                <li>• Orders are processed within 1-2 business days</li>
                <li>• Orders placed after 11 AM will be processed the next business day</li>
                <li>• Weekend orders are shipped on Monday</li>
                <li>• You'll be able to check order tracking via orders section</li>
              </ul>
            </div>

            <div className="border border-white p-3">
              <h3 className="text-sm font-semibold mb-2">Delivery Areas</h3>
              <ul className="space-y-1 text-xs">
                <li>• We deliver island-wide in Sri Lanka</li>
                <li>• Same-day delivery only in Colombo city limits</li>
                <li>• Cash on Delivery available in Colombo only</li>
                <li>• No international shipping available at this time</li>
              </ul>
            </div>

            <div className="border border-white p-3">
              <h3 className="text-sm font-semibold mb-2">Free Shipping</h3>
              <ul className="space-y-1 text-xs">
                <li>• Free standard delivery on orders over LKR 15,000</li>
                <li>• International shipping will be paid shipping</li>
                <li>• Express delivery charges still apply</li>
                <li>• Offer valid for regular-priced items only</li>
              </ul>
            </div>

            <div className="border border-white p-3">
              <h3 className="text-sm font-semibold mb-2">Delivery Issues</h3>
              <ul className="space-y-1 text-xs">
                <li>• We're not responsible for delays due to weather or customs</li>
                <li>• Someone must be available to receive the package</li>
                <li>• Failed delivery attempts may incur additional charges</li>
                <li>• Contact us if your order is delayed beyond expected time</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact for Delivery Questions */}
        <section className="border border-white p-3">
          <h2 className="text-base font-semibold mb-3">Questions About Delivery?</h2>
          <p className="mb-3 text-sm">
            Need help with delivery options or have a special delivery request? Our customer service team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href="/contact"
              className="bg-white text-black px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity text-center"
            >
              Contact Support
            </a>
            <a
              href="/faq"
              className="border border-white px-4 py-2 text-sm font-medium hover:bg-white hover:bg-opacity-10 transition-colors text-center"
            >
              View FAQ
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DeliveryPage;