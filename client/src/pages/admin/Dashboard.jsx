import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:3001/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Discount Codes state
  const [discounts, setDiscounts] = useState([]);
  const [newCode, setNewCode] = useState({ code: '', discountType: 'percentage', value: 10, minSpend: 50 });
  const [discountMsg, setDiscountMsg] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [statsRes, discountsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/stats`, config),
        axios.get(`${API_BASE_URL}/discounts`, config),
      ]);

      setStats(statsRes.data);
      setDiscounts(discountsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data. Please make sure you are logged in as admin.');
      setLoading(false);
    }
  };

  const handleCreateDiscount = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    try {
      await axios.post(
        `${API_BASE_URL}/discounts`,
        newCode,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDiscountMsg('Discount code created successfully!');
      setNewCode({ code: '', discountType: 'percentage', value: 10, minSpend: 50 });
      fetchDashboardData();
    } catch (err) {
      setDiscountMsg(err.response?.data?.message || 'Error creating discount code');
    }
  };

  const handleDeleteDiscount = async (id) => {
    if (!window.confirm('Delete this discount code?')) return;
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    try {
      await axios.delete(`${API_BASE_URL}/discounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (err) {
      alert('Failed to delete discount code');
    }
  };

  if (loading) return <div className="py-24 text-center min-h-[60vh]">Loading Admin Dashboard...</div>;

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <div>
          <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Executive Suite</span>
          <h1 className="text-3xl font-serif tracking-tight text-gray-900 mt-1">ENNIGMA Analytics & Operations</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/products" className="bg-black text-white px-4 py-2 text-xs uppercase font-bold tracking-wider hover:bg-gray-800 transition-colors">
            Manage Products
          </Link>
          <Link to="/admin/orders" className="border border-black text-black px-4 py-2 text-xs uppercase font-bold tracking-wider hover:bg-black hover:text-white transition-colors">
            Manage Orders
          </Link>
          <Link to="/admin/users" className="bg-purple-900 text-white px-4 py-2 text-xs uppercase font-bold tracking-wider hover:bg-purple-800 transition-colors">
            Manage Users
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 text-sm">{error}</div>}

      {stats && (
        <>
          {/* Key Metrics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm">
              <span className="text-xs uppercase tracking-widest font-bold text-gray-400">Total Revenue</span>
              <p className="text-2xl font-serif text-gray-900 mt-2">LKR {stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <span className="text-[11px] text-green-600 font-medium">From completed orders</span>
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm">
              <span className="text-xs uppercase tracking-widest font-bold text-gray-400">Total Orders</span>
              <p className="text-2xl font-serif text-gray-900 mt-2">{stats.totalOrders}</p>
              <span className="text-[11px] text-amber-600 font-medium">{stats.pendingOrdersCount} Pending fulfillment</span>
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm">
              <span className="text-xs uppercase tracking-widest font-bold text-gray-400">Catalog Count</span>
              <p className="text-2xl font-serif text-gray-900 mt-2">{stats.totalProducts} Items</p>
              <span className="text-[11px] text-gray-500 font-medium">Active product models</span>
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm">
              <span className="text-xs uppercase tracking-widest font-bold text-gray-400">Inventory Alert</span>
              <p className="text-2xl font-serif text-red-600 mt-2">{stats.outOfStockProducts}</p>
              <span className="text-[11px] text-red-500 font-medium">Out of stock items</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Recent Orders Overview */}
            <div className="lg:col-span-7 bg-white border border-gray-100 p-6 rounded-sm shadow-sm">
              <h2 className="text-xs font-bold tracking-widest uppercase text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                <span>Recent Orders</span>
                <Link to="/admin/orders" className="text-[10px] text-gray-400 hover:text-black uppercase">View All →</Link>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 uppercase text-[10px] text-gray-400 tracking-wider">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-sans">
                    {stats.recentOrders && stats.recentOrders.length > 0 ? (
                      stats.recentOrders.map((ord) => (
                        <tr key={ord._id} className="hover:bg-gray-50/50">
                          <td className="p-3 font-mono font-bold text-gray-900">{ord._id.substring(18)}</td>
                          <td className="p-3">{ord.guestName || (ord.user && ord.user.name) || 'Guest'}</td>
                          <td className="p-3 font-medium text-gray-900">LKR {ord.total ? ord.total.toLocaleString('en-US') : '0'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${ord.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {ord.orderStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="p-4 text-center text-gray-400">No orders logged yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Discount Codes Manager */}
            <div className="lg:col-span-5 bg-white border border-gray-100 p-6 rounded-sm shadow-sm space-y-6">
              <h2 className="text-xs font-bold tracking-widest uppercase text-gray-900 pb-2 border-b border-gray-100">
                Discount Code Manager
              </h2>

              <form onSubmit={handleCreateDiscount} className="space-y-3 bg-gray-50 p-4 border border-gray-100 rounded-sm">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-700">Create New Voucher</span>
                <input
                  type="text"
                  placeholder="Code (e.g. PARIS15)"
                  value={newCode.code}
                  onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                  required
                  className="w-full border border-gray-200 p-2 text-xs uppercase font-mono"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newCode.discountType}
                    onChange={(e) => setNewCode({ ...newCode, discountType: e.target.value })}
                    className="border border-gray-200 p-2 text-xs bg-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Value"
                    value={newCode.value}
                    onChange={(e) => setNewCode({ ...newCode, value: Number(e.target.value) })}
                    required
                    className="border border-gray-200 p-2 text-xs"
                  />
                </div>
                {discountMsg && <p className="text-[11px] text-green-700 font-medium">{discountMsg}</p>}
                <button
                  type="submit"
                  className="w-full bg-black text-white py-2 text-xs font-bold uppercase tracking-wider hover:bg-gray-800"
                >
                  Create Code
                </button>
              </form>

              {/* List of active codes */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Active Promotional Codes</span>
                {discounts.map((disc) => (
                  <div key={disc._id} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 text-xs rounded-sm">
                    <div>
                      <strong className="font-mono text-gray-900">{disc.code}</strong> — {disc.discountType === 'percentage' ? `${disc.value}% OFF` : `$${disc.value} OFF`}
                      <span className="block text-[10px] text-gray-400">Min Spend: ${disc.minSpend}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteDiscount(disc._id)}
                      className="text-red-600 hover:text-red-800 text-[10px] uppercase font-bold"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
