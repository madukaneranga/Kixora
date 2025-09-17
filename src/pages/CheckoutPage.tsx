import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { ArrowLeft, Truck, Clock, CreditCard, Building, Phone, Banknote, DollarSign } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCartStore } from '../stores/cartStore';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { showErrorToast } from '../components/ui/CustomToast';
import logo from '../assests/logo.black.png';

const checkoutSchema = yup.object({
  country: yup.string().required('Country is required'),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  address: yup.string().required('Address is required'),
  apartment: yup.string(),
  city: yup.string().required('City is required'),
  postalCode: yup.string().required('Postal code is required'),
  phone: yup.string().required('Phone number is required'),
  countryCode: yup.string().required('Country code is required'),
  shippingMethod: yup.string().required('Please select a shipping method'),
  paymentMethod: yup.string().required('Please select a payment method'),
  sameAsBilling: yup.boolean(),
  billingFirstName: yup.string().when('sameAsBilling', {
    is: false,
    then: (schema) => schema.required('Billing first name is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  billingLastName: yup.string().when('sameAsBilling', {
    is: false,
    then: (schema) => schema.required('Billing last name is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  billingAddress: yup.string().when('sameAsBilling', {
    is: false,
    then: (schema) => schema.required('Billing address is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  billingCity: yup.string().when('sameAsBilling', {
    is: false,
    then: (schema) => schema.required('Billing city is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  billingPostalCode: yup.string().when('sameAsBilling', {
    is: false,
    then: (schema) => schema.required('Billing postal code is required'),
    otherwise: (schema) => schema.notRequired()
  })
});

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { items, clearCart } = useCartStore();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    resolver: yupResolver(checkoutSchema),
    defaultValues: {
      country: 'Sri Lanka',
      countryCode: '+94',
      shippingMethod: 'standard',
      paymentMethod: 'payhere',
      sameAsBilling: true
    }
  });

  const watchedShippingMethod = watch('shippingMethod');
  const watchedPaymentMethod = watch('paymentMethod');
  const watchedSameAsBilling = watch('sameAsBilling');

  useEffect(() => {
    // Check for payment cancellation
    if (searchParams.get('cancelled') === 'true') {
      showErrorToast('Payment was cancelled. Please try again or choose a different payment method.');
      // Remove the cancelled parameter from URL
      navigate('/checkout', { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    console.log('Checkout useEffect (signed in):', {
      authLoading,
      user: user ? { id: user.id, email: user.email } : null,
      itemsLength: items.length,
      items: items.map(item => ({ id: item.id, title: item.title, quantity: item.quantity }))
    });

    // Don't redirect while auth is still loading
    if (authLoading) {
      console.log('Checkout: Auth is loading, waiting...');
      return;
    }

    if (!user) {
      console.log('Checkout: No user, redirecting to home');
      navigate('/');
      return;
    }

    if (items.length === 0) {
      console.log('Checkout: Cart is empty, redirecting to home');
      navigate('/');
      return;
    }

    console.log('Checkout: All checks passed, staying on checkout page');
    // Pre-fill form with user data if available
    // Note: user email not used in this simplified checkout
  }, [user, authLoading, items, navigate, setValue]);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const getShippingCost = (method: string) => {
    if (method === 'standard') return 399;
    if (method === 'express') return 699;
    return 399;
  };
  const shipping = getShippingCost(watchedShippingMethod || 'standard');
  const total = subtotal + shipping;

  const countries = ['Sri Lanka', 'India', 'Maldives', 'Bangladesh'];
  const countryCodes = ['+94', '+91', '+960', '+880'];

  const onSubmit = async (formData: any) => {
    setLoading(true);

    try {
      // Create shipping address
      const shippingAddress = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        phone: formData.phone,
      };

      // Create billing address
      const billingAddress = formData.sameAsBilling ? shippingAddress : {
        firstName: formData.billingFirstName,
        lastName: formData.billingLastName,
        address: formData.billingAddress,
        city: formData.billingCity,
        postalCode: formData.billingPostalCode,
        phone: formData.phone,
      };

      // Prepare order items for database function
      const orderItems = items.map(item => ({
        variant_id: item.variantId,
        quantity: item.quantity,
        price: item.price,
        product_title: item.title,
        size: item.variant.size,
        color: item.variant.color,
        sku: item.variant.sku,
      }));

      // Create order with automatic stock management
      const { data: orderResult, error: orderError } = await supabase
        .rpc('create_order_with_stock_management', {
          p_user_id: user!.id,
          p_total: total,
          p_currency: 'LKR',
          p_payment_method: formData.paymentMethod,
          p_shipping_method: formData.shippingMethod,
          p_shipping_cost: shipping,
          p_shipping_address: shippingAddress,
          p_billing_address: billingAddress,
          p_order_items: orderItems,
        });

      if (orderError) throw orderError;

      const result = orderResult[0];
      if (!result.success) {
        throw new Error(result.error_message);
      }

      const order = { id: result.order_id };

      // Handle different payment methods
      if (formData.paymentMethod === 'payhere') {
        // Create payment with PayHere
        const paymentData = {
          orderId: order.id,
          amount: total,
          currency: 'LKR',
          customerInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: user?.email || '',
            phone: `${formData.countryCode}${formData.phone}`,
          },
          items: items.map(item => ({
            itemNumber: item.variant.sku,
            itemName: `${item.title} (${item.variant.color}, Size ${item.variant.size})`,
            amount: item.price,
            quantity: item.quantity,
          })),
        };

        // Use direct fetch to get better error details
        const session = (await supabase.auth.getSession()).data.session;

        if (!session?.access_token) {
          throw new Error('Authentication required. Please log in again.');
        }

        const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`;

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(paymentData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Payment function error (${response.status}): ${errorText}`);
        }

        const responseData = await response.json();

        if (!responseData.success) {
          throw new Error(responseData.error || 'Payment creation failed');
        }

        const { paymentData: payHereData, checkoutUrl } = responseData;

        // Update order with PayHere payment ID
        await supabase
          .from('orders')
          .update({
            payment_provider_id: payHereData.order_id || payHereData.merchant_id,
          })
          .eq('id', order.id);

        // Create a form and submit to PayHere
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = checkoutUrl;

        Object.keys(payHereData).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = payHereData[key];
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();

        // Store order info for when user returns from PayHere
        localStorage.setItem('pendingOrderInfo', JSON.stringify({
          total: total,
          paymentMethod: 'payhere',
          customerName: `${formData.firstName} ${formData.lastName}`,
          orderId: order.id,
        }));

        // Clear cart before redirecting to PayHere
        await clearCart();
      } else {
        // For bank transfer and COD, redirect to thank you page
        const thankYouUrl = `/thank-you?total=${total}&method=${formData.paymentMethod}&name=${encodeURIComponent(`${formData.firstName} ${formData.lastName}`)}&orderId=${order.id}`;

        // Navigate first, then clear cart to avoid useEffect interference
        navigate(thankYouUrl);

        // Clear cart after navigation
        setTimeout(async () => {
          await clearCart();
        }, 100);
      }

    } catch (error: any) {
      console.error('Checkout error:', error);
      showErrorToast(error.message || 'Failed to process checkout');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Redirect conditions are handled in useEffect
  if (!user || items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative py-6">
        {/* Continue Shopping - Top Left */}
        <div className="absolute left-4 top-6 sm:left-8">
          <Link
            to="/"
            className="flex items-center text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Continue Shopping</span>
          </Link>
        </div>

        {/* Logo - Center Top */}
        <div className="flex justify-center">
          <img
            src={logo}
            alt="Kixora"
            className="h-16 w-auto brightness-0 invert"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Forms */}
          <div className="space-y-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Delivery Section */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Delivery
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-2">
                      Country/Region
                    </label>
                    <select
                      {...register('country')}
                      className="w-full px-4 py-2.5 bg-black text-white border border-[rgb(51,51,51)] rounded-lg hover:border-[rgb(94,94,94)] focus:outline-none focus:border-white transition-colors"
                    >
                      {countries.map((country) => (
                        <option key={country} value={country} className="bg-black">{country}</option>
                      ))}
                    </select>
                    {errors.country && (
                      <p className="mt-2 text-sm text-red-400">{errors.country.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      variant="dark"
                      {...register('firstName')}
                      error={errors.firstName?.message}
                    />
                    <Input
                      label="Last Name"
                      variant="dark"
                      {...register('lastName')}
                      error={errors.lastName?.message}
                    />
                  </div>

                  <Input
                    label="Address"
                    variant="dark"
                    {...register('address')}
                    error={errors.address?.message}
                  />

                  <Input
                    label="Apartment, suite, etc. (optional)"
                    variant="dark"
                    {...register('apartment')}
                    error={errors.apartment?.message}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="City"
                      variant="dark"
                      {...register('city')}
                      error={errors.city?.message}
                    />
                    <Input
                      label="Postal Code"
                      variant="dark"
                      {...register('postalCode')}
                      error={errors.postalCode?.message}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-2">
                        Country Code
                      </label>
                      <select
                        {...register('countryCode')}
                        className="w-full px-4 py-2.5 bg-black text-white border border-[rgb(51,51,51)] rounded-lg hover:border-[rgb(94,94,94)] focus:outline-none focus:border-white transition-colors"
                      >
                        {countryCodes.map((code) => (
                          <option key={code} value={code} className="bg-black">{code}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Phone"
                      variant="dark"
                      {...register('phone')}
                      error={errors.phone?.message}
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Shipping Method
                </h2>
                <div className="border-2 border-[rgb(51,51,51)] rounded-lg overflow-hidden">
                  <label className={`relative flex items-center p-4 cursor-pointer transition-all duration-200 border-b border-[rgb(51,51,51)] last:border-b-0 ${
                    watchedShippingMethod === 'standard'
                      ? 'bg-white/5'
                      : 'hover:bg-white/2'
                  }`}>
                    <input
                      type="radio"
                      value="standard"
                      {...register('shippingMethod')}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      watchedShippingMethod === 'standard'
                        ? 'border-white'
                        : 'border-[rgb(94,94,94)]'
                    }`}>
                      {watchedShippingMethod === 'standard' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium flex items-center">
                            <Truck className="w-4 h-4 mr-2" />
                            Standard
                          </p>
                          <p className="text-[rgb(94,94,94)] text-sm">2-4 business days</p>
                        </div>
                        <p className="text-white font-medium">Rs 399</p>
                      </div>
                    </div>
                  </label>

                  <label className={`relative flex items-center p-4 cursor-pointer transition-all duration-200 ${
                    watchedShippingMethod === 'express'
                      ? 'bg-white/5'
                      : 'hover:bg-white/2'
                  }`}>
                    <input
                      type="radio"
                      value="express"
                      {...register('shippingMethod')}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      watchedShippingMethod === 'express'
                        ? 'border-white'
                        : 'border-[rgb(94,94,94)]'
                    }`}>
                      {watchedShippingMethod === 'express' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Express
                          </p>
                          <p className="text-[rgb(94,94,94)] text-sm">Within Colombo</p>
                        </div>
                        <p className="text-white font-medium">Rs 699</p>
                      </div>
                    </div>
                  </label>
                </div>
                {errors.shippingMethod && (
                  <p className="mt-2 text-sm text-red-400">{errors.shippingMethod.message}</p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment
                </h2>
                <div className="border-2 border-[rgb(51,51,51)] rounded-lg overflow-hidden">
                  <label className={`relative flex items-center p-4 cursor-pointer transition-all duration-200 border-b border-[rgb(51,51,51)] ${
                    watchedPaymentMethod === 'payhere'
                      ? 'bg-white/5'
                      : 'hover:bg-white/2'
                  }`}>
                    <input
                      type="radio"
                      value="payhere"
                      {...register('paymentMethod')}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      watchedPaymentMethod === 'payhere'
                        ? 'border-white'
                        : 'border-[rgb(94,94,94)]'
                    }`}>
                      {watchedPaymentMethod === 'payhere' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 mr-3 text-white" />
                        <div>
                          <p className="text-white font-medium">PayHere</p>
                          <p className="text-[rgb(94,94,94)] text-sm">Credit/Debit Cards</p>
                        </div>
                      </div>
                      PayHere
<a href="https://www.payhere.lk" target="_blank"><img src="https://www.payhere.lk/downloads/images/payhere_short_banner.png" alt="PayHere" width="250"/></a>                    </div>
                  </label>

                  <label className={`relative flex items-center p-4 cursor-pointer transition-all duration-200 border-b border-[rgb(51,51,51)] ${
                    watchedPaymentMethod === 'bank'
                      ? 'bg-white/5'
                      : 'hover:bg-white/2'
                  }`}>
                    <input
                      type="radio"
                      value="bank"
                      {...register('paymentMethod')}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      watchedPaymentMethod === 'bank'
                        ? 'border-white'
                        : 'border-[rgb(94,94,94)]'
                    }`}>
                      {watchedPaymentMethod === 'bank' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Building className="w-4 h-4 mr-3 text-white" />
                      <div>
                        <p className="text-white font-medium">Bank Transfer</p>
                        <p className="text-[rgb(94,94,94)] text-sm">Direct bank transfer</p>
                      </div>
                    </div>
                  </label>

                  <label className={`relative flex items-center p-4 cursor-pointer transition-all duration-200 ${
                    watchedPaymentMethod === 'cod'
                      ? 'bg-white/5'
                      : 'hover:bg-white/2'
                  }`}>
                    <input
                      type="radio"
                      value="cod"
                      {...register('paymentMethod')}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      watchedPaymentMethod === 'cod'
                        ? 'border-white'
                        : 'border-[rgb(94,94,94)]'
                    }`}>
                      {watchedPaymentMethod === 'cod' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Banknote className="w-4 h-4 mr-3 text-white" />
                      <div>
                        <p className="text-white font-medium">Cash on Delivery</p>
                        <p className="text-[rgb(94,94,94)] text-sm">Pay when you receive</p>
                      </div>
                    </div>
                  </label>
                </div>
                {errors.paymentMethod && (
                  <p className="mt-2 text-sm text-red-400">{errors.paymentMethod.message}</p>
                )}
              </div>

              {/* Billing Address */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Billing Address
                </h2>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('sameAsBilling')}
                      onChange={(e) => {
                        setSameAsBilling(e.target.checked);
                        setValue('sameAsBilling', e.target.checked);
                      }}
                      className="mr-3 text-white accent-white"
                    />
                    <span className="text-white">Same as shipping address</span>
                  </label>

                  {!watchedSameAsBilling && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="First Name"
                          variant="dark"
                          {...register('billingFirstName')}
                          error={errors.billingFirstName?.message}
                        />
                        <Input
                          label="Last Name"
                          variant="dark"
                          {...register('billingLastName')}
                          error={errors.billingLastName?.message}
                        />
                      </div>
                      <Input
                        label="Address"
                        variant="dark"
                        {...register('billingAddress')}
                        error={errors.billingAddress?.message}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="City"
                          variant="dark"
                          {...register('billingCity')}
                          error={errors.billingCity?.message}
                        />
                        <Input
                          label="Postal Code"
                          variant="dark"
                          {...register('billingPostalCode')}
                          error={errors.billingPostalCode?.message}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Pay Now Button */}
              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="lg"
                className="bg-black text-white border-2 border-white hover:bg-white hover:text-black font-bold py-4 text-lg transition-colors duration-200 rounded-lg"
              >
                PAY NOW - LKR {total.toLocaleString()}
              </Button>
            </form>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <div className="border border-[rgb(51,51,51)] rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gray-800 rounded-lg flex-shrink-0">
                      {item.image && (
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${item.image}`}
                          alt={item.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white text-sm">{item.title}</h3>
                      <p className="text-sm text-gray-400">
                        {item.variant.color} • Size {item.variant.size}
                      </p>
                      <p className="text-sm text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-white">
                      LKR {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-[rgb(51,51,51)] pt-6 space-y-3">
                <div className="flex justify-between text-white">
                  <span>Subtotal</span>
                  <span>LKR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>Shipping</span>
                  <span>LKR {shipping.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xl font-semibold text-white pt-3 border-t border-[rgb(51,51,51)]">
                  <span>Total</span>
                  <span>LKR {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CheckoutPage;