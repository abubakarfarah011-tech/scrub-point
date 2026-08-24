import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useCart } from '../context/useCart';
import {
  Grid,ShieldCheck, LayoutDashboard, BarChart3, Package, MessageSquare,
  Users, LogOut, RefreshCw, AlertTriangle, UserCheck, Star, ClipboardList,
  Trash2, PlusCircle, Eye, EyeOff, DollarSign, Target, TrendingUp, CheckCircle, ShieldAlert,ShoppingCart
} from 'lucide-react';
import InventoryManager from './InventoryManager';
import InStorePOS from './InStorePOS';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function int(val) {
  return parseInt(val || 0, 10);
}

export default function AdminDashboard() {
  const { admin, logout } = useAuth();
  const { clearCart } = useCart();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');

  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [messages, setMessages] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [staff, setStaff] = useState([]);

  const [allProductsRawList, setAllProductsRawList] = useState([]);

  const [packagesRawList, setPackagesRawList] = useState([]);
  const [deliveryHistoryOpen, setDeliveryHistoryOpen] = useState(false);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [fulfillErrorByOrderId, setFulfillErrorByOrderId] = useState({});

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [analyticsStartDate, setAnalyticsStartDate] = useState('2026-01-01');
  const [analyticsEndDate, setAnalyticsEndDate] = useState('2026-12-31');
  const [analyticsData, setAnalyticsData] = useState(null);

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Admin');
  const [showPassword, setShowPassword] = useState(false);
  const [staffFormMsg, setStaffFormMsg] = useState('');

  const loadDashboardCorePayload = useCallback(async () => {
    if (!admin || !admin.token) return;
    setIsRefreshing(true);
    const requestHeaders = {
      "Authorization": `Bearer ${admin.token}`,
      "Content-Type": "application/json"
    };

    try {
      const metricsRes = await fetch(`${API_BASE_URL}/api/admin/dashboard`, { headers: requestHeaders });
      const metricsJson = await metricsRes.json();
      if (metricsJson.success && metricsJson.data) {
        setMetrics(metricsJson.data);
        setAuditLogs(metricsJson.data.audit_logs || []);
      }

      const ordersRes = await fetch(`${API_BASE_URL}/api/orders`, { headers: requestHeaders });
      const ordersJson = await ordersRes.json();
      if (ordersJson.success) setOrders(ordersJson.data || []);

      const reviewsRes = await fetch(`${API_BASE_URL}/api/admin/reviews`, { headers: requestHeaders });
      const reviewsJson = await reviewsRes.json();
      if (reviewsJson.success) setReviews(reviewsJson.data || []);

      const msgsRes = await fetch(`${API_BASE_URL}/api/contact/messages`, { headers: requestHeaders });
      const msgsJson = await msgsRes.json();
      if (msgsJson.success) setMessages(msgsJson.data || []);

      const productsRes = await fetch(`${API_BASE_URL}/api/products?limit=100`);
      const productsJson = await productsRes.json();
      if (productsJson.success) setAllProductsRawList(productsJson.data || []);

      const packagesRes = await fetch(`${API_BASE_URL}/api/packages`);
      const packagesJson = await packagesRes.json();
      if (packagesJson.success) setPackagesRawList(packagesJson.data || []);

      if (admin.role === "Super Admin") {
        const staffRes = await fetch(`${API_BASE_URL}/api/admin/staff`, { headers: requestHeaders });
        const staffJson = await staffRes.json();
        if (staffJson.success) setStaff(staffJson.data || []);
      }

      const analyticsRes = await fetch(`${API_BASE_URL}/api/admin/analytics?start_date=${analyticsStartDate}&end_date=${analyticsEndDate}`, { headers: requestHeaders });
      const analyticsJson = await analyticsRes.json();
      if (analyticsJson.success) setAnalyticsData(analyticsJson.data);

    } catch (err) {
      console.error("Dashboard core loop sync failure exception.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [admin, analyticsStartDate, analyticsEndDate]);

  useEffect(() => {
  loadDashboardCorePayload();
}, [loadDashboardCorePayload]);

  const handleLogout = () => {
    if (window.confirm("Terminate your secure back-office session and sign out?")) {
      logout();
      clearCart();
    }
  };

  const handleFulfillOrder = async (orderId) => {
  setFulfillErrorByOrderId(prev => ({ ...prev, [orderId]: null }));
  try {
    const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/fulfill`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${admin.token}`, "Content-Type": "application/json" }
    });
    const json = await res.json();
    if (json.success) {
      loadDashboardCorePayload();
    } else {
      setFulfillErrorByOrderId(prev => ({ ...prev, [orderId]: json.message || "Unable to fulfill this order." }));
    }
  } catch (err) {
    setFulfillErrorByOrderId(prev => ({ ...prev, [orderId]: "Network error while fulfilling order." }));
  }
};

const handleConfirmOrder = async (orderId) => {
  if (!window.confirm("Confirm that the WhatsApp message has been received for this order?")) {
    return;
  }

  setFulfillErrorByOrderId(prev => ({
    ...prev,
    [orderId]: null
  }));

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/orders/${orderId}/confirm`,
      {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${admin.token}`,
          "Content-Type": "application/json"
        }
      }
    );

    const json = await res.json();

    if (json.success) {
      loadDashboardCorePayload();
    } else {
      setFulfillErrorByOrderId(prev => ({
        ...prev,
        [orderId]: json.message || "Unable to confirm this order."
      }));
    }
  } catch (err) {
    setFulfillErrorByOrderId(prev => ({
      ...prev,
      [orderId]: "Network error while confirming this order."
    }));
  }
};


