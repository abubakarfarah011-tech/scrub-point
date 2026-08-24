import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { ShieldAlert, ShieldCheck, Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(false);

    if (!email || !password) {
      setError('Both email and password input fields are required.');
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/admin/dashboard');
      } else {
        setError(result.message || 'Invalid email or password.');
        setLoading(false);
      }
    } catch (err) {
      setError('Could not connect to the backend server. Make sure python app.py is running!');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-medical-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full border border-medical-100 overflow-hidden">

        <div className="bg-medical-900 p-6 text-center text-white flex flex-col items-center">
          <div className="p-3 bg-white/10 rounded-full mb-2">
            <ShieldCheck className="h-8 w-8 text-medical-100" />
          </div>
          <h2 className="text-2xl font-bold tracking-wide">SCRUB POINT ADMIN</h2>
          <p className="text-xs text-medical-100 mt-1 uppercase tracking-widest font-semibold">
            Secure Management Access Gateway
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded flex items-start space-x-2 animate-pulse">
              <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <span className="text-sm text-red-700 font-medium">{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@scrubpoint.co.ke"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-slate-800 focus:outline-none focus:border-medical-500 focus:bg-white transition-colors duration-200"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-12 py-2.5 text-slate-800 focus:outline-none focus:border-medical-500 focus:bg-white transition-colors duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-medical-500 cursor-pointer focus:outline-none"
                title={showPassword ? 'Hide Password Text' : 'Show Password Text'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-medical-500 hover:bg-medical-600 text-white font-bold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 focus:outline-none disabled:bg-slate-300 cursor-pointer"
          >
            <span>{loading ? 'Verifying Session Credentials...' : 'Login'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
