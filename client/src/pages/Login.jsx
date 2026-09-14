import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../config/api';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await axios.post(`${API_BASE_URL}/users/login`, {
        email,
        password,
      });

      // Store credentials
      localStorage.setItem('userInfo', JSON.stringify(data));
      localStorage.setItem('token', data.token);

      if (data.role === 'admin') {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminInfo', JSON.stringify(data));
      }

      navigate('/');
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 border border-gray-100 shadow-xl rounded-sm">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400">
            WELCOME BACK
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-gray-900 uppercase tracking-widest">
            Sign In
          </h2>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Access your order history, saved wishlist, and profile.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-2 border-red-500 text-red-700 p-3 text-xs">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="pl-10 block w-full border border-gray-200 py-3 text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700">
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 block w-full border border-gray-200 py-3 text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-black text-white py-3.5 px-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 group disabled:bg-gray-400"
          >
            {loading ? 'Signing In...' : (
              <>
                Sign In <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* Register Link */}
          <div className="text-center pt-4 border-t border-gray-100 space-y-2">
            <div>
              <span className="text-xs text-gray-500">Don't have an account yet? </span>
              <Link to="/register" className="text-xs font-bold text-black hover:underline uppercase tracking-wider ml-1">
                Create One
              </Link>
            </div>
            <div>
              <Link to="/admin/login" className="text-[10px] text-gray-400 hover:text-black uppercase tracking-wider">
                Admin Portal Login →
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
