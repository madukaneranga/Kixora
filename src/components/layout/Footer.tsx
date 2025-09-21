import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../ui/CustomToast';
import { supabase } from '../../lib/supabase';
import logo from '../../assests/logo.white.png';

interface Category {
  id: string;
  slug: string;
  name: string;
}

// TikTok Icon Component
const TikTokIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories for quick links
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await supabase
          .from('categories')
          .select('id, slug, name')
          .order('name')
          .limit(6); // Limit to 6 categories for footer

        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories for footer:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      showErrorToast('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      showErrorToast('Please enter a valid email address');
      return;
    }

    setIsSubscribing(true);

    try {
      // Get current session for authenticated requests
      const { data: { session } } = await supabase.auth.getSession();

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newsletter-subscribe`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add auth header if user is logged in
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          source: 'footer'
        }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccessToast(data.message);
        setEmail('');
      } else {
        showErrorToast(data.message || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      showErrorToast('Failed to subscribe. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="bg-black text-white ">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Brand Section */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-3">
              <img
                src={logo}
                alt="Kixora"
                className="w-24 h-12 object-contain"
              />
            </div>
            <p className="text-white text-xs leading-relaxed mb-3">
              Premium footwear for modern lifestyles. Quality and style in every step.
            </p>
            <div className="flex space-x-3 mb-3">
              <a href="#" className="text-white hover:opacity-70 transition-opacity duration-200">
                <Facebook size={16} />
              </a>
              <a href="#" className="text-white hover:opacity-70 transition-opacity duration-200">
                <TikTokIcon size={16} />
              </a>
              <a href="#" className="text-white hover:opacity-70 transition-opacity duration-200">
                <Instagram size={16} />
              </a>
              <a href="#" className="text-white hover:opacity-70 transition-opacity duration-200">
                <Mail size={16} />
              </a>
            </div>
            <div>
              <a href="https://www.payhere.lk" target="_blank" rel="noopener noreferrer">
                <img src="https://www.payhere.lk/downloads/images/payhere_long_banner.png" alt="PayHere" className="w-60 h-auto opacity-80 hover:opacity-100 transition-opacity"/>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-sm font-medium mb-3">Shop</h3>
            <ul className="space-y-1.5">
              <li>
                <Link to="/products" className="text-white hover:opacity-70 text-xs transition-opacity duration-200">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/collections" className="text-white hover:opacity-70 text-xs transition-opacity duration-200">
                  Collections
                </Link>
              </li>
              {categories.slice(0, 3).map((category) => (
                <li key={category.id}>
                  <Link
                    to={`/products?category=${category.slug}`}
                    className="text-white hover:opacity-70 text-xs transition-opacity duration-200"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              {categories.length === 0 && (
                <>
                  <li>
                    <Link to="/featured" className="text-white hover:opacity-70 text-xs transition-opacity duration-200">
                      Featured
                    </Link>
                  </li>
                  <li>
                    <Link to="/new-arrivals" className="text-white hover:opacity-70 text-xs transition-opacity duration-200">
                      New Arrivals
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white text-sm font-medium mb-3">Support</h3>
            <ul className="space-y-1.5">
              <li>
                <Link to="/faq" className="text-white hover:opacity-70 text-xs transition-opacity duration-200">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/delivery" className="text-white hover:opacity-70 text-xs transition-opacity duration-200">
                  Delivery Info
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white hover:opacity-70 text-xs transition-opacity duration-200">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/submit-request" className="text-white hover:opacity-70 text-xs transition-opacity duration-200">
                  Submit Request
                </Link>
              </li>
              <li>
                <a href="/size-guide" className="text-white hover:opacity-70 text-xs transition-opacity duration-200">
                  Size Guide
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white text-sm font-medium mb-3">Newsletter</h3>
            <p className="text-white text-xs mb-3 leading-relaxed">
              Get updates on new releases and exclusive offers.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubscribing}
                className="w-full px-3 py-2 text-xs bg-black border border-white text-white placeholder:text-white placeholder:opacity-50 focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50 "
              />
              <button
                type="submit"
                disabled={isSubscribing}
                className="w-full bg-white text-black text-xs py-2 px-3 hover:opacity-80 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed  font-medium"
              >
                {isSubscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white pt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <p className="text-white text-xs">
              © 2025 Kixora. All rights reserved.
            </p>

            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <Link to="/contact-information" className="text-white hover:opacity-70 text-xs transition-opacity duration-200">
                Contact
              </Link>
              <Link to="/refund-policy" className="text-white hover:opacity-70 text-xs transition-opacity duration-200">
                Refunds
              </Link>
              <Link to="/privacy-policy" className="text-white hover:opacity-70 text-xs transition-opacity duration-200">
                Privacy
              </Link>
              <a href="/terms-of-service" className="text-white hover:opacity-70 text-xs transition-opacity duration-200">
                Terms
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;