import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentCancelPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to checkout with cancel message
    navigate('/checkout?cancelled=true', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      <p className="ml-4">Redirecting...</p>
    </div>
  );
};

export default PaymentCancelPage;