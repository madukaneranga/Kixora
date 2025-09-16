import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import logo from '../../assests/logo.white.png';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubscribing(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Successfully subscribed to our newsletter!');
      setEmail('');
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div>
              <img
                src={logo}
                alt="Kixora"
                className="w-32 h-16 object-contain"
              />
            </div>
            <p className="text-white text-sm">
              Premium footwear designed for modern lifestyles. Quality and style in every step.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-gray-300 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-white hover:text-gray-300 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-white hover:text-gray-300 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-white hover:text-gray-300 transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-white">
              <li>
                <Link to="/products" className="hover:text-gray-300 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/products?category=running" className="hover:text-gray-300 transition-colors">
                  Running Shoes
                </Link>
              </li>
              <li>
                <Link to="/products?category=training" className="hover:text-gray-300 transition-colors">
                  Training Shoes
                </Link>
              </li>
              <li>
                <Link to="/products?category=lifestyle" className="hover:text-gray-300 transition-colors">
                  Lifestyle
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Service</h3>
            <ul className="space-y-2 text-white">
              <li>
                <a href="#" className="hover:text-gray-300 transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-300 transition-colors">
                  Size Guide
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-300 transition-colors">
                  Shipping Info
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-300 transition-colors">
                  Returns
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Stay Updated</h3>
            <p className="text-white text-sm">
              Subscribe to our newsletter for the latest releases and exclusive offers.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubscribing}
                className="w-full px-4 py-2 bg-white border border-white text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isSubscribing}
                className="w-full bg-white text-black py-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            <div>
              <a href="https://www.payhere.lk" target="_blank"><img src="https://www.payhere.lk/downloads/images/payhere_long_banner.png" alt="PayHere" width="400"/></a>
            </div>
          </div>
        </div>

        <div className="border-t border-white mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white text-sm">
            © 2024 SportPro. All rights reserved.
          </p>
          
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-white hover:text-gray-300 text-sm transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-white hover:text-gray-300 text-sm transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-white hover:text-gray-300 text-sm transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;