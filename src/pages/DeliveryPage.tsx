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
    <div className="min-h-screen bg-black text-white px-4 py-8 sm:px-6 sm:py-10 md:px-20 md:py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Delivery Information</h1>
        <p className="text-lg mb-12">
          Fast, reliable delivery options to get your Kixora footwear to you quickly and safely.
        </p>

        {/* Domestic Delivery Options */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-8">Delivery Options in Sri Lanka</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deliveryOptions.map((option, index) => (
              <div key={index} className="border border-white p-6">
                <div className="flex items-center mb-4">
                  <div className="mr-3">{option.icon}</div>
                  <h3 className="text-xl font-semibold">{option.title}</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-lg"><strong>Delivery Time:</strong> {option.time}</p>
                  <p className="text-lg"><strong>Cost:</strong> {option.cost}</p>
                  <p className="text-sm opacity-90">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* International Shipping */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-8">International Shipping</h2>
        
          {internationalRates.length > 0 && (
            <div className="border border-white p-6 mb-6">
            <p className="mb-6">
              We ship worldwide! International shipping rates and delivery times vary by destination.
              All international orders are shipped via DHL Express.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white">
                    <th className="text-left py-3 pr-6">Region</th>
                    <th className="text-left py-3 pr-6">Delivery Time</th>
                    <th className="text-left py-3">Shipping Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {internationalRates.map((rate, index) => (
                    <tr key={index} className="border-b border-white border-opacity-30">
                      <td className="py-3 pr-6">{rate.region}</td>
                      <td className="py-3 pr-6">{rate.time}</td>
                      <td className="py-3">{rate.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm opacity-90">
              * International customers are responsible for any customs duties, taxes, or additional fees imposed by their country.
            </p>
          </div>
          ) } 
          {internationalRates.length === 0 && (
            <p>No international shipping options available at this time.</p>
          )} 
        </section>

        {/* Important Information */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-8">Important Delivery Information</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="border border-white p-6">
              <h3 className="text-xl font-semibold mb-4">Order Processing</h3>
              <ul className="space-y-2 text-sm">
                <li>• Orders are processed within 1-2 business days</li>
                <li>• Orders placed after 11 AM will be processed the next business day</li>
                <li>• Weekend orders are shipped on Monday</li>
                <li>• You'll be able to check order tracking via orders section</li>
              </ul>
            </div>

            <div className="border border-white p-6">
              <h3 className="text-xl font-semibold mb-4">Delivery Areas</h3>
              <ul className="space-y-2 text-sm">
                <li>• We deliver island-wide in Sri Lanka</li>
                <li>• Same-day delivery only in Colombo city limits</li>
                <li>• Cash on Delivery available in Colombo only</li>
                <li>• No international shipping available at this time</li>
              </ul>
            </div>

            <div className="border border-white p-6">
              <h3 className="text-xl font-semibold mb-4">Free Shipping</h3>
              <ul className="space-y-2 text-sm">
                <li>• Free standard delivery on orders over LKR 15,000</li>
                <li>• International shipping will be paid shipping</li>
                <li>• Express delivery charges still apply</li>
                <li>• Offer valid for regular-priced items only</li>
              </ul>
            </div>

            <div className="border border-white p-6">
              <h3 className="text-xl font-semibold mb-4">Delivery Issues</h3>
              <ul className="space-y-2 text-sm">
                <li>• We're not responsible for delays due to weather or customs</li>
                <li>• Someone must be available to receive the package</li>
                <li>• Failed delivery attempts may incur additional charges</li>
                <li>• Contact us if your order is delayed beyond expected time</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact for Delivery Questions */}
        <section className="border border-white p-6">
          <h2 className="text-2xl font-semibold mb-4">Questions About Delivery?</h2>
          <p className="mb-4">
            Need help with delivery options or have a special delivery request? Our customer service team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/contact"
              className="bg-white text-black px-6 py-3 font-medium hover:opacity-80 transition-opacity text-center"
            >
              Contact Support
            </a>
            <a
              href="/faq"
              className="border border-white px-6 py-3 font-medium hover:bg-white hover:bg-opacity-10 transition-colors text-center"
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