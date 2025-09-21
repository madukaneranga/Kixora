import React, { useState } from 'react';
import { Ruler, Info, ArrowRight } from 'lucide-react';

const SizeGuidePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('men');
  const [measurementUnit, setMeasurementUnit] = useState('cm');

  const categories = [
    { id: 'men', label: 'Men\'s Shoes' },
    { id: 'women', label: 'Women\'s Shoes' },
    { id: 'kids', label: 'Kids\' Shoes' }
  ];

  const menSizes = [
    { us: '6', uk: '5.5', eu: '39', cm: '24.5' },
    { us: '6.5', uk: '6', eu: '39.5', cm: '25' },
    { us: '7', uk: '6.5', eu: '40', cm: '25.5' },
    { us: '7.5', uk: '7', eu: '40.5', cm: '26' },
    { us: '8', uk: '7.5', eu: '41', cm: '26.5' },
    { us: '8.5', uk: '8', eu: '42', cm: '27' },
    { us: '9', uk: '8.5', eu: '42.5', cm: '27.5' },
    { us: '9.5', uk: '9', eu: '43', cm: '28' },
    { us: '10', uk: '9.5', eu: '44', cm: '28.5' },
    { us: '10.5', uk: '10', eu: '44.5', cm: '29' },
    { us: '11', uk: '10.5', eu: '45', cm: '29.5' },
    { us: '11.5', uk: '11', eu: '45.5', cm: '30' },
    { us: '12', uk: '11.5', eu: '46', cm: '30.5' },
    { us: '13', uk: '12.5', eu: '47', cm: '31.5' }
  ];

  const womenSizes = [
    { us: '5', uk: '2.5', eu: '35', cm: '22' },
    { us: '5.5', uk: '3', eu: '35.5', cm: '22.5' },
    { us: '6', uk: '3.5', eu: '36', cm: '23' },
    { us: '6.5', uk: '4', eu: '37', cm: '23.5' },
    { us: '7', uk: '4.5', eu: '37.5', cm: '24' },
    { us: '7.5', uk: '5', eu: '38', cm: '24.5' },
    { us: '8', uk: '5.5', eu: '38.5', cm: '25' },
    { us: '8.5', uk: '6', eu: '39', cm: '25.5' },
    { us: '9', uk: '6.5', eu: '40', cm: '26' },
    { us: '9.5', uk: '7', eu: '40.5', cm: '26.5' },
    { us: '10', uk: '7.5', eu: '41', cm: '27' },
    { us: '10.5', uk: '8', eu: '42', cm: '27.5' },
    { us: '11', uk: '8.5', eu: '42.5', cm: '28' },
    { us: '12', uk: '9.5', eu: '43', cm: '29' }
  ];

  const kidsSizes = [
    { us: '10C', uk: '9.5', eu: '27', cm: '16.5' },
    { us: '10.5C', uk: '10', eu: '27.5', cm: '17' },
    { us: '11C', uk: '10.5', eu: '28', cm: '17.5' },
    { us: '11.5C', uk: '11', eu: '29', cm: '18' },
    { us: '12C', uk: '11.5', eu: '30', cm: '18.5' },
    { us: '12.5C', uk: '12', eu: '30.5', cm: '19' },
    { us: '13C', uk: '12.5', eu: '31', cm: '19.5' },
    { us: '13.5C', uk: '13', eu: '32', cm: '20' },
    { us: '1Y', uk: '13.5', eu: '32.5', cm: '20.5' },
    { us: '1.5Y', uk: '1', eu: '33', cm: '21' },
    { us: '2Y', uk: '1.5', eu: '34', cm: '21.5' },
    { us: '2.5Y', uk: '2', eu: '34.5', cm: '22' },
    { us: '3Y', uk: '2.5', eu: '35', cm: '22.5' },
    { us: '3.5Y', uk: '3', eu: '35.5', cm: '23' },
    { us: '4Y', uk: '3.5', eu: '36', cm: '23.5' },
    { us: '4.5Y', uk: '4', eu: '36.5', cm: '24' },
    { us: '5Y', uk: '4.5', eu: '37', cm: '24.5' },
    { us: '5.5Y', uk: '5', eu: '38', cm: '25' },
    { us: '6Y', uk: '5.5', eu: '38.5', cm: '25.5' },
    { us: '7Y', uk: '6', eu: '40', cm: '26' }
  ];

  const getCurrentSizes = () => {
    switch (selectedCategory) {
      case 'men':
        return menSizes;
      case 'women':
        return womenSizes;
      case 'kids':
        return kidsSizes;
      default:
        return menSizes;
    }
  };

  const measurementSteps = [
    {
      step: "1",
      title: "Prepare",
      description: "Wear your usual socks and measure feet in the evening when they're at their largest"
    },
    {
      step: "2",
      title: "Position",
      description: "Stand on a piece of paper with your heel against a wall"
    },
    {
      step: "3",
      title: "Mark",
      description: "Mark the longest point of your foot (usually your big toe) on the paper"
    },
    {
      step: "4",
      title: "Measure",
      description: "Measure the distance from the wall to the mark in centimeters"
    },
    {
      step: "5",
      title: "Compare",
      description: "Use the measurement to find your size in our size chart below"
    }
  ];

  const fitTips = [
    "Measure both feet - they may be different sizes. Choose the size for the larger foot.",
    "If you're between sizes, we recommend going up to the larger size.",
    "Consider the type of socks you'll wear with the shoes.",
    "Different shoe styles may fit differently - check individual product pages for specific fit notes.",
    "For wide feet, consider going up half a size for better comfort.",
    "Athletic shoes should have about a thumb's width of space between your longest toe and the front of the shoe."
  ];

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 sm:px-6 sm:py-10 md:px-20 md:py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Size Guide</h1>
        <p className="text-lg mb-12">
          Find your perfect fit with our comprehensive size guide. Accurate measurements ensure comfortable footwear.
        </p>

        {/* How to Measure */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-8 flex items-center">
            <Ruler className="mr-3" size={28} />
            How to Measure Your Feet
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {measurementSteps.map((step, index) => (
              <div key={index} className="border border-white p-4 text-center">
                <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                  {step.step}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-xs opacity-90">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Size Chart */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-8">Size Chart</h2>

          {/* Category Selector */}
          <div className="flex flex-wrap gap-4 mb-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-white text-black'
                    : 'border border-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Unit Selector */}
          <div className="flex gap-4 mb-6">
            <span className="text-sm font-medium">Foot Length:</span>
            <button
              onClick={() => setMeasurementUnit('cm')}
              className={`text-sm px-3 py-1 ${
                measurementUnit === 'cm' ? 'bg-white text-black' : 'border border-white'
              }`}
            >
              CM
            </button>
            <button
              onClick={() => setMeasurementUnit('inches')}
              className={`text-sm px-3 py-1 ${
                measurementUnit === 'inches' ? 'bg-white text-black' : 'border border-white'
              }`}
            >
              Inches
            </button>
          </div>

          {/* Size Table */}
          <div className="overflow-x-auto border border-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white">
                  <th className="text-left py-3 px-4 font-semibold">US Size</th>
                  <th className="text-left py-3 px-4 font-semibold">UK Size</th>
                  <th className="text-left py-3 px-4 font-semibold">EU Size</th>
                  <th className="text-left py-3 px-4 font-semibold">
                    Foot Length ({measurementUnit === 'cm' ? 'CM' : 'Inches'})
                  </th>
                </tr>
              </thead>
              <tbody>
                {getCurrentSizes().map((size, index) => (
                  <tr key={index} className="border-b border-white border-opacity-30">
                    <td className="py-3 px-4">{size.us}</td>
                    <td className="py-3 px-4">{size.uk}</td>
                    <td className="py-3 px-4">{size.eu}</td>
                    <td className="py-3 px-4">
                      {measurementUnit === 'cm'
                        ? size.cm
                        : (parseFloat(size.cm) / 2.54).toFixed(1)
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Fit Tips */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-8 flex items-center">
            <Info className="mr-3" size={28} />
            Fit Tips & Recommendations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fitTips.map((tip, index) => (
              <div key={index} className="border border-white p-4 flex items-start">
                <ArrowRight size={16} className="flex-shrink-0 mt-1 mr-3" />
                <p className="text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Width Guide */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-8">Width Guide</h2>
          <div className="border border-white p-6">
            <p className="mb-4">
              Most of our shoes come in standard (D) width. If you have wider or narrower feet, consider these guidelines:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <h3 className="font-semibold mb-2">Narrow (B/C)</h3>
                <p className="text-sm opacity-90">Consider going down half a size or using insoles for better fit</p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold mb-2">Standard (D)</h3>
                <p className="text-sm opacity-90">Use our standard size chart measurements</p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold mb-2">Wide (E/EE)</h3>
                <p className="text-sm opacity-90">Consider going up half a size for comfortable fit</p>
              </div>
            </div>
          </div>
        </section>

        {/* Need Help */}
        <section className="border border-white p-6">
          <h2 className="text-2xl font-semibold mb-4">Still Need Help?</h2>
          <p className="mb-4">
            Can't find your perfect size or have questions about fit? Our customer service team is here to help.
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
              Ask About Sizing
            </a>
            <a
              href="/faq"
              className="border border-white px-6 py-3 font-medium hover:bg-white hover:bg-opacity-10 transition-colors text-center"
            >
              View FAQ
            </a>
          </div>
          <p className="text-sm opacity-90 mt-4">
            Remember: If you're unsure about sizing, we offer free returns within 30 days!
          </p>
        </section>
      </div>
    </div>
  );
};

export default SizeGuidePage;