import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { KeyRound, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function AdminProfile() {
  const { admin } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');

    if (newPassword.length < 6) {
      setErr('Security requirements unmet: New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr('Validation mismatch: Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${admin.token}`
        },
        body: JSON.stringify({ password: newPassword })
      });
      const json = await response.json();
      if (json.success) {
        setMsg('Security credentials rotated and saved successfully!');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErr(json.message || 'Failed to update security row.');
      }
    } catch (error) {
      setErr('Could not complete authorization handshake with the server.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-6 bg-slate-100 font-sans text-slate-800 space-y-6 max-w-xl">

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b">
          <KeyRound className="h-5 w-5 text-medical-500" />
          <div>
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-700">Account Security Panel</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Rotate your workspace authorization passwords regularly</p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border space-y-1.5 text-xs text-slate-600 font-medium">
          <div><span className="font-black text-slate-400 uppercase tracking-wide">Active Session Email:</span> <span className="text-slate-800 font-bold">{admin?.email}</span></div>
          <div><span className="font-black text-slate-400 uppercase tracking-wide">Privilege Clearence Rank:</span> <span className="text-medical-600 font-bold uppercase tracking-wider">{admin?.role}</span></div>
        </div>

        {msg && <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded text-xs text-emerald-700 font-bold flex items-center space-x-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> <span>{msg}</span></div>}
        {err && <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-xs text-red-700 font-bold flex items-center space-x-2"><ShieldAlert className="h-4 w-4 shrink-0 text-red-500" /> <span>{err}</span></div>}

        <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="block font-black uppercase text-slate-500 tracking-wide flex items-center space-x-1">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <span>New Credentials Password</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters long"
              className="w-full bg-slate-50 border rounded-xl p-3 text-slate-800 focus:outline-none focus:border-medical-500 shadow-sm font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-black uppercase text-slate-500 tracking-wide flex items-center space-x-1">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <span>Confirm Password Choice</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type your password choice"
              className="w-full bg-slate-50 border rounded-xl p-3 text-slate-800 focus:outline-none focus:border-medical-500 shadow-sm font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-medical-500 hover:bg-medical-600 text-white font-black uppercase text-xs tracking-wider py-3.5 rounded-xl transition-colors shadow-sm cursor-pointer disabled:bg-slate-300"
          >
            {loading ? 'Rotating Credentials Row Hash...' : 'Update Security Password'}
          </button>
        </form>
      </div>

    </div>
  );
}
