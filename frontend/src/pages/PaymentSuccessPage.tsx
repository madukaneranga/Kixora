import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowLeft } from 'lucide-react';
import ThankYouPopup from '../components/ui/ThankYouPopup';
import Button from '../components/ui/Button';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showThankYouPopup, setShowThankYouPopup] = useState(false);
  const [orderInfo, setOrderInfo] = useState<{
    total: number;
    paymentMethod: 'payhere' | 'bank' | 'cod';
    customerName: string;
  } | null>(null);

  useEffect(() => {
    // Check for pending order info from localStorage
    const pendingOrderInfo = localStorage.getItem('pendingOrderInfo');
    if (pendingOrderInfo) {
      try {
        const orderData = JSON.parse(pendingOrderInfo);
        localStorage.removeItem('pendingOrderInfo');

        // Redirect to thank you page with order data
        const thankYouUrl = `/thank-you?total=${orderData.total}&method=${orderData.paymentMethod}&name=${encodeURIComponent(orderData.customerName)}`;
        navigate(thankYouUrl);
      } catch (e) {
        console.error('Error parsing pending order info:', e);
        navigate('/');
      }
    } else {
      // If no pending order info, redirect to home
      setTimeout(() => navigate('/'), 3000);
    }
  }, [navigate]);

  const handleClosePopup = () => {
    setShowThankYouPopup(false);
    setOrderInfo(null);
    navigate('/orders');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Payment Successful!
        </h1>

        <p className="text-gray-600 mb-8">
          Your payment has been processed successfully. You will be redirected shortly.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => navigate('/orders')}
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            View My Orders
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </div>
      </motion.div>

      {/* Thank You Popup */}
      {orderInfo && (
        <ThankYouPopup
          isOpen={showThankYouPopup}
          onClose={handleClosePopup}
          orderTotal={orderInfo.total}
          paymentMethod={orderInfo.paymentMethod}
          customerName={orderInfo.customerName}
        />
      )}
    </div>
  );
};

export default PaymentSuccessPage;