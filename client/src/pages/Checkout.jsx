import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';

const API_BASE_URL = 'http://localhost:3001/api';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: 'Western',
    zip: '',
    country: 'Sri Lanka',
  });

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState(null);
  const [discountSuccess, setDiscountSuccess] = useState(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expDate: '',
    cvc: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddressChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handleApplyDiscount = async (e) => {
    e.preventDefault();
    if (!discountCodeInput.trim()) return;

    setIsApplyingDiscount(true);
    setDiscountError(null);
    setDiscountSuccess(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/discounts/validate`, {
        code: discountCodeInput,
        cartTotal,
      });

      setAppliedDiscount(response.data);
      setDiscountSuccess(`Discount code "${response.data.code}" applied! saved $${response.data.discountAmount}`);
    } catch (err) {
      console.error(err);
      setDiscountError(err.response?.data?.message || 'Failed to validate discount code');
      setAppliedDiscount(null);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const discountAmount = appliedDiscount ? appliedDiscount.discountAmount : 0;
  const shippingPrice = cartTotal > 150 ? 0 : 15;
  const grandTotal = Math.max(0, cartTotal - discountAmount + shippingPrice);

  const submitOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let paymentResultData = null;

      // Handle Stripe / Card Payment
      if (paymentMethod === 'Stripe') {
        const stripeRes = await axios.post(`${API_BASE_URL}/payments/stripe/create-intent`, {
          amount: grandTotal,
          currency: 'usd',
        });
        paymentResultData = {
          id: stripeRes.data.id,
          status: 'Completed',
          paymentGateway: 'Stripe',
        };
      }

      // Handle PayHere Payment
      if (paymentMethod === 'PayHere') {
        const payHereRes = await axios.post(`${API_BASE_URL}/payments/payhere/hash`, {
          orderId: `ORD-${Date.now()}`,
          amount: grandTotal,
          currency: 'USD',
        });
        paymentResultData = {
          id: `payhere_${payHereRes.data.order_id}`,
          status: 'Completed',
          paymentGateway: 'PayHere',
        };
      }

      // Handle Cash on Delivery (COD)
      if (paymentMethod === 'COD') {
        paymentResultData = {
          id: `cod_${Date.now()}`,
          status: 'Pending',
          paymentGateway: 'Cash on Delivery',
        };
      }

      const orderData = {
        orderItems: cartItems,
        shippingAddress,
        paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Completed',
        paymentResult: paymentResultData,
        itemsPrice: cartTotal,
        shippingPrice,
        discountCode: appliedDiscount?.code || '',
        discountAmount,
        totalPrice: grandTotal,
        guestEmail,
        guestName,
        guestPhone,
      };

      const response = await axios.post(`${API_BASE_URL}/orders`, orderData);
      
      clearCart();
      setLoading(false);

      alert(`Thank you for your order! Order #${response.data._id || response.data.id} has been placed successfully.`);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to place order. Please check your network connection.');
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="py-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-3xl font-serif tracking-tight mb-4">Your Bag is Empty</h2>
        <p className="text-gray-500 mb-8 font-sans">Add luxury pieces to your cart before checking out.</p>
        <button 
          onClick={() => navigate('/shop')} 
          className="bg-black text-white px-8 py-3 text-xs uppercase font-bold tracking-widest hover:bg-gray-800 transition-colors"
        >
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
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-8 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Contact & Shipping Details */}
        <div className="lg:col-span-7 space-y-10">
          <form onSubmit={submitOrder} id="checkout-form" className="space-y-8">
            {/* Contact Details */}
            <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm">
              <h2 className="text-xs font-bold tracking-widest uppercase text-gray-900 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center">1</span>
                Contact Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email Address *</label>
                  <input 
                    type="email" 
                    placeholder="email@example.com" 
                    value={guestEmail} 
                    onChange={(e) => setGuestEmail(e.target.value)} 
                    required 
                    className="w-full border border-gray-200 p-3 text-sm focus:border-black focus:outline-none transition-colors" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                  <input 
                    type="text" 
                    placeholder="First & Last Name" 
                    value={guestName} 
                    onChange={(e) => setGuestName(e.target.value)} 
                    required 
                    className="w-full border border-gray-200 p-3 text-sm focus:border-black focus:outline-none transition-colors" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input 
                    type="tel" 
                    placeholder="+94 7X XXX XXXX" 
                    value={guestPhone} 
                    onChange={(e) => setGuestPhone(e.target.value)} 
                    required 
                    className="w-full border border-gray-200 p-3 text-sm focus:border-black focus:outline-none transition-colors" 
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm">
              <h2 className="text-xs font-bold tracking-widest uppercase text-gray-900 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center">2</span>
                Shipping Address
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Street Address *</label>
                  <input 
                    type="text" 
                    name="street" 
                    placeholder="House number and street name" 
                    value={shippingAddress.street} 
                    onChange={handleAddressChange} 
                    required 
                    className="w-full border border-gray-200 p-3 text-sm focus:border-black focus:outline-none transition-colors" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                    <input 
                      type="text" 
                      name="city" 
                      placeholder="City" 
                      value={shippingAddress.city} 
                      onChange={handleAddressChange} 
                      required 
                      className="w-full border border-gray-200 p-3 text-sm focus:border-black focus:outline-none transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State / Province *</label>
                    <select 
                      name="state" 
                      value={shippingAddress.state || 'Western'} 
                      onChange={handleAddressChange} 
                      required 
                      className="w-full border border-gray-200 p-3 text-sm focus:border-black focus:outline-none transition-colors bg-white font-medium"
                    >
                      <option value="Western">Western Province</option>
                      <option value="Central">Central Province</option>
                      <option value="Southern">Southern Province</option>
                      <option value="North Western">North Western Province</option>
                      <option value="North Central">North Central Province</option>
                      <option value="Sabaragamuwa">Sabaragamuwa Province</option>
                      <option value="Uva">Uva Province</option>
                      <option value="Eastern">Eastern Province</option>
                      <option value="Northern">Northern Province</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Postal Code *</label>
                    <input 
                      type="text" 
                      name="zip" 
                      placeholder="Zip Code" 
                      value={shippingAddress.zip} 
                      onChange={handleAddressChange} 
                      required 
                      className="w-full border border-gray-200 p-3 text-sm focus:border-black focus:outline-none transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                    <input 
                      type="text" 
                      name="country" 
                      value={shippingAddress.country} 
                      readOnly 
                      className="w-full border border-gray-100 bg-gray-50 p-3 text-sm text-gray-500" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm">
              <h2 className="text-xs font-bold tracking-widest uppercase text-gray-900 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center">3</span>
                Payment Options
              </h2>
              
              <div className="space-y-3">
                {/* Cash on Delivery */}
                <label className={`flex items-start p-4 border rounded-sm cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-black bg-gray-50/50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="COD" 
                    checked={paymentMethod === 'COD'} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                    className="mt-1 h-4 w-4 text-black focus:ring-black" 
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-semibold text-gray-900">Cash on Delivery (COD)</span>
                    <span className="block text-xs text-gray-500 mt-0.5">Pay in cash directly upon physical package delivery.</span>
                  </div>
                </label>

                {/* Stripe Credit / Debit Card */}
                <label className={`flex items-start p-4 border rounded-sm cursor-pointer transition-all ${paymentMethod === 'Stripe' ? 'border-black bg-gray-50/50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="Stripe" 
                    checked={paymentMethod === 'Stripe'} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                    className="mt-1 h-4 w-4 text-black focus:ring-black" 
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="block text-sm font-semibold text-gray-900">Credit / Debit Card (Stripe)</span>
                      <div className="flex gap-1 text-[10px] font-bold text-gray-400">
                        <span className="border px-1 border-gray-200">VISA</span>
                        <span className="border px-1 border-gray-200">MC</span>
                        <span className="border px-1 border-gray-200">AMEX</span>
                      </div>
                    </div>
                    <span className="block text-xs text-gray-500 mt-0.5">Instant online payment secured by Stripe 256-bit SSL.</span>

                    {paymentMethod === 'Stripe' && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                        <input 
                          type="text" 
                          placeholder="Card Number (4242 4242 4242 4242)" 
                          value={cardDetails.cardNumber}
                          onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                          className="w-full border border-gray-200 p-2.5 text-xs focus:border-black focus:outline-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            placeholder="MM / YY" 
                            value={cardDetails.expDate}
                            onChange={(e) => setCardDetails({ ...cardDetails, expDate: e.target.value })}
                            className="w-full border border-gray-200 p-2.5 text-xs focus:border-black focus:outline-none"
                          />
                          <input 
                            type="text" 
                            placeholder="CVC" 
                            value={cardDetails.cvc}
                            onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                            className="w-full border border-gray-200 p-2.5 text-xs focus:border-black focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </label>

                {/* PayHere Payment Gateway */}
                <label className={`flex items-start p-4 border rounded-sm cursor-pointer transition-all ${paymentMethod === 'PayHere' ? 'border-black bg-gray-50/50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="PayHere" 
                    checked={paymentMethod === 'PayHere'} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                    className="mt-1 h-4 w-4 text-black focus:ring-black" 
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-semibold text-gray-900">PayHere (Online Banking & Cards)</span>
                    <span className="block text-xs text-gray-500 mt-0.5">Pay via PayHere online checkout gateway.</span>
                  </div>
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-black text-white py-4 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
            >
              {loading ? 'Processing Order...' : `Complete Order — LKR ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            </button>
          </form>
        </div>

        {/* Order Summary & Promotional Code */}
        <div className="lg:col-span-5">
          <div className="bg-gray-50 border border-gray-100 p-6 rounded-sm sticky top-8 space-y-6">
            <h2 className="text-xs font-bold tracking-widest uppercase text-gray-900 pb-3 border-b border-gray-200">
              Bag Summary ({cartItems.length})
            </h2>

            {/* Item List */}
            <ul className="divide-y divide-gray-200 max-h-80 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <li key={`${item.product}-${item.size}`} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="h-14 w-12 object-cover border border-gray-200 rounded-sm bg-white" 
                    />
                    <div>
                      <h3 className="text-xs font-semibold text-gray-900 uppercase font-heading">{item.name}</h3>
                      <p className="text-[11px] text-gray-500">Size: {item.size} | Qty: {item.qty}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-900">LKR {(item.price * item.qty).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </li>
              ))}
            </ul>

            {/* Discount Code Form */}
            <div className="border-t border-b border-gray-200 py-4">
              <label className="block text-xs font-bold tracking-wider uppercase text-gray-700 mb-2">
                Promotional Code / Voucher
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. PARIS10, PARIS20"
                  value={discountCodeInput}
                  onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
                  className="flex-1 border border-gray-300 p-2.5 text-xs focus:border-black focus:outline-none uppercase font-mono tracking-wider"
                />
                <button
                  onClick={handleApplyDiscount}
                  disabled={isApplyingDiscount || !discountCodeInput}
                  className="bg-black text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isApplyingDiscount ? '...' : 'Apply'}
                </button>
              </div>

              {discountError && (
                <p className="mt-2 text-xs text-red-600 font-medium">{discountError}</p>
              )}
              {discountSuccess && (
                <p className="mt-2 text-xs text-green-700 font-medium">{discountSuccess}</p>
              )}
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2.5 text-xs text-gray-600 pt-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>LKR {cartTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span>{shippingPrice === 0 ? <strong className="text-green-700">FREE</strong> : `LKR ${shippingPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}</span>
              </div>

              {appliedDiscount && (
                <div className="flex justify-between text-green-700 font-medium">
                  <span>Discount ({appliedDiscount.code})</span>
                  <span>-LKR {discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between text-sm font-bold text-gray-900 uppercase">
                <span>Total</span>
                <span>LKR {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