const handleCancelOrder = async (orderId) => {
  if (!window.confirm("Cancel this order because no WhatsApp message was received?")) {
    return;
  }

  setFulfillErrorByOrderId(prev => ({
    ...prev,
    [orderId]: null
  }));

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/orders/${orderId}/cancel`,
      {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${admin.token}`,
          "Content-Type": "application/json"
        }
      }
    );

    const json = await res.json();

    if (json.success) {
      loadDashboardCorePayload();
    } else {
      setFulfillErrorByOrderId(prev => ({
        ...prev,
        [orderId]: json.message || "Unable to cancel this order."
      }));
    }
  } catch (err) {
    setFulfillErrorByOrderId(prev => ({
      ...prev,
      [orderId]: "Network error while cancelling this order."
    }));
  }
};

const getRemainingStockForOrder = (order) => {
  if (order.package_id) return null;
  const match = allProductsRawList.find(p => String(p.id) === String(order.product_id));
  return match ? int(match.stock_quantity) : null;
};

  const handleApproveReview = async (reviewId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${admin.token}`, "Content-Type": "application/json" }
      });
      const json = await res.json();
      if (json.success) loadDashboardCorePayload();
    } catch (err) { alert("Review verification error."); }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Permanently wipe this evaluation record from storefront view panel listings?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${admin.token}` }
      });
      const json = await res.json();
      if (json.success) loadDashboardCorePayload();
    } catch (err) { alert("Error purging review row."); }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Permanently delete this message log entry from server database cores?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact/messages/${msgId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${admin.token}` }
      });
      const json = await res.json();
      if (json.success) loadDashboardCorePayload();
    } catch (err) { alert("Error wiping customer message record."); }
  };

  const handleCreateStaffAccount = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) {
      alert('Please fill out all mandatory credentials fields.');
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
        setStaffFormMsg('New admin account profile authorized successfully!');
        setNewEmail('');
        setNewPassword('');
        loadDashboardCorePayload();
        setTimeout(() => setStaffFormMsg(''), 4000);
      } else { alert(json.message); }
    } catch (err) { alert('Error generating staff profile clearance.'); }
  };

  const handlePurgeStaffAccount = async (staffId) => {
    if (!window.confirm("Permanently delete this admin's access permissions?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/staff/${staffId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${admin.token}` }
      });
      const json = await res.json();
      if (json.success) loadDashboardCorePayload();
    } catch (err) { alert('Error dropping staff row.'); }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800 transition-colors duration-200">

      <aside className="w-64 bg-medical-900 text-white flex flex-col shrink-0 shadow-xl border-r border-medical-950">
        <div className="p-6 border-b border-white/10 flex items-center space-x-2">
          <ShieldCheck className="h-6 w-6 text-medical-100" />
          <div>
            <h1 className="font-black text-base tracking-tight uppercase text-white">Scrub Point</h1>
            <p className="text-[10px] text-medical-100 tracking-wider font-bold uppercase">Control Core</p>
          </div>
        </div>

        <nav className="grow p-4 space-y-1.5 text-xs font-black uppercase tracking-wider text-slate-200">
          <button
            type="button" onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all text-left cursor-pointer focus:outline-none ${activeTab === 'overview' ? 'bg-white/10 text-white shadow-md' : 'text-medical-100/70 hover:bg-white/5 hover:text-white'}`}
          >
            <LayoutDashboard className="h-4 w-4 text-white" />
            <span>Dashboard Overview</span>
          </button>

          <button
            type="button" onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all text-left cursor-pointer focus:outline-none ${activeTab === 'analytics' ? 'bg-white/10 text-white shadow-md' : 'text-medical-100/70 hover:bg-white/5 hover:text-white'}`}
          >
            <BarChart3 className="h-4 w-4 text-white" />
            <span>Business Analytics</span>
          </button>

          <button
            type="button" onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all text-left cursor-pointer focus:outline-none ${activeTab === 'inventory' ? 'bg-white/10 text-white shadow-md' : 'text-medical-100/70 hover:bg-white/5 hover:text-white'}`}
          >
            <Package className="h-4 w-4 text-white" />
            <span>Inventory Manager</span>
          </button>
          <button
          type="button"
          onClick={() => setActiveTab('walk_in_customers')}
          className={`w-full text-left p-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center space-x-2 transition-all ${
            activeTab === 'walk_in_customers' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'
            }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Walk-In Orders (POS)</span>
              </button>


          <button
            type="button" onClick={() => setActiveTab('whatsapp')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all text-left cursor-pointer focus:outline-none ${activeTab === 'whatsapp' ? 'bg-white/10 text-white shadow-md' : 'text-medical-100/70 hover:bg-white/5 hover:text-white'}`}
          >
            <MessageSquare className="h-4 w-4 text-white" />
            <span>WhatsApp Queue</span>
          </button>

          {admin.role === "Super Admin" && (
            <button
              type="button" onClick={() => setActiveTab('accounts')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all text-left cursor-pointer focus:outline-none ${activeTab === 'accounts' ? 'bg-white/10 text-white shadow-md' : 'text-medical-100/70 hover:bg-white/5 hover:text-white'}`}
            >
              <Users className="h-4 w-4 text-white" />
              <span>Admin Accounts</span>
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/10 text-[10px] font-bold text-medical-100/60 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white font-black text-[9px] uppercase">{admin?.email?.substring(0,2)}</div>
            <div className="truncate max-w-37.5">
              <p className="text-white font-black truncate leading-none mb-0.5">{admin?.email}</p>
              <span className="text-[8px] tracking-widest text-medical-200 font-black uppercase">{admin?.role}</span>
            </div>
          </div>
          <button type="button" onClick={handleLogout} className="w-full bg-white/10 hover:bg-red-600/20 border border-white/10 hover:border-red-500/40 text-white py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center space-x-2 transition-colors cursor-pointer focus:outline-none shadow-sm"><LogOut className="h-3.5 w-3.5" /> <span>Sign Out</span></button>
        </div>
      </aside>


      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">

        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 z-20 shadow-xs">
          <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-slate-700">
            <UserCheck className="h-4 w-4 text-emerald-500" />
            <span>Super-Admin Managment Control Desk</span>
          </div>

          <button
            type="button"
            onClick={loadDashboardCorePayload}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 border rounded-xl bg-slate-50 hover:bg-slate-100 text-xs text-slate-600 font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer focus:outline-none shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-medical-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing Hub...' : 'Sync Database Core'}</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">

          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade max-w-7xl mx-auto">

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Products</span>
                    <h3 className="text-xl font-black text-slate-800">{metrics?.products ?? 0} items</h3>
                  </div>
                  <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl border"><Package className="h-4 w-4" /></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Categories</span>
                    <h3 className="text-xl font-black text-slate-800">{metrics?.categories ?? 0} fields</h3>
                  </div>
                  <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl border"><BarChart3 className="h-4 w-4" /></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Orders Panel</span>
                    <h3 className="text-xl font-black text-slate-800">{orders.filter(o => o.order_status === "Pending").length} Orders </h3>
                  </div>
                  <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl border"><MessageSquare className="h-4 w-4" /></div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">System Staff</span>
                    <h3 className="text-xl font-black text-slate-800">{metrics?.admins ?? 1} admins</h3>
                  </div>
                  <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl border"><Users className="h-4 w-4" /></div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="pb-2 border-b flex justify-between items-center">
                  <div className="space-y-0.5">
                    <h3 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500 mr-1.5" />
                      <span>Customer Appraisal Reviews Desk Approvals Queue</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verify incoming appraisal reviews or delete wrong feedback rows completely</p>
                  </div>
                  <span className="bg-purple-50 text-purple-600 font-black text-[9px] px-2.5 py-1 rounded-full border">{reviews.length} Logged</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.length === 0 ? (
                    <p className="text-xs text-slate-400 p-4 text-center border font-bold tracking-wide rounded-2xl italic col-span-2">No comments or user reviews logged Received yet.</p>
                  ) : (
                    reviews.map(rev => (
                      <div key={rev.id} className="border rounded-2xl p-4 bg-slate-50 flex flex-col justify-between space-y-3 shadow-xs">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                            <span className="truncate font-black text-slate-700 max-w-45">{rev.reviewer_name}</span>
                            <span className="bg-white px-2 py-0.5 rounded shadow-sm border font-mono">ID: #{rev.id}</span>
                          </div>
                          <p className="text-xs text-slate-600 italic">"{rev.comment}"</p>
                          <div className="text-amber-400 text-[10px] font-black tracking-xs">{'★'.repeat(Math.min(5, parseInt(rev.rating || 5)))}</div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 text-[10px] font-black uppercase tracking-wider">
                          <span className={`px-2 py-0.5 rounded border ${rev.is_approved ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse'}`}>{rev.is_approved ? 'Approved Live' : 'Pending Verification'}</span>
                          <div className="flex space-x-2">
                            {!rev.is_approved && (<button type="button" onClick={() => handleApproveReview(rev.id)} className="bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded-lg font-black shadow-xs cursor-pointer">Approve</button>)}
                            <button type="button" onClick={() => handleDeleteReview(rev.id)} className="text-slate-400 hover:text-red-500 p-1 border rounded transition-colors cursor-pointer focus:outline-none"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="pb-2 border-b">
                  <h3 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center"><ClipboardList className="h-4 w-4 text-sky-500 mr-1.5" /> <span>Inbound Support Communication Messaging Inquiry Feeds</span></h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Customer questions sent directly from storefront support contacts form entries</p>
                </div>
                <div className="space-y-2 max-h-55 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 border text-center font-bold rounded-2xl italic">Support communication logs feed inbox is completely empty.</p>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center group gap-4 shadow-xs">
                        <div className="space-y-0.5 max-w-[85%]">
                          <p className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">{msg.name}</p>
                          <p className="text-xs text-slate-600 font-medium normal-case italic">"{msg.message}"</p>
                        </div>
                        <button type="button" onClick={() => handleDeleteMessage(msg.id)} className="text-slate-300 hover:text-red-500 p-2 border border-transparent hover:border-red-200 rounded-xl transition-all cursor-pointer focus:outline-none shrink-0"><Trash2 className="h-4.5 w-4.5" /></button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="pb-2 border-b flex items-center space-x-2 text-slate-400">
                  <ClipboardList className="h-4 w-4" />
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-700">Administrative Employee Activity Logs Footprints</h4>
                </div>
                <div className="space-y-2 max-h-50 overflow-y-auto">
                  {auditLogs.map((log, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-50 border rounded-xl text-xs font-semibold shadow-xs">
                      <div>
                        <div className="flex items-center space-x-2"><span className="font-black text-slate-800">{log.admin_email}</span> <span className="bg-purple-50 text-purple-600 font-black text-[9px] px-2 py-0.5 rounded border uppercase">{log.action_type}</span></div>
                        <p className="text-slate-500 italic mt-0.5">"{log.details}"</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold bg-white px-2 py-1 rounded border shrink-0">{new Date(log.created_at || new Date()).toLocaleDateString('en-KE')}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="animate-fade max-w-7xl mx-auto">
              <InventoryManager />
            </div>
          )}
          {activeTab === 'walk_in_customers' && (
            <div className="animate-fade max-w-7xl mx-auto">
              <InStorePOS />
              </div>
            )}

          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fade max-w-7xl mx-auto">

              <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center space-x-2"><BarChart3 className="h-5 w-5 text-sky-500" /> <span className="font-black text-xs uppercase tracking-wider text-slate-700">Analytics Calendar Filter Range</span></div>
                <div className="flex gap-3 text-xs font-bold text-slate-500 items-center">
                  <span>From:</span> <input type="date" value={analyticsStartDate} onChange={(e) => setAnalyticsStartDate(e.target.value)} className="bg-slate-50 border p-2 rounded-lg text-slate-700 focus:outline-none" />
                  <span>To:</span> <input type="date" value={analyticsEndDate} onChange={(e) => setAnalyticsEndDate(e.target.value)} className="bg-slate-50 border p-2 rounded-lg text-slate-700 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-2xl border shadow-xs flex items-center justify-between"><div className="space-y-0.5"><span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Gross Period Revenue</span> <h3 className="text-2xl font-black text-slate-800">KES {analyticsData?.financials?.total_revenue?.toLocaleString() || 0}</h3></div><div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl"><DollarSign className="h-5 w-5" /></div></div>
                <div className="bg-white p-5 rounded-2xl border shadow-xs flex items-center justify-between"><div className="space-y-0.5"><span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Net Profit Curve</span> <h3 className="text-2xl font-black text-slate-800">KES {analyticsData?.financials?.net_profit?.toLocaleString() || 0}</h3></div><div className="p-3 bg-sky-50 text-sky-500 rounded-xl"><TrendingUp className="h-5 w-5" /></div></div>
                <div className="bg-white p-5 rounded-2xl border shadow-xs space-y-2"><div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Target KES 250,000 Goal</span> <span className="text-[10px] text-amber-600 font-black uppercase">{analyticsData?.financials?.goal_progress || 0}%</span></div><div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-amber-500 h-full" style={{ width: `${analyticsData?.financials?.goal_progress || 0}%` }} /></div></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                <div className="bg-white border rounded-3xl p-5 shadow-sm space-y-3 lg:col-span-6">
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-500 pb-2 border-b">Exact Itemized Uniform Units Sold Summary</h4>
                  <div className="grid grid-cols-1 gap-3 pt-1">
                    {!analyticsData?.charts?.units_sold_breakdown || analyticsData.charts.units_sold_breakdown.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center italic font-medium">No sales recorded inside this filter window query.</p>
                    ) : (
                      analyticsData.charts.units_sold_breakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 border rounded-xl text-xs font-semibold shadow-xs">
                          <span className="text-slate-700 uppercase truncate max-w-50">{item.product_name}</span>
                          <span className="bg-medical-50 text-medical-600 border px-3 py-1 rounded-lg font-black shrink-0">{item.quantity_sold} scrubs sold</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="lg:col-span-6">
                  {allProductsRawList && allProductsRawList.filter(p => int(p.stock_quantity) < 5 && !p.is_deleted).length > 0 ? (
                    <div className="bg-red-50 border border-red-200 p-5 rounded-3xl space-y-3 shadow-sm animate-pulse">
                      <div className="flex items-center space-x-2 text-red-700 font-black text-xs uppercase tracking-wider">
                        <ShieldAlert className="h-5 w-5 text-red-600 animate-bounce" />
                        <span>Critical Warehouse Low Stock Warnings (&lt; 5 Units Remaining)</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 pt-1 text-xs font-bold uppercase text-slate-700 max-h-75 overflow-y-auto">
                        {allProductsRawList.filter(p => int(p.stock_quantity) < 5 && !p.is_deleted).map((item, idx) => (
                          <div key={`analytics-alert-${idx}`} className="bg-white border border-red-100 p-3 rounded-xl flex justify-between items-center shadow-xs">
                            <span className="truncate max-w-37.5 font-black text-slate-800">{item.name}</span>
                            <span className="bg-red-600 text-white font-black px-2.5 py-1 rounded-md text-[9px] tracking-widest shrink-0">
                              {int(item.stock_quantity) === 0 ? 'OUT OF STOCK' : `ONLY ${item.stock_quantity} LEFT`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50/60 border border-emerald-100 p-5 rounded-3xl text-center font-bold text-xs uppercase text-slate-400 py-10 shadow-xs">
                      ✨ Healthy Stock Levels: All depot catalog inventory units are safely above the critical low-stock limit.
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        {activeTab === 'whatsapp' && (
  <div className="space-y-6 max-w-7xl mx-auto animate-fade">

    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="pb-3 border-b border-slate-100 flex justify-between items-center">
        <div className="space-y-0.5">
          <h3 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center">
            <MessageSquare className="h-4 w-4 text-amber-500 mr-1.5" />
            <span>Active WhatsApp Orders Queue</span>
          </h3>

          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {
              orders.filter(o =>o.order_status === "Awaiting WhatsApp" ||o.order_status === "Pending"
              ).length
            } pending order(s)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto text-xs font-semibold text-slate-500">
        <table className="w-full text-left border-collapse whitespace-nowrap">

          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-widest text-[9px] font-black">
              <th className="p-3.5">Item</th>
              <th className="p-3.5">Details</th>
              <th className="p-3.5">Price (KES)</th>
              <th className="p-3.5">Order Received</th>
              <th className="p-3.5">Remaining Stock</th>
              <th className="p-3.5 text-center">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 uppercase text-[11px]">

            {orders.filter(o =>o.order_status === "Awaiting WhatsApp" ||o.order_status === "Pending").length === 0 ? (

              <tr>
                <td
                  colSpan="6"
                  className="p-8 text-center text-slate-400 font-bold tracking-wide italic"
                >
                  No active orders right now.
                </td>
              </tr>

            ) : (

              orders
                .filter(o =>o.order_status === "Awaiting WhatsApp" ||o.order_status === "Pending"
                )
                .map(order => {

                  const remainingStock = getRemainingStockForOrder(order);
                  const fulfillError = fulfillErrorByOrderId[order.id];

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/60 transition-colors align-top"
                    >

                      <td className="p-3.5 font-bold text-slate-700 truncate max-w-45">
                        {order.product_name}

                        {order.package_id && (
                          <span className="block text-[8px] text-purple-500 normal-case">
                            Bundle Package
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-400 font-medium normal-case font-mono">
                        {order.variant_details}
                      </td>

                      <td className="p-3.5 font-black text-slate-800">
                        KES {Number(order.total_price || 0).toLocaleString()}
                      </td>

                      <td className="p-3.5 text-slate-400 font-mono text-[10px] normal-case">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleString('en-KE')
                          : '—'}
                      </td>

                      <td className="p-3.5">
                        {remainingStock !== null ? (
                          <span
                            className={`px-2 py-0.5 rounded font-black text-[9px] ${
                              remainingStock <= 5
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            {remainingStock} left
                          </span>
                        ) : (
                          <span className="text-slate-300 normal-case">
                            —
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center space-y-1.5">

                        {order.order_status === "Awaiting WhatsApp" ? (

                          <div className="flex items-center justify-center gap-2">

                            <button
                              type="button"
                              onClick={() => handleConfirmOrder(order.id)}
                              disabled={isRefreshing}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-wide px-3 py-1.5 rounded-lg shadow-xs cursor-pointer focus:outline-none transition-colors disabled:bg-slate-300"
                            >
                              Confirm
                            </button>

                            {/* CANCEL */}
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={isRefreshing}
                              className="bg-red-500 hover:bg-red-600 text-white font-black uppercase text-[10px] tracking-wide px-3 py-1.5 rounded-lg shadow-xs cursor-pointer focus:outline-none transition-colors disabled:bg-slate-300"
                            >
                              Cancel
                            </button>

                          </div>

                        ) : order.order_status === "Pending" ? (

                          <button
                            type="button"
                            onClick={() => handleFulfillOrder(order.id)}
                            disabled={isRefreshing}
                            className="bg-medical-500 hover:bg-medical-600 text-white font-black uppercase text-[10px] tracking-wide px-3 py-1.5 rounded-lg shadow-xs cursor-pointer focus:outline-none transition-colors disabled:bg-slate-300"
                          >
                            Mark Delivered
                          </button>

                        ) : null}

                        {fulfillError && (
                          <div className="bg-red-50 border border-red-200 text-red-600 text-[9px] font-bold normal-case p-1.5 rounded max-w-45 mx-auto">
                            {fulfillError}
                          </div>
                        )}

                      </td>

                    </tr>
                  );
                })
            )}

          </tbody>
        </table>
      </div>
    </div>
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
      <button
        type="button"
        onClick={() => setDeliveryHistoryOpen(!deliveryHistoryOpen)}
        className="w-full flex justify-between items-center cursor-pointer focus:outline-none"
      >
        <h3 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center">
          <CheckCircle className="h-4 w-4 text-emerald-500 mr-1.5" />
          <span>Delivery History ({orders.filter(o => o.order_status === "Delivered").length})</span>
        </h3>
        <span className="text-[10px] font-black uppercase text-slate-400">{deliveryHistoryOpen ? 'Hide ▲' : 'Show ▼'}</span>
      </button>

      {deliveryHistoryOpen && (
        <div className="space-y-4 pt-2 border-t border-dashed border-slate-100">
          <div className="flex flex-wrap gap-3 items-center text-xs font-bold text-slate-500">
            <span>Search delivered between:</span>
            <input type="date" value={historyStartDate} onChange={(e) => setHistoryStartDate(e.target.value)} className="bg-slate-50 border p-2 rounded-lg focus:outline-none" />
            <span>and</span>
            <input type="date" value={historyEndDate} onChange={(e) => setHistoryEndDate(e.target.value)} className="bg-slate-50 border p-2 rounded-lg focus:outline-none" />
            {(historyStartDate || historyEndDate) && (
              <button type="button" onClick={() => { setHistoryStartDate(''); setHistoryEndDate(''); }} className="text-[10px] uppercase font-black text-slate-400 hover:text-slate-600 cursor-pointer">Clear</button>
            )}
          </div>

          <div className="overflow-x-auto text-xs font-semibold text-slate-500">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-widest text-[9px] font-black">
                  <th className="p-3.5">Item</th>
                  <th className="p-3.5">Details</th>
                  <th className="p-3.5">Price (KES)</th>
                  <th className="p-3.5">Delivered On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 uppercase text-[11px]">
                {orders
                  .filter(o => o.order_status === "Delivered")
                  .filter(o => {
                    if (!historyStartDate && !historyEndDate) return true;
                    if (!o.delivered_at) return false;
                    const deliveredDate = o.delivered_at.slice(0, 10);
                    if (historyStartDate && deliveredDate < historyStartDate) return false;
                    if (historyEndDate && deliveredDate > historyEndDate) return false;
                    return true;
                  })
                  .map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-bold text-slate-700 truncate max-w-45">{order.product_name}</td>
                      <td className="p-3.5 text-slate-400 font-medium normal-case font-mono">{order.variant_details}</td>
                      <td className="p-3.5 font-black text-slate-800">KES {Number(order.total_price || 0).toLocaleString()}</td>
                      <td className="p-3.5 text-slate-400 font-mono text-[10px] normal-case">
                        {order.delivered_at ? new Date(order.delivered_at).toLocaleString('en-KE') : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  </div>
)}
          {activeTab === 'accounts' && admin.role === "Super Admin" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto animate-fade items-start">
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm lg:col-span-7 flex flex-col max-h-95"><div className="pb-3 border-b flex items-center space-x-2"><Users className="h-4 w-4 text-medical-600" /> <h4 className="font-black text-xs uppercase tracking-wider text-slate-500">Active Administrative Staff Registry</h4></div><div className="grow overflow-y-auto divide-y divide-slate-100 text-xs pt-1">{staff.map(user => ( <div key={user.id} className="flex justify-between items-center py-3.5 gap-4"> <div> <div className="font-bold text-slate-800 flex items-center space-x-2"><span>{user.email}</span> <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${user.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200 animate-pulse'}`}>{user.is_active ? 'Active' : 'Inactivated'}</span></div> <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Clearance: <span className="text-medical-600 font-black">{user.role}</span></div></div> {String(user.email).trim().toLowerCase() !== String(admin.email).trim().toLowerCase() && ( <button type="button" onClick={() => handlePurgeStaffAccount(user.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"><Trash2 className="h-4 w-4" /></button> )}</div> ))}</div></div>
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm lg:col-span-5 space-y-4"><div className="pb-2 border-b flex items-center space-x-2"><PlusCircle className="h-4 w-4 text-medical-500" /> <h4 className="font-black text-xs uppercase tracking-wider text-slate-500">Authorize New Admin Profile</h4></div>{staffFormMsg && <div className="bg-emerald-50 border-l-4 border-emerald-500 p-2 text-[11px] text-emerald-700 font-bold">{staffFormMsg}</div>}<form onSubmit={handleCreateStaffAccount} className="space-y-3.5 text-xs text-slate-500 font-semibold"><div className="space-y-1"><label className="block font-bold uppercase text-slate-400">Employee Login Email</label> <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="name@scrubpoint.co.ke" className="w-full bg-slate-50 border rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-medical-500 font-medium" /></div><div className="space-y-1"><label className="block font-bold uppercase text-slate-400">Temporary Access Password</label> <div className="relative mt-1"><input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 6 characters long" className="w-full bg-slate-50 border rounded-xl p-2.5 pr-10 text-slate-800 focus:outline-none focus:border-medical-500 font-medium" /> <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div><div className="space-y-1"><label className="block font-bold uppercase text-slate-400">Assigned Clearance</label> <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-2.5 text-slate-800 font-bold uppercase focus:outline-none focus:border-medical-500 cursor-pointer"><option value="Admin">Standard Admin Desk Staff</option><option value="Super Admin">Super Admin Control Core</option></select></div><button type="submit" className="w-full bg-medical-500 hover:bg-medical-600 text-white font-black uppercase tracking-wider py-3 rounded-xl shadow-xs cursor-pointer transition-colors">Generate Staff Clearance Profile</button></form></div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
