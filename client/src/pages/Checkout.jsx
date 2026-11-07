import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { API_BASE_URL } from '../config/api';
import { getCurrentUser } from '../utils/auth';
import { startOnlinePayment, ONLINE_METHODS } from '../utils/payments';
import { usePricing, formatMoney } from '../hooks/useApi';
import { ContactDetails, ShippingAddress } from '../components/checkout/ContactAndAddress';
import PaymentOptions from '../components/checkout/PaymentOptions';
import OrderSummary from '../components/checkout/OrderSummary';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const { data: pricing } = usePricing();
  const currency = pricing?.currency || 'LKR';

  const [contact, setContact] = useState({
    email: currentUser?.email || '',
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
  });
  const [shippingAddress, setShippingAddress] = useState(
    currentUser?.address?.street
      ? currentUser.address
      : { street: '', city: '', state: 'Western', zip: '', country: 'Sri Lanka' }
  );
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [transferReceipt, setTransferReceipt] = useState(null);

  const [discountInput, setDiscountInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState(null);
  const [discountSuccess, setDiscountSuccess] = useState(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Display-only estimate; the server recomputes everything when the order is placed.
  const discountAmount = appliedDiscount?.discountAmount || 0;
  const shippingPrice = cartTotal > (pricing?.freeShippingThreshold ?? 150) ? 0 : (pricing?.flatShippingRate ?? 15);
  const grandTotal = Math.max(0, cartTotal - discountAmount + shippingPrice);

  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) return;
    setApplyingDiscount(true);
    setDiscountError(null);
    setDiscountSuccess(null);
    try {
      const { data } = await axios.post(`${API_BASE_URL}/discounts/validate`, { code: discountInput, cartTotal });
      setAppliedDiscount(data);
      setDiscountSuccess(`Code "${data.code}" applied — you save ${formatMoney(data.discountAmount, currency)}`);
    } catch (err) {
      setDiscountError(err.response?.data?.message || 'Failed to validate discount code');
      setAppliedDiscount(null);
    } finally {
      setApplyingDiscount(false);
    }
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return setError('Your cart is empty');

    if (paymentMethod === 'Bank Transfer' && !transferReceipt) {
      setError('Please upload your bank transfer slip before completing your order.');
      document.getElementById('receipt-upload-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Only ids, sizes and quantities are sent; the server sets every price.
      const { data: order } = await axios.post(`${API_BASE_URL}/orders`, {
        orderItems: cartItems.map((i) => ({ product: i.product, qty: i.qty, size: i.size })),
        shippingAddress,
        paymentMethod,
        transferReceipt: paymentMethod === 'Bank Transfer' ? transferReceipt : null,
        discountCode: appliedDiscount?.code || undefined,
        guestEmail: contact.email,
        guestName: contact.name,
        guestPhone: contact.phone,
      });

      clearCart();

      if (ONLINE_METHODS.includes(paymentMethod)) {
        try {
          await startOnlinePayment(order);
          return; // browser is navigating to the gateway
        } catch (payErr) {
          // The order exists; the customer can retry payment from the order page.
          navigate(`/order/${order._id}?payment=error`, {
            state: { paymentError: payErr.response?.data?.message || 'Could not start the online payment.' },
          });
          return;
        }
      }

      navigate(`/order/${order._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="py-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-3xl font-serif tracking-tight mb-4">Your Bag is Empty</h2>
        <p className="text-gray-500 mb-8 font-sans">Add pieces to your bag before checking out.</p>
        <button onClick={() => navigate('/shop')}
          className="bg-black text-white px-8 py-3 text-xs uppercase font-bold tracking-widest hover:bg-gray-800 transition-colors">
          Return to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="text-center mb-12">
        <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Secure Checkout</span>
        <h1 className="text-3xl font-serif tracking-tight uppercase text-gray-900 mt-1">ENNIGMA PARIS</h1>
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-8 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-10">
          <form onSubmit={submitOrder} id="checkout-form" className="space-y-8">
            <ContactDetails contact={contact} onChange={(e) => setContact({ ...contact, [e.target.name]: e.target.value })} />
            <ShippingAddress address={shippingAddress} onChange={(e) => setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value })} />
            <PaymentOptions
              method={paymentMethod}
              onMethodChange={setPaymentMethod}
              bankTransferProps={{ grandTotal, currency, reference: contact.name, receipt: transferReceipt, onReceiptChange: setTransferReceipt }}
            />
            <button type="submit" disabled={loading}
              className="w-full bg-black text-white py-4 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer shadow-md">
              {loading
                ? 'Processing Order…'
                : `${ONLINE_METHODS.includes(paymentMethod) ? 'Continue to Payment' : 'Complete Order'} — ${formatMoney(grandTotal, currency)}`}
            </button>
          </form>
        </div>

        <div className="lg:col-span-5">
          <OrderSummary
            cartItems={cartItems}
            currency={currency}
            subtotal={cartTotal}
            shippingPrice={shippingPrice}
            discount={appliedDiscount}
            grandTotal={grandTotal}
            discountInput={discountInput}
            onDiscountInputChange={setDiscountInput}
            onApplyDiscount={handleApplyDiscount}
            applyingDiscount={applyingDiscount}
            discountError={discountError}
            discountSuccess={discountSuccess}
          />
        </div>
      </div>
    </div>
  );
};

export default Checkout;
