import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

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
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleDownloadInvoice(order._id)}
                        className="text-xs text-blue-600 underline font-semibold hover:text-blue-900 cursor-pointer"
                      >
                        PDF Invoice
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
    </div>
  );
};

export default AdminOrders;
