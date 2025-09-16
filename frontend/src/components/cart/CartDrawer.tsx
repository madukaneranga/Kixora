import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../stores/cartStore';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const CartDrawer = () => {
  const { items, isOpen, closeCart, updateQuantity, removeItem, clearCart } = useCartStore();
  const { user } = useAuth();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuantityUpdate = async (itemId: string, newQuantity: number) => {
    setUpdatingItems(prev => new Set([...prev, itemId]));

    try {
      const success = await updateQuantity(itemId, newQuantity);

      if (!success && newQuantity > 0) {
        const item = items.find(i => i.id === itemId);
        if (item) {
          toast.error(`Only ${item.maxStock || 0} items available for ${item.title}`);
        } else {
          toast.error('Not enough stock available');
        }
      }
    } catch (error) {
      toast.error('Failed to update quantity');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleClearCart = async () => {
    if (items.length === 0) return;

    const confirmed = window.confirm(`Are you sure you want to remove all ${itemCount} ${itemCount === 1 ? 'item' : 'items'} from your cart?`);

    if (confirmed) {
      await clearCart();
      toast.success('Cart cleared successfully');
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeCart}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-lg font-medium text-black">
                          Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center space-x-3">
                          {items.length > 0 && (
                            <button
                              type="button"
                              className="text-xs font-medium text-gray-500 hover:text-black transition-colors underline"
                              onClick={handleClearCart}
                            >
                              Clear All
                            </button>
                          )}
                          <button
                            type="button"
                            className="-m-2 p-2 text-black hover:text-gray-700"
                            onClick={closeCart}
                          >
                            <X className="h-6 w-6" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-8">
                        <div className="flow-root">
                          <AnimatePresence>
                            {items.length === 0 ? (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-12"
                              >
                                <ShoppingBag className="mx-auto h-12 w-12 text-black mb-4" />
                                <p className="text-black mb-6">Your cart is empty</p>
                                <Button onClick={closeCart}>
                                  <Link to="/products">Continue Shopping</Link>
                                </Button>
                              </motion.div>
                            ) : (
                              <ul className="-my-6 divide-y divide-gray-200">
                                {items.map((item) => (
                                  <motion.li
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    className="flex py-6"
                                  >
                                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden border border-gray-200 rounded-md">
                                      {item.image ? (
                                        <img
                                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${item.image}`}
                                          alt={item.title}
                                          className="h-full w-full object-cover object-center"
                                        />
                                      ) : (
                                        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                                          <ShoppingBag className="h-8 w-8 text-black" />
                                        </div>
                                      )}
                                    </div>

                                    <div className="ml-4 flex flex-1 flex-col">
                                      <div>
                                        <div className="flex justify-between text-sm font-medium text-black">
                                          <h3 className="text-sm">{item.title}</h3>
                                          <p className="ml-4 text-sm">LKR {(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-600">
                                          {[item.variant.color, item.variant.size].filter(Boolean).join(' • ')}
                                        </p>
                                        {/* Stock warning */}
                                        {item.maxStock !== undefined && (
                                          item.maxStock === 0 ? (
                                            <p className="text-xs text-red-600 font-medium mt-1">
                                              Out of stock
                                            </p>
                                          ) : item.maxStock <= 10 && item.maxStock < item.quantity ? (
                                            <p className="text-xs text-red-600 font-medium mt-1">
                                              Only {item.maxStock} available
                                            </p>
                                          ) : item.maxStock <= 10 ? (
                                            <p className="text-xs text-orange-600 font-medium mt-1">
                                              Only {item.maxStock} left
                                            </p>
                                          ) : null
                                        )}
                                      </div>
                                      <div className="flex flex-1 items-end justify-between text-xs">
                                        <div className="flex items-center space-x-1">
                                          <button
                                            onClick={() => handleQuantityUpdate(item.id, item.quantity - 1)}
                                            disabled={updatingItems.has(item.id)}
                                            className="p-1 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                                          >
                                            <Minus className="h-3 w-3" />
                                          </button>
                                          <span className="mx-2 font-medium text-xs min-w-[24px] text-center">
                                            {updatingItems.has(item.id) ? '...' : item.quantity}
                                          </span>
                                          <button
                                            onClick={() => handleQuantityUpdate(item.id, item.quantity + 1)}
                                            disabled={updatingItems.has(item.id)}
                                            className="p-1 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                                          >
                                            <Plus className="h-3 w-3" />
                                          </button>
                                        </div>

                                        <div className="flex">
                                          <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
                                          >
                                            Remove
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.li>
                                ))}
                              </ul>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    {items.length > 0 && (
                      <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                        {/* Notice about cart items not being reserved */}
                        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                          <p className="text-xs text-gray-800">
                            Items in your cart are not reserved and may become unavailable during checkout.
                          </p>
                        </div>

                        <div className="flex justify-between text-base font-medium text-brand-dark">
                          <p>Subtotal</p>
                          <p>LKR {total.toLocaleString()}</p>
                        </div>
                        <p className="mt-0.5 text-sm text-black">Shipping calculated at checkout.</p>
                        <div className="mt-6">
                          {user ? (
                            <Link to="/checkout">
                              <Button fullWidth onClick={closeCart}>
                                Checkout
                              </Button>
                            </Link>
                          ) : (
                            <div className="space-y-3">
                              <p className="text-sm text-black text-center">
                                Please sign in to continue to checkout
                              </p>
                              <Button fullWidth onClick={closeCart}>
                                Sign In to Checkout
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="mt-6 flex justify-center text-center text-sm text-black">
                          <p>
                            or{' '}
                            <button
                              type="button"
                              className="font-medium text-brand-accent hover:text-brand-secondary"
                              onClick={closeCart}
                            >
                              Continue Shopping
                              <span aria-hidden="true"> &rarr;</span>
                            </button>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default CartDrawer;