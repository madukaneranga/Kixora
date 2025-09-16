import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, Heart, LogOut, X, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useCartStore } from '../../stores/cartStore';
import { useWishlistStore } from '../../stores/wishlistStore';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import AuthForm from '../auth/AuthForm';
import logo from '../../assests/logo.black.png';

const Header = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, isAdmin } = useAuth();
  const { items, openCart } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
  const wishlistItemCount = wishlistItems.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <motion.img
              src={logo}
              alt="Kixora"
              className="w-32 h-32 object-contain"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            />
          </Link>

          <div className="flex-1"></div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <motion.div
              animate={{ width: isSearchOpen ? '300px' : '40px' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="relative"
            >
              {!isSearchOpen ? (
                <motion.button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 hover:bg-gray-100 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Search size={20} className="text-black" />
                </motion.button>
              ) : (
                <motion.form
                  onSubmit={handleSearch}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative w-full"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for shoes..."
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-full focus:outline-none"
                    autoFocus
                    onBlur={() => {
                      if (!searchQuery) {
                        setIsSearchOpen(false);
                      }
                    }}
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-black" />
                  <motion.button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="absolute right-3 top-2.5 hover:bg-gray-100 rounded-full p-0.5"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X size={16} className="text-gray-500" />
                  </motion.button>
                </motion.form>
              )}
            </motion.div>
            {/* Wishlist */}
            <Link to="/wishlist">
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2"
              >
                <Heart size={20} />
                {wishlistItemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-black text-white text-xs h-5 w-5 flex items-center justify-center rounded-full"
                  >
                    {wishlistItemCount}
                  </motion.span>
                )}
              </Button>
            </Link>

            {/* Cart */}
            <Button
              variant="ghost"
              size="sm"
              onClick={openCart}
              className="relative p-2"
            >
              <ShoppingCart size={20} />
              {cartItemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-black text-white text-xs h-5 w-5 flex items-center justify-center rounded-full"
                >
                  {cartItemCount}
                </motion.span>
              )}
            </Button>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2"
                >
                  <User size={20} />
                </Button>
                
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white shadow-lg border border-gray-200 py-2"
                    >
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-black">
                          {profile?.full_name || 'User'}
                        </p>
                      </div>
                      
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-black hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Profile
                      </Link>
                      
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-sm text-black hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <Package size={16} />
                          <span>Orders</span>
                        </div>
                      </Link>
                      
                      <Link
                        to="/wishlist"
                        className="block px-4 py-2 text-sm text-black hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <Heart size={16} />
                          <span>Wishlist</span>
                        </div>
                      </Link>
                      
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-black hover:bg-gray-100 border-t border-gray-200"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAuthModal(true)}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <nav className="px-4 py-4 space-y-2">
              <Link
                to="/collections"
                className="block py-2 text-black font-medium hover:text-gray-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Collections
              </Link>
              <Link
                to="/products"
                className="block py-2 text-black font-medium hover:text-gray-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                to="/products?category=running"
                className="block py-2 text-black font-medium hover:text-gray-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Running
              </Link>
              <Link
                to="/products?category=training"
                className="block py-2 text-black font-medium hover:text-gray-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Training
              </Link>
              <Link
                to="/products?category=lifestyle"
                className="block py-2 text-black font-medium hover:text-gray-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Lifestyle
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Welcome to Kixora"
      >
        <AuthForm onSuccess={() => setShowAuthModal(false)} />
      </Modal>
    </header>
  );
};

export default Header;