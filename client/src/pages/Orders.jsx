import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Package, Download, Eye, ArrowRight, ShieldCheck, Clock, ExternalLink, Printer } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { downloadInvoicePDF, openInvoicePDF } from '../utils/invoiceService';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
  const storedUser = localStorage.getItem('userInfo');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchMyOrders = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API_BASE_URL}/orders/myorders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load user orders:', err);
        setError('Could not retrieve orders. Please check your network or try logging in again.');
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [token]);

  const handleOpenInvoice = (orderId, e) => {
    if (e) e.stopPropagation();
    openInvoicePDF(orderId);
  };

  const handleDownloadInvoice = async (orderId, e) => {
    if (e) e.stopPropagation();
    setDownloadingId(orderId);
    await downloadInvoicePDF(orderId);
    setDownloadingId(null);
  };

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <Package size={48} className="text-gray-300 mb-4" />
        <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-400 mb-2">
          Customer Portal
        </span>
        <h1 className="text-3xl font-serif uppercase tracking-widest text-gray-900 mb-3">
          My Order History
        </h1>
        <p className="text-xs text-gray-500 mb-8 max-w-sm font-sans">
          Please sign in to your ENNIGMA PARIS account to track shipments, inspect atelier receipts, and download official PDF invoices.
        </p>
        <div className="flex gap-4">
          <Link
            to="/login"
            className="bg-black text-white px-8 py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-sm"
          >
            Sign In Now
          </Link>
          <Link
            to="/register"
            className="border border-gray-300 text-gray-800 px-8 py-3.5 text-xs font-bold uppercase tracking-widest hover:border-black transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-[75vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-gray-200 gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-400">
            Account Management
          </span>
          <h1 className="text-3xl font-serif uppercase tracking-widest text-gray-900 mt-1">
            My Orders & Invoices
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-sans">
            Review past purchases, monitor live fulfillment, and retrieve official invoices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-black transition-colors"
          >
            Account Profile
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            to="/shop"
            className="bg-black text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
          >
            Explore Catalog
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-xs uppercase font-bold tracking-widest text-gray-500">
            Loading your orders...
          </span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 text-xs mb-6">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24 bg-gray-50/70 border border-gray-100 rounded-sm">
          <Package size={40} className="text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-serif uppercase tracking-widest text-gray-900 mb-1">
            No Orders Found
          </h2>
          <p className="text-xs text-gray-500 mb-6 font-sans">
            You haven't placed any orders with this account yet.
          </p>
          <Link
            to="/shop"
            className="inline-block bg-black text-white px-8 py-3 text-xs uppercase font-bold tracking-widest hover:bg-gray-800 transition-colors"
          >
            Shop The Collection
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const items = order.items || [];
            const orderStatus = order.orderStatus || 'Confirmed';
            return (
              <div
                key={order._id}
                className="bg-white border border-gray-200 rounded-sm shadow-sm hover:border-black/50 transition-all p-6"
              >
                {/* Order Top Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                      Order ID
                    </span>
                    <h3 className="font-mono text-sm font-bold text-gray-900">#{order._id}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-sans">
                      Placed on{' '}
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-sm ${
                        orderStatus === 'Delivered'
                          ? 'bg-green-100 text-green-800'
                          : orderStatus === 'Shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : orderStatus === 'Processing'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {orderStatus}
                    </span>

                    {/* PDF Open and Download Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleOpenInvoice(order._id, e)}
                        title="Open and Print Invoice in New Tab"
                        className="inline-flex items-center gap-1.5 border border-gray-300 hover:border-black text-gray-700 hover:text-black px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-sm"
                      >
                        <Printer size={13} />
                        <span className="hidden sm:inline">View</span>
                      </button>
                      <button
                        onClick={(e) => handleDownloadInvoice(order._id, e)}
                        disabled={downloadingId === order._id}
                        title="Download Invoice PDF File"
                        className="inline-flex items-center gap-1 border border-gray-300 hover:border-black text-gray-700 hover:text-black px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-sm disabled:opacity-50"
                      >
                        <Download size={13} />
                        <span className="hidden sm:inline">{downloadingId === order._id ? '...' : 'PDF'}</span>
                      </button>
                    </div>

                    {/* View Details Link */}
                    <Link
                      to={`/order/${order._id}`}
                      className="inline-flex items-center gap-1 bg-black text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors rounded-sm"
                    >
                      <Eye size={13} /> Details
                    </Link>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-8 flex flex-wrap gap-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-gray-50 p-2 rounded-sm border border-gray-100 pr-4">
                        <div className="w-10 h-12 bg-gray-200 overflow-hidden rounded-sm flex-shrink-0">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=200'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 truncate max-w-[180px]">{item.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">
                            Size: {item.size || 'M'} &nbsp;•&nbsp; Qty: {item.qty}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="md:col-span-4 text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                      Total Amount ({order.paymentMethod})
                    </span>
                    <span className="text-base font-bold font-mono text-gray-900">
                      LKR {(order.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
