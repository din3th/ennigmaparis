import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, Download, Package, ArrowRight, Truck, ShieldCheck, MapPin, ExternalLink, Printer } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { downloadInvoicePDF, openInvoicePDF } from '../utils/invoiceService';

const OrderSuccess = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API_BASE_URL}/orders/${id}`);
        setOrder(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching order receipt:', err);
        setError('Unable to load order receipt. Please check your order ID or contact customer support.');
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleDownload = async () => {
    setDownloading(true);
    await downloadInvoicePDF(id);
    setDownloading(false);
  };

  const handleView = () => {
    openInvoicePDF(id);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-24 px-4">
        <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs uppercase tracking-widest font-bold text-gray-500">
          Generating Atelier Receipt...
        </span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
          !
        </div>
        <h1 className="text-2xl font-serif uppercase tracking-widest text-gray-900 mb-2">Order Notice</h1>
        <p className="text-xs text-gray-500 mb-8 max-w-md">{error || 'Order could not be located.'}</p>
        <Link
          to="/shop"
          className="bg-black text-white px-8 py-3 text-xs uppercase font-bold tracking-widest hover:bg-gray-800 transition-colors"
        >
          Return to Collections
        </Link>
      </div>
    );
  }

  const items = order.items || [];
  const status = order.orderStatus || 'Confirmed';

  const steps = [
    { label: 'Confirmed', icon: CheckCircle2, active: true },
    { label: 'Atelier Preparation', icon: Package, active: ['Processing', 'Shipped', 'Delivered'].includes(status) },
    { label: 'Dispatched', icon: Truck, active: ['Shipped', 'Delivered'].includes(status) },
    { label: 'Delivered', icon: ShieldCheck, active: status === 'Delivered' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Top Celebratory Header */}
      <div className="text-center pb-12 border-b border-gray-100">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-black text-white rounded-full mb-5 shadow-lg">
          <CheckCircle2 size={32} className="text-white" />
        </div>
        <span className="block text-xs font-bold uppercase tracking-[0.3em] text-gray-400 mb-2">
          Merci Pour Votre Commande
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif uppercase tracking-widest text-gray-900 mb-3">
          Order Confirmed
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto font-sans leading-relaxed">
          Your order <span className="font-mono font-bold text-gray-900">#{order._id}</span> has been received by our atelier. A confirmation email with official invoice details has been dispatched.
        </p>

        {/* Action Buttons Header */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={handleView}
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-md cursor-pointer"
          >
            <Printer size={14} /> Open &amp; Print Invoice
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 border border-black text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download size={14} /> {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
          >
            View All My Orders
          </Link>
        </div>
      </div>

      {/* Fulfillment Status Stepper */}
      <div className="py-10 border-b border-gray-100">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 text-center mb-8">
          Delivery Status Tracker
        </h3>
        <div className="grid grid-cols-4 gap-2 text-center relative">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    st.active ? 'bg-black text-white shadow-sm' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Icon size={18} />
                </div>
                <span className={`text-[10px] sm:text-xs uppercase font-bold tracking-wider ${
                  st.active ? 'text-black' : 'text-gray-400'
                }`}>
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Summary Grid */}
      <div className="py-10 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-100">
        {/* Shipping Address & Contact */}
        <div className="bg-gray-50/70 p-6 rounded-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-gray-700" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">
              Delivery Destination
            </h3>
          </div>
          <p className="text-xs font-bold text-gray-900 mb-1">{order.guestName || 'Recipient'}</p>
          <p className="text-xs text-gray-600 leading-relaxed font-sans">
            {order.shippingAddress?.street}<br />
            {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}<br />
            {order.shippingAddress?.country || 'Sri Lanka'}
          </p>
          {order.guestPhone && (
            <p className="text-xs text-gray-500 font-mono mt-2">Phone: {order.guestPhone}</p>
          )}
          {order.guestEmail && (
            <p className="text-xs text-gray-500 font-sans mt-0.5">Email: {order.guestEmail}</p>
          )}
        </div>

        {/* Payment & Order Meta */}
        <div className="bg-gray-50/70 p-6 rounded-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={16} className="text-gray-700" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">
              Payment & Dispatch
            </h3>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Payment Method:</span>
            <span className="font-bold text-gray-900">{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-xs items-center">
            <span className="text-gray-500">Payment Status:</span>
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
              order.paymentStatus === 'Completed'
                ? 'bg-green-100 text-green-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {order.paymentStatus === 'Completed' ? 'Verified / Completed' : 'Pending Atelier Verification'}
            </span>
          </div>
          {order.transferReceipt && (
            <div className="flex justify-between text-xs items-center pt-1 border-t border-gray-200">
              <span className="text-gray-500">Confirmation Slip:</span>
              <a
                href={order.transferReceipt.url.startsWith('http') || order.transferReceipt.url.startsWith('data:') ? order.transferReceipt.url : `${API_BASE_URL.replace('/api', '')}${order.transferReceipt.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-black underline font-semibold text-[11px] hover:text-gray-600 inline-flex items-center gap-1"
              >
                View Uploaded Slip ↗
              </a>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Order Placed:</span>
            <span className="font-mono text-gray-700">
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Estimated Delivery:</span>
            <span className="text-gray-900 font-medium">2–4 Business Days (Express)</span>
          </div>
        </div>
      </div>

      {/* Bank Transfer Under Review Banner */}
      {order.paymentMethod === 'Bank Transfer' && order.paymentStatus !== 'Completed' && (
        <div className="mb-10 bg-amber-50/70 border border-amber-200 p-5 rounded-sm flex items-start gap-3">
          <ShieldCheck size={20} className="text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <h4 className="font-bold uppercase tracking-wider text-[11px] text-amber-800 mb-1">
              Bank Fund Transfer In Verification
            </h4>
            <p className="leading-relaxed text-amber-800">
              Thank you for uploading your fund transfer confirmation slip. Our treasury department is matching the transaction with Commercial Bank of Ceylon records. Your bespoke pieces are reserved and dispatch processing will commence as soon as verification completes.
            </p>
          </div>
        </div>
      )}

      {/* Itemized Order Table */}
      <div className="py-10">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-6">
          Curated Atelier Pieces ({items.length})
        </h3>
        <div className="divide-y divide-gray-100 border-t border-b border-gray-100">
          {items.map((item, idx) => (
            <div key={idx} className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-20 bg-gray-100 overflow-hidden rounded-sm flex-shrink-0 border border-gray-200">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-gray-900 font-serif">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-sans">
                    Size: <span className="font-medium text-black">{item.size || 'M'}</span> &nbsp;|&nbsp; Qty: <span className="font-medium text-black">{item.qty}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm font-bold text-gray-900 font-mono">
                  LKR {((item.price || 0) * (item.qty || 1)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-gray-400">
                  LKR {(item.price || 0).toLocaleString('en-US')} each
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Financial Summary */}
        <div className="mt-8 max-w-sm ml-auto space-y-2 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Items Subtotal:</span>
            <span className="font-mono">LKR {(order.itemsPrice || order.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-700 font-medium">
              <span>Discount ({order.discountCode || 'Applied'}):</span>
              <span className="font-mono">- LKR {order.discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Shipping & Courier:</span>
            <span className="font-mono">{order.shippingPrice > 0 ? `LKR ${order.shippingPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Complimentary'}</span>
          </div>
          <div className="flex justify-between text-sm sm:text-base font-bold text-gray-900 border-t border-gray-200 pt-3">
            <span className="uppercase tracking-widest font-serif">Total:</span>
            <span className="font-mono">LKR {(order.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="pt-8 text-center flex flex-wrap justify-center gap-4">
        <Link
          to="/shop"
          className="inline-flex items-center gap-1.5 text-xs uppercase font-bold tracking-widest text-black hover:text-gray-600 transition-colors"
        >
          Continue Shopping <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
