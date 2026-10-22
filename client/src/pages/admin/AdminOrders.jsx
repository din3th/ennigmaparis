import { useState, useEffect } from 'react';
import axios from 'axios';

import { API_BASE_URL } from '../../config/api';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  const handleStatusChange = async (orderId, newOrderStatus, newPaymentStatus) => {
    setUpdatingId(orderId);
    try {
      await axios.put(
        `${API_BASE_URL}/admin/orders/${orderId}/status`,
        { orderStatus: newOrderStatus, paymentStatus: newPaymentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
    } catch (err) {
      alert('Failed to update order status');
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

  const handleDownloadInvoice = (orderId) => {
    window.open(`${API_BASE_URL}/orders/${orderId}/invoice`, '_blank');
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
                      {order.paymentMethod}
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={order.paymentStatus || 'Pending'}
                        onChange={(e) => handleStatusChange(order._id, order.orderStatus, e.target.value)}
                        disabled={updatingId === order._id}
                        className="border border-gray-200 p-1 text-xs rounded bg-white font-medium focus:border-black focus:outline-none"
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
                    <td className="py-4 px-4 flex items-center gap-3">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-xs text-black font-bold uppercase tracking-wider hover:underline cursor-pointer"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => handleDownloadInvoice(order._id)}
                        className="text-xs text-blue-600 underline font-semibold hover:text-blue-900 cursor-pointer"
                      >
                        PDF
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
          <div className="bg-white max-w-xl w-full p-6 sm:p-8 rounded-sm shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block">
                  Atelier Fulfillment Details
                </span>
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">
                  Order #{selectedOrder._id}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-black font-bold text-lg p-1"
              >
                ×
              </button>
            </div>

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

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleDownloadInvoice(selectedOrder._id)}
                  className="bg-black text-white px-5 py-2 uppercase font-bold tracking-wider text-[11px] hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Download Invoice PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="border border-gray-300 px-5 py-2 uppercase font-bold tracking-wider text-[11px] hover:border-black transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
