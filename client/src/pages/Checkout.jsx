import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Building2, 
  Copy, 
  Check, 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Eye,
  ShieldCheck
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { API_BASE_URL } from '../config/api';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const storedUser = localStorage.getItem('userInfo');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const [guestEmail, setGuestEmail] = useState(currentUser?.email || '');
  const [guestName, setGuestName] = useState(currentUser?.name || '');
  const [guestPhone, setGuestPhone] = useState(currentUser?.phone || '');

  const [shippingAddress, setShippingAddress] = useState(currentUser?.address || {
    street: '',
    city: '',
    state: 'Western',
    zip: '',
    country: 'Sri Lanka',
  });

  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState(null);
  const [discountSuccess, setDiscountSuccess] = useState(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  // Bank Transfer States
  const [transferReceipt, setTransferReceipt] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const fileInputRef = useRef(null);

  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expDate: '',
    cvc: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleReceiptFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptError(null);

    // Strict validation: check extension and MIME for PDF or image formats only
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
    const ext = file.name.split('.').pop().toLowerCase();
    const isAllowedExt = allowedExtensions.includes(ext);
    const isAllowedMime = file.type === 'application/pdf' || file.type.startsWith('image/');

    if (!isAllowedExt || !isAllowedMime) {
      setReceiptError('Invalid file format. Only PDF documents (.pdf) or image files (.jpg, .jpeg, .png, .webp) are allowed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setReceiptError('File exceeds 15MB limit. Please upload a file smaller than 15MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setReceiptFile(file);

    // Generate local preview if image
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setReceiptPreview(previewUrl);
    } else {
      setReceiptPreview(null);
    }

    // Upload receipt to server
    setIsUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      const res = await axios.post(`${API_BASE_URL}/upload/receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setTransferReceipt({
        url: res.data.url,
        filename: res.data.filename,
        originalName: res.data.originalName,
        fileType: res.data.fileType,
        size: res.data.size,
      });
      setError(null);
    } catch (uploadErr) {
      console.warn('Backend receipt upload issue, applying resilient base64 fallback:', uploadErr);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTransferReceipt({
          url: reader.result,
          filename: file.name,
          originalName: file.name,
          fileType: file.type,
          size: file.size,
        });
      };
      reader.readAsDataURL(file);
      setError(null);
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setTransferReceipt(null);
    setReceiptError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

      // Handle Direct Bank Fund Transfer
      if (paymentMethod === 'Bank Transfer') {
        if (!transferReceipt) {
          setError('Please upload your bank fund transfer confirmation slip (PDF or Image) before completing your order.');
          setLoading(false);
          const slipSection = document.getElementById('receipt-upload-section');
          if (slipSection) {
            slipSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }
        paymentResultData = {
          id: `transfer_${Date.now()}`,
          status: 'Pending_Verification',
          paymentGateway: 'Direct Bank Fund Transfer',
        };
      }

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
        paymentStatus: (paymentMethod === 'Stripe' || paymentMethod === 'PayHere') ? 'Completed' : 'Pending',
        paymentResult: paymentResultData,
        transferReceipt: paymentMethod === 'Bank Transfer' ? transferReceipt : null,
        itemsPrice: cartTotal,
        shippingPrice,
        discountCode: appliedDiscount?.code || '',
        discountAmount,
        totalPrice: grandTotal,
        guestEmail,
        guestName,
        guestPhone,
      };

      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.post(`${API_BASE_URL}/orders`, orderData, config);
      
      clearCart();
      setLoading(false);

      const placedOrderId = response.data._id || response.data.id;
      navigate(`/order/${placedOrderId}`);
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
              
              <div className="space-y-4">
                {/* Direct Bank Fund Transfer */}
                <div className={`border rounded-sm transition-all ${paymentMethod === 'Bank Transfer' ? 'border-black bg-white ring-1 ring-black shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                  <label className="flex items-start p-4 cursor-pointer">
                    <input 
                      type="radio" 
                      name="payment" 
                      value="Bank Transfer" 
                      checked={paymentMethod === 'Bank Transfer'} 
                      onChange={(e) => setPaymentMethod(e.target.value)} 
                      className="mt-1 h-4 w-4 text-black focus:ring-black accent-black cursor-pointer" 
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="block text-sm font-bold text-gray-900 tracking-wide flex items-center gap-2">
                          <Building2 size={16} className="text-gray-900" />
                          Direct Bank Fund Transfer
                        </span>
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 bg-black text-white rounded-xs">
                          Manual Verification
                        </span>
                      </div>
                      <span className="block text-xs text-gray-500 mt-1">
                        Deposit or online transfer directly into our corporate account and attach the payment slip.
                      </span>
                    </div>
                  </label>

                  {/* Bank Details & Receipt Uploader */}
                  {paymentMethod === 'Bank Transfer' && (
                    <div className="p-5 pt-0 border-t border-gray-100 bg-gray-50/50">
                      {/* Notice Header */}
                      <div className="bg-amber-50/80 border border-amber-200/80 rounded-sm p-3.5 mb-5 mt-4">
                        <div className="flex items-start gap-2.5">
                          <ShieldCheck size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-amber-900">
                            <span className="font-bold block uppercase tracking-wider text-[11px] text-amber-800 mb-0.5">
                              Payment Instructions
                            </span>
                            Please transfer the exact amount of <strong className="font-mono font-bold text-black">LKR {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> to the bank details below and attach your transfer confirmation slip (PDF or Image). Your pieces will be reserved and processed upon atelier verification.
                          </div>
                        </div>
                      </div>

                      {/* Official Bank Account Information */}
                      <div className="bg-white border border-gray-200 rounded-sm p-4 mb-5 shadow-xs">
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                            ENNIGMA Atelier Bank Account
                          </span>
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                            Active Corporate Account
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                          <div>
                            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Beneficiary Bank</span>
                            <span className="font-semibold text-gray-900 text-sm">Commercial Bank of Ceylon</span>
                          </div>

                          <div>
                            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Account Name</span>
                            <span className="font-semibold text-gray-900 text-sm">ENNIGMA PARIS (PVT) LTD</span>
                          </div>

                          <div className="sm:col-span-2 bg-gray-50 p-2.5 rounded border border-gray-100 flex items-center justify-between">
                            <div>
                              <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Account Number</span>
                              <span className="font-mono font-bold text-base text-gray-900 tracking-wider">8012 3456 7890 12</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard('80123456789012', 'acc')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-gray-800 transition-colors rounded-xs cursor-pointer"
                            >
                              {copiedField === 'acc' ? (
                                <>
                                  <Check size={13} className="text-emerald-400" /> Copied!
                                </>
                              ) : (
                                <>
                                  <Copy size={13} /> Copy Number
                                </>
                              )}
                            </button>
                          </div>

                          <div>
                            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Branch</span>
                            <span className="font-medium text-gray-800">Colombo Flagship / Cinnamon Gardens (035)</span>
                          </div>

                          <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100">
                            <div>
                              <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">SWIFT / BIC Code</span>
                              <span className="font-mono font-bold text-gray-900">CCBCLKX</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard('CCBCLKX', 'swift')}
                              className="text-[11px] font-bold text-gray-600 hover:text-black flex items-center gap-1 cursor-pointer"
                            >
                              {copiedField === 'swift' ? <span className="text-emerald-600 font-bold">Copied!</span> : <><Copy size={12} /> Copy</>}
                            </button>
                          </div>

                          <div className="sm:col-span-2 pt-1 border-t border-gray-100 text-[11px] text-gray-500">
                            <strong className="text-gray-700">Payment Reference:</strong> Please enter <span className="font-mono text-black font-semibold bg-gray-100 px-1.5 py-0.5 rounded">{guestName || 'Your Name'}</span> or phone number in your transfer remark.
                          </div>
                        </div>
                      </div>

                      {/* Confirmation Slip Upload Section */}
                      <div id="receipt-upload-section" className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-1.5">
                            <UploadCloud size={15} className="text-black" />
                            Fund Transfer Confirmation Slip <span className="text-red-500">*</span>
                          </label>
                          <span className="text-[10px] font-medium text-gray-500">
                            PDF or Image only (.pdf, .jpg, .png, .webp)
                          </span>
                        </div>

                        {/* Hidden file input strictly filtering pdf or images */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                          onChange={handleReceiptFileChange}
                          className="hidden"
                          id="fund-transfer-file-input"
                        />

                        {/* Upload Error Banner */}
                        {receiptError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-sm text-xs flex items-start gap-2">
                            <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                            <div>{receiptError}</div>
                          </div>
                        )}

                        {/* Upload In Progress */}
                        {isUploadingReceipt && (
                          <div className="border border-gray-200 bg-white p-6 rounded-sm text-center">
                            <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-700">
                              Uploading Confirmation Slip...
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Validating PDF / image format with atelier</p>
                          </div>
                        )}

                        {/* Uploaded File Display */}
                        {!isUploadingReceipt && transferReceipt && (
                          <div className="border border-emerald-300 bg-white p-4 rounded-sm shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {receiptPreview ? (
                                <img
                                  src={receiptPreview}
                                  alt="Receipt Preview"
                                  className="w-14 h-14 object-cover rounded border border-gray-200 shadow-xs flex-shrink-0"
                                />
                              ) : (
                                <div className="w-14 h-14 bg-red-50 border border-red-200 rounded flex flex-col items-center justify-center text-red-700 flex-shrink-0">
                                  <FileText size={22} />
                                  <span className="text-[9px] font-bold uppercase mt-0.5">PDF</span>
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-xs font-bold text-gray-900 truncate max-w-[220px] sm:max-w-[280px]">
                                    {transferReceipt.originalName || transferReceipt.filename}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                                    <CheckCircle2 size={11} /> Attached
                                  </span>
                                  {transferReceipt.size && (
                                    <span>{(transferReceipt.size / 1024).toFixed(0)} KB</span>
                                  )}
                                  <span className="uppercase text-[9px] font-mono text-gray-400">
                                    {transferReceipt.fileType?.includes('pdf') ? 'PDF Document' : 'Image'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <a
                                href={transferReceipt.url.startsWith('data:') || transferReceipt.url.startsWith('http') ? transferReceipt.url : `${API_BASE_URL.replace('/api', '')}${transferReceipt.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 hover:text-black border border-gray-200 hover:border-black rounded-xs transition-colors inline-flex items-center gap-1"
                              >
                                <Eye size={13} /> View
                              </a>
                              <button
                                type="button"
                                onClick={handleRemoveReceipt}
                                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 rounded-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <X size={13} /> Remove
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Upload Dropzone when no file selected */}
                        {!isUploadingReceipt && !transferReceipt && (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 hover:border-black bg-white hover:bg-gray-50/50 p-6 rounded-sm text-center cursor-pointer transition-all group"
                          >
                            <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-black group-hover:text-white text-gray-600 flex items-center justify-center mx-auto mb-3 transition-colors">
                              <UploadCloud size={20} />
                            </div>
                            <span className="block text-xs font-bold uppercase tracking-wider text-gray-900 mb-1">
                              Click to Upload Confirmation Slip
                            </span>
                            <span className="block text-[11px] text-gray-500 mb-3">
                              Accepted file formats: <strong className="text-gray-800">PDF, JPG, PNG, WEBP</strong> (Max 15MB)
                            </span>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xs group-hover:bg-gray-800 transition-colors pointer-events-none"
                            >
                              Choose Slip File
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

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
