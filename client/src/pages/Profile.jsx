import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, MapPin, Lock, CheckCircle2, Package, Heart } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const Profile = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token') || localStorage.getItem('adminToken');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: 'Western',
    zip: '',
    country: 'Sri Lanka',
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setName(data.name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        if (data.address) {
          setAddress(data.address);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load user profile data');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const handleAddressChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name,
        email,
        phone,
        address,
        ...(password ? { password } : {}),
      };

      const { data } = await axios.put(`${API_BASE_URL}/users/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update local storage
      const stored = localStorage.getItem('userInfo');
      const parsed = stored ? JSON.parse(stored) : {};
      localStorage.setItem('userInfo', JSON.stringify({ ...parsed, ...data }));

      setMessage('Your profile and address settings have been updated.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.message || 'Failed to update profile settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs uppercase font-bold tracking-widest text-gray-500">
          Loading Account Settings...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-[75vh]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-gray-200 gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-400">
            Account Preferences
          </span>
          <h1 className="text-3xl font-serif uppercase tracking-widest text-gray-900 mt-1">
            Personal Atelier Profile
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-sans">
            Manage your personal contact details, saved delivery address, and security credentials.
          </p>
        </div>

        {/* Quick Nav Shortcuts */}
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 border border-gray-300 hover:border-black px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-800 transition-colors"
          >
            <Package size={14} /> My Orders
          </Link>
          <Link
            to="/wishlist"
            className="inline-flex items-center gap-1.5 border border-gray-300 hover:border-black px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-800 transition-colors"
          >
            <Heart size={14} /> Wishlist
          </Link>
        </div>
      </div>

      {message && (
        <div className="bg-green-50 border-l-4 border-green-600 text-green-800 p-4 text-xs mb-8 flex items-center gap-2">
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 text-xs mb-8">
          {error}
        </div>
      )}

      <form onSubmit={handleProfileSubmit} className="space-y-10">
        {/* Contact Information */}
        <div className="bg-white p-6 sm:p-8 border border-gray-200 rounded-sm shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
            <User size={16} /> Contact Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 p-3 text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 p-3 text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Phone Number (For Courier Coordination)
              </label>
              <input
                type="tel"
                placeholder="+94 7X XXX XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-200 p-3 text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition-colors font-mono"
              />
            </div>
          </div>
        </div>

        {/* Default Shipping Address */}
        <div className="bg-white p-6 sm:p-8 border border-gray-200 rounded-sm shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
            <MapPin size={16} /> Default Shipping Address
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Street Address & Suite / Apartment
              </label>
              <input
                type="text"
                name="street"
                placeholder="e.g. 2a De Fonseka Rd"
                value={address.street || ''}
                onChange={handleAddressChange}
                className="w-full border border-gray-200 p-3 text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                City / Town
              </label>
              <input
                type="text"
                name="city"
                placeholder="Colombo"
                value={address.city || ''}
                onChange={handleAddressChange}
                className="w-full border border-gray-200 p-3 text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Province / State
              </label>
              <input
                type="text"
                name="state"
                placeholder="Western Province"
                value={address.state || ''}
                onChange={handleAddressChange}
                className="w-full border border-gray-200 p-3 text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Postal Code
              </label>
              <input
                type="text"
                name="zip"
                placeholder="00500"
                value={address.zip || ''}
                onChange={handleAddressChange}
                className="w-full border border-gray-200 p-3 text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={address.country || 'Sri Lanka'}
                onChange={handleAddressChange}
                className="w-full border border-gray-200 p-3 text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Change Password (Optional) */}
        <div className="bg-white p-6 sm:p-8 border border-gray-200 rounded-sm shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
            <Lock size={16} /> Security & Password (Optional)
          </h2>
          <p className="text-xs text-gray-400 mb-4 font-sans">
            Leave these fields blank if you do not wish to update your current password.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 p-3 text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-200 p-3 text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-black text-white px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-md disabled:bg-gray-400 cursor-pointer"
          >
            {saving ? 'Saving Changes...' : 'Save Profile Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
