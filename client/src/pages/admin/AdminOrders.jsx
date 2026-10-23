import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Download, 
  ExternalLink, 
  Printer, 
  Building2, 
  FileCheck, 
  FileText, 
  CheckCircle2, 
  Eye, 
  ShieldCheck,
  Truck
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { downloadInvoicePDF, openInvoicePDF } from '../../utils/invoiceService';
import CourierWaybillModal from '../../components/CourierWaybillModal';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [waybillOrder, setWaybillOrder] = useState(null);
  const [confirmationNotice, setConfirmationNotice] = useState(null);

  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch orders. Please check your admin privileges.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getReceiptUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${API_BASE_URL.replace('/api', '')}${url}`;
  };

  const handleStatusChange = async (orderId, newOrderStatus, newPaymentStatus) => {
    setUpdatingId(orderId);
    try {
      await axios.put(
        `${API_BASE_URL}/admin/orders/${orderId}/status`,
        { orderStatus: newOrderStatus, paymentStatus: newPaymentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          orderStatus: newOrderStatus,
          paymentStatus: newPaymentStatus,
        });
      }
      fetchOrders();
    } catch (err) {
      alert('Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmPayment = async (orderId) => {
    setUpdatingId(orderId);
    setConfirmationNotice(null);
    try {
      await axios.put(
        `${API_BASE_URL}/admin/orders/${orderId}/status`,
        { paymentStatus: 'Completed', orderStatus: 'Processing' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          paymentStatus: 'Completed',
          orderStatus: selectedOrder.orderStatus === 'Pending' ? 'Processing' : selectedOrder.orderStatus,
        });
      }
      setConfirmationNotice('Payment confirmed successfully. Order status updated to Processing.');
      setTimeout(() => setConfirmationNotice(null), 4000);
      await fetchOrders();
    } catch (err) {
      alert('Failed to confirm payment status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/export/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ennigma-orders-export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export orders CSV');
    }
  };

  const handleOpenInvoice = (orderId) => {
    openInvoicePDF(orderId);
  };

  const handleDownloadInvoice = async (orderId) => {
    await downloadInvoicePDF(orderId);
  };

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <div>
          <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Fulfillment Center</span>
          <h1 className="text-2xl font-serif tracking-tight text-gray-900 mt-1">Order Status & Dispatch</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleExportCSV}
            className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Export Orders CSV
          </button>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{orders.length} Total Orders</span>
        </div>
      </div>
      
      {loading ? (
        <div className="py-12 text-center text-sm font-sans text-gray-500">Loading order queue...</div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 text-sm">{error}</div>
      ) : (
        <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[10px] uppercase font-bold tracking-widest text-gray-400">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer & Contact</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {orders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50/50">
                    <td className="py-4 px-4 font-mono font-bold text-gray-900">
                      #{order._id.substring(18)}
                      <span className="block text-[10px] text-gray-400 font-sans font-normal">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-gray-900">{order.guestName || (order.user && order.user.name) || 'Guest'}</div>
                      <div className="text-[11px] text-gray-500">{order.guestEmail || (order.user && order.user.email)}</div>
                      <div className="text-[10px] text-gray-400">{order.shippingAddress?.city}, {order.shippingAddress?.country}</div>
                    </td>
                    <td className="py-4 px-4 font-medium text-gray-800">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="font-semibold text-gray-900">{order.paymentMethod}</span>
                        {order.transferReceipt?.url && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-xs">
                            <FileCheck size={11} className="text-emerald-600" /> Slip Uploaded
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={order.paymentStatus || 'Pending'}
                        onChange={(e) => handleStatusChange(order._id, order.orderStatus, e.target.value)}
                        disabled={updatingId === order._id}
                        className={`border p-1 text-xs rounded font-medium focus:border-black focus:outline-none ${
                          order.paymentStatus === 'Completed' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' 
                            : 'bg-white border-gray-200 text-gray-700'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={order.orderStatus || 'Pending'}
                        onChange={(e) => handleStatusChange(order._id, e.target.value, order.paymentStatus)}
                        disabled={updatingId === order._id}
                        className="border border-gray-200 p-1 text-xs rounded bg-white font-medium focus:border-black focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 font-bold text-gray-900">LKR {order.total ? order.total.toLocaleString('en-US') : '0'}</td>
                    <td className="py-4 px-4 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-xs text-black font-bold uppercase tracking-wider hover:underline cursor-pointer"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => setWaybillOrder(order)}
                        title="Generate Printable Courier Waybill"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-900 bg-gray-100 hover:bg-black hover:text-white px-2 py-1 rounded-xs transition-colors cursor-pointer"
                      >
                        <Truck size={12} /> Waybill
                      </button>
                      <button
                        onClick={() => handleOpenInvoice(order._id)}
                        title="Open Invoice PDF in Browser Tab"
                        className="text-xs text-blue-600 underline font-semibold hover:text-blue-900 cursor-pointer"
                      >
                        PDF
                      </button>
                      <button
                        onClick={() => handleDownloadInvoice(order._id)}
                        title="Download Invoice File"
                        className="text-xs text-gray-500 hover:text-black cursor-pointer"
                      >
                        <Download size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-400 font-sans">No orders recorded in the system.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-2xl w-full p-6 sm:p-8 rounded-sm shadow-2xl relative border border-gray-100 max-h-[92vh] overflow-y-auto font-sans">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block">
                  Atelier Fulfillment Details
                </span>
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                  Order #{selectedOrder._id}
                  {selectedOrder.paymentMethod === 'Bank Transfer' && (
                    <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-xs font-mono font-normal">
                      Bank Transfer
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-black font-bold text-lg p-1 cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Notification alert */}
            {confirmationNotice && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-sm mb-4 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                {confirmationNotice}
              </div>
            )}

            <div className="space-y-6 text-xs font-sans">
              {/* Customer and Address */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-sm border border-gray-100">
                <div>
                  <span className="font-bold uppercase tracking-wider text-gray-500 text-[10px] block mb-1">
                    Customer Info
                  </span>
                  <p className="font-bold text-gray-900">{selectedOrder.guestName || (selectedOrder.user && selectedOrder.user.name) || 'Anonymous'}</p>
                  <p className="text-gray-600">{selectedOrder.guestEmail || (selectedOrder.user && selectedOrder.user.email)}</p>
                  {selectedOrder.guestPhone && <p className="text-gray-500 font-mono mt-1">Tel: {selectedOrder.guestPhone}</p>}
                </div>
                <div>
                  <span className="font-bold uppercase tracking-wider text-gray-500 text-[10px] block mb-1">
                    Delivery Address
                  </span>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedOrder.shippingAddress?.street}<br />
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zip}<br />
                    {selectedOrder.shippingAddress?.country || 'Sri Lanka'}
                  </p>
                </div>
              </div>

              {/* Fund Transfer Confirmation Slip Section */}
              {selectedOrder.transferReceipt ? (
                <div className="bg-amber-50/60 border border-amber-200/90 rounded-sm p-4.5 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-amber-800" />
                      <span className="font-bold uppercase tracking-wider text-amber-950 text-xs">
                        Fund Transfer Confirmation Slip
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      selectedOrder.paymentStatus === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                    }`}>
                      {selectedOrder.paymentStatus === 'Completed' ? '✓ Verified & Paid' : 'Verification Required'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedOrder.transferReceipt.fileType?.includes('pdf') || selectedOrder.transferReceipt.filename?.endsWith('.pdf') ? (
                        <div className="w-14 h-14 bg-red-100 text-red-700 border border-red-200 rounded flex flex-col items-center justify-center flex-shrink-0">
                          <FileText size={22} />
                          <span className="text-[9px] font-bold uppercase mt-0.5">PDF SLIP</span>
                        </div>
                      ) : (
                        <a
                          href={getReceiptUrl(selectedOrder.transferReceipt.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open Full Image"
                        >
                          <img
                            src={getReceiptUrl(selectedOrder.transferReceipt.url)}
                            alt="Receipt Preview"
                            className="w-14 h-14 object-cover rounded border border-gray-300 hover:opacity-80 transition-opacity cursor-pointer shadow-xs"
                          />
                        </a>
                      )}

                      <div>
                        <p className="font-bold text-gray-900 text-xs truncate max-w-[260px]">
                          {selectedOrder.transferReceipt.originalName || selectedOrder.transferReceipt.filename}
                        </p>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          Format: <strong className="text-gray-800">{selectedOrder.transferReceipt.fileType?.includes('pdf') ? 'PDF Document' : 'Image File'}</strong>
                          {selectedOrder.transferReceipt.size ? ` • ${(selectedOrder.transferReceipt.size / 1024).toFixed(1)} KB` : ''}
                        </p>
                        {selectedOrder.transferReceipt.uploadedAt && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Uploaded: {new Date(selectedOrder.transferReceipt.uploadedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <a
                        href={getReceiptUrl(selectedOrder.transferReceipt.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-gray-800 transition-colors shadow-xs cursor-pointer"
                      >
                        <Eye size={13} /> View / Read Slip
                      </a>
                    </div>
                  </div>

                  {/* Inline visual preview if image file */}
                  {!selectedOrder.transferReceipt.fileType?.includes('pdf') && !selectedOrder.transferReceipt.filename?.endsWith('.pdf') && (
                    <div className="pt-2 border-t border-amber-200/50">
                      <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                        High-Resolution Slip Preview:
                      </span>
                      <div className="max-h-64 overflow-hidden rounded border border-gray-200 bg-white/60 p-1 flex items-center justify-center">
                        <img
                          src={getReceiptUrl(selectedOrder.transferReceipt.url)}
                          alt="Slip Large Preview"
                          className="max-h-60 w-auto object-contain rounded"
                        />
                      </div>
                    </div>
                  )}

                  {/* Payment Confirmation Control Inside Section */}
                  <div className="pt-3 border-t border-amber-200/60 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-700">
                      Bank Transfer Verification:
                    </span>
                    {selectedOrder.paymentStatus !== 'Completed' ? (
                      <button
                        type="button"
                        onClick={() => handleConfirmPayment(selectedOrder._id)}
                        disabled={updatingId === selectedOrder._id}
                        className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} /> Confirm Payment &amp; Mark Paid
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-3 py-1 rounded">
                        <CheckCircle2 size={13} className="text-emerald-700" /> Payment Confirmed by Admin
                      </span>
                    )}
                  </div>
                </div>
              ) : selectedOrder.paymentMethod === 'Bank Transfer' ? (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-sm text-xs text-amber-900 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-amber-700" />
                  Bank Transfer selected, but no confirmation slip was uploaded by customer.
                </div>
              ) : null}

              {/* Items List */}
              <div>
                <span className="font-bold uppercase tracking-wider text-gray-500 text-[10px] block mb-2">
                  Purchased Items ({selectedOrder.items?.length || 0})
                </span>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-sm">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-10 h-12 object-cover rounded-sm border border-gray-200" />
                        )}
                        <div>
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <p className="text-[10px] text-gray-500">Size: {item.size || 'M'} &nbsp;•&nbsp; Qty: {item.qty}</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-gray-900">
                        LKR {((item.price || 0) * (item.qty || 1)).toLocaleString('en-US')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Totals */}
              <div className="bg-gray-50 p-4 rounded-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-[11px] text-gray-500">Payment: <strong className="text-gray-900">{selectedOrder.paymentMethod}</strong> ({selectedOrder.paymentStatus})</p>
                  <p className="text-[11px] text-gray-500">Status: <strong className="text-gray-900">{selectedOrder.orderStatus}</strong></p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Total Amount</span>
                  <span className="text-base font-bold font-mono text-gray-900">
                    LKR {(selectedOrder.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
                <div>
                  {selectedOrder.paymentStatus !== 'Completed' && (
                    <button
                      type="button"
                      onClick={() => handleConfirmPayment(selectedOrder._id)}
                      disabled={updatingId === selectedOrder._id}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 uppercase font-bold tracking-wider text-[11px] rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} /> Confirm Payment
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWaybillOrder(selectedOrder)}
                    className="bg-stone-900 text-white px-3.5 py-2 uppercase font-bold tracking-wider text-[11px] hover:bg-black transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Truck size={13} /> Print Waybill
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenInvoice(selectedOrder._id)}
                    className="bg-black text-white px-3.5 py-2 uppercase font-bold tracking-wider text-[11px] hover:bg-gray-800 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer size={13} /> Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadInvoice(selectedOrder._id)}
                    className="border border-black text-black px-3.5 py-2 uppercase font-bold tracking-wider text-[11px] hover:bg-black hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Download size={13} /> Download
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="border border-gray-300 px-4 py-2 uppercase font-bold tracking-wider text-[11px] hover:border-black transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Dispatch Waybill Modal */}
      <CourierWaybillModal
        isOpen={!!waybillOrder}
        onClose={() => setWaybillOrder(null)}
        order={waybillOrder}
      />
    </div>
  );
};

export default AdminOrders;
