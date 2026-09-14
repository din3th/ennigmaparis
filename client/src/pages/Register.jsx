import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, User, Phone, CheckCircle2, ArrowRight } from 'lucide-react';

import { API_BASE_URL } from '../config/api';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(`${API_BASE_URL}/users/register`, {
        name,
        email,
        phone,
        password,
      });

      // Save user session
      localStorage.setItem('userInfo', JSON.stringify(data));
      localStorage.setItem('token', data.token);

      setSuccessMsg(true);

      setTimeout(() => {
        navigate('/');
        window.location.reload();
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 border border-gray-100 shadow-xl rounded-sm">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400">
            JOIN THE MAISON
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-gray-900 uppercase tracking-widest">
            Create Account
          </h2>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Register to enjoy personalized service, order tracking, and exclusive previews.
          </p>
        </div>

        {/* Success Alert */}
        {successMsg ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-sm text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Account Created Successfully!</h3>
            <p className="text-xs text-emerald-700 leading-relaxed">
              A confirmation welcome email has been sent to <strong>{email}</strong>.
            </p>
            <p className="text-[11px] text-gray-400 italic">Redirecting to home page...</p>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-2 border-red-500 text-red-700 p-3 text-xs">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tharusha Dineth"
                  className="pl-10 block w-full border border-gray-200 py-3 text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Email Address *
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

            {/* Phone */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Phone size={16} />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+94 77 123 4567"
                  className="pl-10 block w-full border border-gray-200 py-3 text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Password *
              </label>
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

            {/* Confirm Password */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? 'Creating Account...' : (
                <>
                  Register Account <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-500">Already registered with us? </span>
              <Link to="/login" className="text-xs font-bold text-black hover:underline uppercase tracking-wider ml-1">
                Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;
