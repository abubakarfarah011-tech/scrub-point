import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import {
  ShieldCheck, RefreshCw, BarChart3, TrendingUp, AlertTriangle, Users,
  Trash2, PlusCircle, Calendar, DollarSign, Target, Eye, EyeOff, ClipboardList, ShoppingBag
} from 'lucide-react';

export default function DashboardAnalytics() {
  const { admin } = useAuth();

const API_BASE_URL = import.meta.env.VITE_API_URL;

  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');

  const [analytics, setAnalytics] = useState(null);
  const [staff, setStaff] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Admin');
  const [showPassword, setShowPassword] = useState(false);
  const [formMsg, setFormMsg] = useState('');

  const loadAnalyticsCore = useCallback(async () => {
    if (!admin || !admin.token) return;
    setLoading(true);
    setError('');

    const requestHeaders = {
      "Authorization": `Bearer ${admin.token}`,
      "Content-Type": "application/json"
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/analytics?start_date=${startDate}&end_date=${endDate}`, { headers: requestHeaders });
      const json = await res.json();
      if (json.success) setAnalytics(json.data);

      if (admin.role === "Super Admin") {
        const staffRes = await fetch(`${API_BASE_URL}/api/admin/staff`, { headers: requestHeaders });
        const staffJson = await staffRes.json();
        if (staffJson.success) setStaff(staffJson.data || []);

        const auditRes = await fetch(`${API_BASE_URL}/api/admin/dashboard`, { headers: requestHeaders });
        const auditJson = await auditRes.json();
        if (auditJson.success && auditJson.data?.audit_logs) {
          setAuditLogs(auditJson.data.audit_logs);
        }
      }
    } catch (err) {
      setError('Could not reconcile server data metrics models records.');
    } finally {
      setLoading(false);
    }
  }, [admin, startDate, endDate, API_BASE_URL]);

  useEffect(() => {
  loadAnalyticsCore();
}, [loadAnalyticsCore]);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) {
      alert('Please fill out all mandatory credentials parameter fields.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/staff`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${admin.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim(), password: newPassword.trim(), role: newRole })
      });
      const json = await res.json();
      if (json.success) {
        setFormMsg('New admin account profile generated successfully!');
        setNewEmail('');
        setNewPassword('');
        setShowPassword(false);
        loadAnalyticsCore();
        setTimeout(() => setFormMsg(''), 4000);
      } else { alert(json.message); }
    } catch (err) { alert('Error generating staff profile credentials.'); }
  };

  const handlePurgeStaff = async (staffId) => {
    if (!window.confirm("Permanently strip this admin's access permissions and delete their account?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/staff/${staffId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${admin.token}` }
      });
      const json = await res.json();
      if (json.success) { loadAnalyticsCore(); } else { alert(json.message); }
    } catch (err) { alert('Error dropping staff row.'); }
  };

  return (
    <div className="space-y-8 p-6 bg-slate-100 min-h-screen text-slate-800 font-sans">

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center space-x-2.5">
          <Calendar className="h-5 w-5 text-medical-500" />
          <div>
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-700">Inbuilt Calendar Filters</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Adjust parameters to view specific timeline data snapshots</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center text-xs font-bold text-slate-500">
          <div className="flex items-center space-x-1.5">
            <span>From:</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-slate-50 border p-2 rounded-lg focus:outline-none focus:border-medical-500 text-slate-700 font-medium" />
          </div>
          <div className="flex items-center space-x-1.5">
            <span>To:</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-slate-50 border p-2 rounded-lg focus:outline-none focus:border-medical-500 text-slate-700 font-medium" />
          </div>
          <button onClick={loadAnalyticsCore} className="p-2 bg-slate-50 border hover:bg-medical-50 hover:text-medical-600 rounded-lg transition-colors cursor-pointer">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && !analytics ? (
        <div className="py-20 text-center font-semibold text-slate-400 flex items-center justify-center space-x-2"><RefreshCw className="animate-spin h-5 w-5 text-medical-500" /> <span>Compiling financial matrix intelligence...</span></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Gross Revenue Yield</span>
                <h3 className="text-2xl font-black text-slate-800">KES {analytics?.financials?.total_revenue?.toLocaleString()}</h3>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" />+{analytics?.financials?.growth_percentage}% vs prev period</span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl"><DollarSign className="h-5 w-5" /></div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Operational Profit Margin</span>
                <h3 className="text-2xl font-black text-slate-800">KES {analytics?.financials?.net_profit?.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Revenue − Recorded Costs</p>
              </div>
              <div className="p-3 bg-medical-50 text-medical-500 rounded-xl"><BarChart3 className="h-5 w-5" /></div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Inventory Asset Value</span>
                <h3 className="text-2xl font-black text-slate-800">KES {analytics?.financials?.asset_value?.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Wholesale asset stock count value</p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-500 rounded-xl"><ShieldCheck className="h-5 w-5" /></div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Monthly Revenue Progress</span>
                  <h4 className="text-sm font-bold text-slate-700">Target KES 250,000</h4>
                </div>
                <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl"><Target className="h-4 w-4" /></div>
              </div>
              <div className="space-y-1">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${analytics?.financials?.goal_progress}%` }} />
                </div>
                <div className="text-right text-[10px] font-black text-amber-600 uppercase">{analytics?.financials?.goal_progress}% Milestone Achieved</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm xl:col-span-2 space-y-6">

              <div className="space-y-4">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-500 pb-2 border-b">Revenue Performance Value by Category Tab</h4>
                <div className="space-y-3.5 pt-2">
                  {analytics?.charts?.category_revenue?.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center font-medium">No sales categorized inside this timeline scope selection.</p>
                  ) : (
                    analytics?.charts?.category_revenue?.map((cat, idx) => (
                      <div key={idx} className="space-y-1 text-xs">
                        <div className="flex justify-between font-bold text-slate-700">
                          <span className="uppercase">{cat.category}</span>
                          <span>KES {cat.revenue.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-50 h-3 rounded border overflow-hidden">
                          <div className="bg-medical-500 h-full" style={{ width: `${Math.min(100, (cat.revenue / (analytics?.financials?.total_revenue || 1)) * 100)}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-500 pb-2 border-b flex items-center space-x-2">
                  <ShoppingBag className="h-4 w-4 text-medical-500" />
                  <span>Exact Itemized Unit Quantities Sold Within Period</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {(!analytics?.charts?.units_sold_breakdown || analytics.charts.units_sold_breakdown.length === 0) ? (
                    <p className="text-xs text-slate-400 py-4 col-span-2 text-center font-medium">No individual uniform or equipment unit sales metrics cataloged on this day or month range.</p>
                  ) : (
                    analytics.charts.units_sold_breakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 border rounded-xl text-xs font-semibold">
                        <span className="text-slate-700 uppercase truncate max-w-50">{item.product_name}</span>
                        <span className="bg-medical-50 text-medical-600 border border-medical-100 px-3 py-1 rounded-lg font-black shrink-0">{item.quantity_sold} scrubs sold</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col h-full max-h-110">
              <div className="pb-3 border-b flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-4 w-4 animate-pulse" />
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-500">Critical Stock Balance Warnings</h4>
              </div>
              <div className="grow overflow-y-auto pt-4 space-y-2.5">
                {analytics?.alerts?.items?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-12 text-center font-medium">All item balances are healthy. Zero warnings logged.</p>
                ) : (
                  analytics?.alerts?.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2.5 bg-red-50/60 rounded-xl border border-red-100 text-xs">
                      <span className="font-bold text-slate-800 uppercase max-w-50 truncate">{item.name}</span>
                      <span className={`font-black uppercase text-[10px] px-2 py-0.5 rounded ${item.qty === 0 ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>
                        {item.qty === 0 ? 'Out of Stock' : `${item.qty} Left`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
          {admin.role === "Super Admin" && (
            <div className="space-y-6 mt-8">

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm xl:col-span-2 flex flex-col max-h-95">
                  <div className="pb-3 border-b flex items-center space-x-2">
                    <Users className="h-4 w-4 text-medical-600" />
                    <h4 className="font-black text-xs uppercase tracking-wider text-slate-500">Active Administrative Staff Registry Directory</h4>
                  </div>
                  <div className="grow overflow-y-auto divide-y divide-slate-100 pt-2 text-xs">
                    {staff.map(user => (
                      <div key={user.id} className="flex justify-between items-center py-3.5 group gap-4">
                        <div>
                          <div className="font-bold text-slate-800 flex items-center space-x-2">
                            <span>{user.email}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              user.is_active
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                : 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                            }`}>
                              {user.is_active ? 'Active' : 'Inactivated'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase">Clearance: <span className="text-medical-600">{user.role}</span></div>
                        </div>

                        {String(user.email).trim().toLowerCase() !== String(admin.email).trim().toLowerCase() && (
                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              type="button"
                              onClick={async () => {
                                const promptText = user.is_active ? "Inactivate this staff profile? They will lose server access instantly." : "Re-activate this admin staff account?";
                                if (!window.confirm(promptText)) return;
                                try {
                                  await fetch(`${API_BASE_URL}/api/admin/staff/${user.id}/toggle`, {
                                    method: "PATCH",
                                    headers: { "Authorization": `Bearer ${admin.token}`, "Content-Type": "application/json" },
                                    body: JSON.stringify({ is_active: !user.is_active })
                                  });
                                  loadAnalyticsCore();
                                } catch (err) { alert("Error updating user status."); }
                              }}
                              className={`px-3 py-1.5 rounded-lg border font-black uppercase text-[10px] tracking-wide transition-all cursor-pointer focus:outline-none ${
                                user.is_active
                                  ? 'bg-amber-50 hover:bg-amber-600 border-amber-200 hover:border-amber-600 text-amber-700 hover:text-white shadow-sm'
                                  : 'bg-emerald-50 hover:bg-emerald-600 border-emerald-200 hover:border-emerald-600 text-emerald-700 hover:text-white shadow-sm'
                              }`}
                            >
                              {user.is_active ? 'Inactivate' : 'Activate'}
                            </button>

                            <button type="button" onClick={() => handlePurgeStaff(user.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-xl transition-all cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="pb-3 border-b flex items-center space-x-2">
                    <PlusCircle className="h-4 w-4 text-medical-500" />
                    <h4 className="font-black text-xs uppercase tracking-wider text-slate-500">Authorize New Admin Profile</h4>
                  </div>

                  {formMsg && <div className="bg-emerald-50 border-l-4 border-emerald-500 p-2.5 rounded text-[11px] text-emerald-700 font-bold">{formMsg}</div>}

                  <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="block font-bold uppercase text-slate-400">Employee Login Email</label>
                      <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="name@scrubpoint.co.ke" className="w-full bg-slate-50 border rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-medical-500 font-medium" />
                    </div>

                    <div className="space-y-1 relative">
                      <label className="block font-bold uppercase text-slate-400">Temporary Access Password</label>
                      <div className="relative mt-1">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimum 6 characters long"
                          className="w-full bg-slate-50 border rounded-xl p-2.5 pr-10 text-slate-800 focus:outline-none focus:border-medical-500 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold uppercase text-slate-400">Assigned Privilege Clearance</label>
                      <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-2.5 text-slate-800 font-bold uppercase tracking-wide focus:outline-none focus:border-medical-500 cursor-pointer">
                        <option value="Admin">Standard Admin Desk Staff</option>
                        <option value="Super Admin">Super Admin Control Core</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-medical-500 hover:bg-medical-600 text-white font-black uppercase tracking-wider py-3 rounded-xl transition-colors shadow-sm cursor-pointer">Generate Staff Clearance Profile</button>
                  </form>
                </div>

              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col h-70">
                <div className="pb-3 border-b flex items-center space-x-2">
                  <ClipboardList className="h-4 w-4 text-purple-600" />
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-500">Live Administrative Employee Work Traces & Activity Logs</h4>
                </div>
                <div className="grow overflow-y-auto pt-4 space-y-2">
                  {auditLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 py-12 text-center font-medium">No administrative work footprints recorded yet.</p>
                  ) : (
                    auditLogs.map((log, index) => (
                      <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-slate-50 border rounded-xl gap-2 text-xs font-medium border-slate-100 shadow-sm">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800">{log.admin_email}</span>
                            <span className="bg-purple-50 text-purple-600 font-black text-[9px] px-2 py-0.5 rounded border border-purple-100 uppercase">{log.action_type || 'ACTIVITY'}</span>
                          </div>
                          <p className="text-slate-500 italic">"{log.details}"</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold bg-white px-2 py-1 rounded border shadow-sm shrink-0">
                          {new Date(log.created_at || new Date()).toLocaleDateString('en-KE')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}
        </>
      )}

    </div>
  );
}

function str(val) { return String(val || ''); }
