import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Shield, Trash2, Search, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMsg, setActionMsg] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    try {
      const { data } = await axios.get(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch users. Make sure you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    try {
      await axios.put(
        `${API_BASE_URL}/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActionMsg({ type: 'success', text: `User role successfully updated to ${newRole}` });
      fetchUsers();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update user role' });
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete account for "${userName}"? This cannot be undone.`)) {
      return;
    }

    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    try {
      await axios.delete(`${API_BASE_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActionMsg({ type: 'success', text: `User "${userName}" has been deleted.` });
      fetchUsers();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete user' });
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery))
  );

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const customerCount = users.filter((u) => u.role === 'customer').length;

  if (loading) {
    return (
      <div className="py-24 text-center min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="animate-spin text-gray-400" size={32} />
        <span className="text-xs uppercase font-bold tracking-widest text-gray-500">Loading User Directory...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">User Administration</span>
          <h1 className="text-3xl font-serif text-gray-900 mt-1">ENNIGMA User Management</h1>
          <p className="text-xs text-gray-500 mt-1">View registered members, assign permissions, and maintain accounts.</p>
        </div>
        <button
          onClick={fetchUsers}
          className="self-start md:self-auto inline-flex items-center gap-2 border border-gray-300 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} /> Refresh List
        </button>
      </div>

      {/* Action Banner */}
      {actionMsg && (
        <div
          className={`p-4 rounded-sm border text-xs font-medium ${
            actionMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {actionMsg.text}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-black text-white rounded-full">
            <Users size={20} />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-gray-400">Total Registered</span>
            <p className="text-2xl font-serif font-bold text-gray-900">{totalUsers}</p>
          </div>
        </div>

        <div className="bg-white p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-700 text-white rounded-full">
            <UserCheck size={20} />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-gray-400">Customers</span>
            <p className="text-2xl font-serif font-bold text-gray-900">{customerCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-900 text-white rounded-full">
            <Shield size={20} />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-gray-400">Administrators</span>
            <p className="text-2xl font-serif font-bold text-gray-900">{adminCount}</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 border border-gray-100 shadow-sm">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="pl-10 pr-4 py-2.5 w-full border border-gray-200 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-black transition-colors"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 uppercase text-[10px] text-gray-400 tracking-wider border-b border-gray-200">
              <tr>
                <th className="p-4">User Details</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Role</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold uppercase text-xs">
                          {user.name ? user.name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <strong className="text-gray-900 font-bold block">{user.name}</strong>
                          <span className="text-[10px] text-gray-400 font-mono">ID: {user._id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 font-medium">{user.email}</td>
                    <td className="p-4 text-gray-500">{user.phone || '—'}</td>
                    <td className="p-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className={`text-[11px] font-bold uppercase py-1 px-2.5 rounded border cursor-pointer focus:outline-none ${
                          user.role === 'admin'
                            ? 'bg-purple-50 text-purple-900 border-purple-200'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        }`}
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(user._id, user.name)}
                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors inline-flex items-center gap-1 font-bold text-[11px] uppercase tracking-wider"
                        title="Delete User"
                      >
                        <Trash2 size={15} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    No users matching "{searchQuery}" found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
