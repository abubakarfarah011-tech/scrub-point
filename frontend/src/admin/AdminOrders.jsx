import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import {
  MessageSquare,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  RefreshCw,
  Calendar,
  BadgeCheck,
  Search,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Package
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function AdminOrders() {
  const { admin, loading: authLoading, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrdersQueue = useCallback(async () => {
    if (!admin || !admin.token) return;
    setLoading(true);
    setError('');
    try {
      const result = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: { "Authorization": `Bearer ${admin.token}` }
      });
      const json = await result.json();
      if (json.success) {
        setOrders(json.data || []);
      } else {
        setError('Failed to fetch the live checkout stream logs.');
      }
    } catch (err) {
      setError('Could not connect to the backend server registry.');
    } finally {
      setLoading(false);
    }
  }, [admin]);

  const handleMarkAsDelivered = async (orderId) => {
    if (!window.confirm("Mark this order as delivered? This will automatically deduct matching items from your active stock quantities.")) return;
    setActionLoading(true);
    try {
      const result = await fetch(`${API_BASE_URL}/api/orders/${orderId}/fulfill`, {
        method: 'PATCH',
        headers: { "Authorization": `Bearer ${admin.token}` }
      });
      const json = await result.json();
      if (json.success) {
        alert("Success! Order fulfilled and inventory synchronized cleanly.");
        fetchOrdersQueue();
      } else {
        alert(json.message || "Failed to process fulfillment task.");
      }
    } catch (err) {
      alert("Communication error processing delivery task.");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
  if (!authLoading && admin) {
    fetchOrdersQueue();
  }
}, [admin, authLoading, fetchOrdersQueue]);

  if (authLoading) {
    return <div className="p-12 text-center text-slate-500 font-bold">Verifying security parameters...</div>;
  }

    const handleConfirmOrder = async (orderId) => {
    if (!window.confirm("Confirm that the WhatsApp message has been received for this order?")) return;

    setActionLoading(true);

    try {
      const result = await fetch(
        `${API_BASE_URL}/api/orders/${orderId}/confirm`,
        {
          method: 'PATCH',
          headers: {
            "Authorization": `Bearer ${admin.token}`
          }
        }
      );

      const json = await result.json();

      if (json.success) {
        alert("WhatsApp order confirmed successfully.");
        fetchOrdersQueue();
      } else {
        alert(json.message || "Failed to confirm this order.");
      }
    } catch (err) {
      alert("Communication error while confirming the order.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this order because no WhatsApp message was received?")) return;

    setActionLoading(true);

    try {
      const result = await fetch(
        `${API_BASE_URL}/api/orders/${orderId}/cancel`,
        {
          method: 'PATCH',
          headers: {
            "Authorization": `Bearer ${admin.token}`
          }
        }
      );

      const json = await result.json();

      if (json.success) {
        alert("Order cancelled successfully.");
        fetchOrdersQueue();
      } else {
        alert(json.message || "Failed to cancel this order.");
      }
    } catch (err) {
      alert("Communication error while cancelling the order.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrders = orders.filter(order =>
    order.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.variant_details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      <aside className="w-64 bg-medical-900 text-white flex flex-col shrink-0 shadow-xl">
        <div className="p-6 border-b border-white/10 flex items-center space-x-2">
          <ShieldCheck className="h-6 w-6 text-medical-100" />
          <div>
            <h1 className="font-black text-lg tracking-tight uppercase">Scrub Point</h1>
            <p className="text-[10px] text-medical-100 tracking-wider font-bold uppercase">Control Core</p>
          </div>
        </div>

        <nav className="grow p-4 space-y-2">
          <Link to="/admin/dashboard" className="flex items-center space-x-3 text-medical-100/70 hover:bg-white/5 hover:text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all">
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard Overview</span>
          </Link>
          <Link to="/admin/products" className="flex items-center space-x-3 text-medical-100/70 hover:bg-white/5 hover:text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all">
            <Package className="h-5 w-5" />
            <span>Inventory Manager</span>
          </Link>
          <Link to="/admin/orders" className="flex items-center space-x-3 bg-white/10 text-white px-4 py-3 rounded-lg font-bold text-sm transition-all">
            <MessageSquare className="h-5 w-5 text-medical-100" />
            <span>WhatsApp Orders Queue</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/10 text-xs space-y-3">
          <div className="flex flex-col">
            <span className="font-bold text-white truncate">{admin?.email}</span>
            <span className="text-medical-100/50 mt-0.5 font-medium">{admin?.role}</span>
          </div>
          <button onClick={logout} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-md transition-colors flex items-center justify-center space-x-2 cursor-pointer">
            <LogOut className="h-4 w-4" />
            <span>Logout Session</span>
          </button>
        </div>
      </aside>
      <main className="grow flex flex-col min-w-0">
        <header className="bg-white h-20 shadow-sm px-8 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">WhatsApp Order Logs</h2>

            <span className="bg-amber-50 text-amber-600 text-xs px-2.5 py-1 rounded-full font-bold uppercase border border-amber-100">
              Active Order Queue ({
              orders.filter(
                o => o.order_status === 'Awaiting WhatsApp' ||
                o.order_status === 'Pending' ||
                !o.order_status
              ).length
              })
              </span>
          </div>
          <button onClick={fetchOrdersQueue} className="p-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-medical-50 hover:text-medical-600 rounded-lg transition-colors cursor-pointer">
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        <div className="p-8 grow overflow-y-auto space-y-6">
          {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700 font-medium rounded-r-lg">{error}</div>}

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative flex items-center max-w-md">
            <span className="absolute left-3 text-slate-400"><Search className="h-5 w-5" /></span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search active pending queue..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-medical-500"
            />
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-500 font-medium">Syncing live database transactions...</div>
          ) : orders.filter(o => o.order_status === 'Awaiting WhatsApp' ||o.order_status === 'Pending' ||!o.order_status).length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center max-w-lg mx-auto">
              <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-black text-slate-800 uppercase">All Orders Complete!</h3>
              <p className="text-slate-500 text-sm mt-1">Excellent work, Feisal! Your pending operational queue logs are completely clean for the day.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {filteredOrders
                  .filter(o => o.order_status === 'Awaiting WhatsApp' ||o.order_status === 'Pending' ||!o.order_status)
                  .map((order) => (
                    <div key={order.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 mt-0.5">
                          <ShoppingBag className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-slate-800 text-base">{order.product_name}</h4>
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border">ID: #{order.product_id}</span>
                            {order.order_status === 'Awaiting WhatsApp' ? (
                              <span className="bg-blue-50 text-blue-700 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-blue-200 flex items-center space-x-1">
                                <MessageSquare className="h-3 w-3" />
                                <span>Awaiting WhatsApp</span>
                                </span>
                                ) : (
                                <span className="bg-amber-50 text-amber-700 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-200 flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Pending Action</span>
                                  </span>
                                )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium"><span className="font-bold text-slate-400 uppercase">Config:</span> {order.variant_details}</p>
                          <div className="flex items-center space-x-4 pt-1 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{new Date(order.created_at).toLocaleString('en-KE')}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 self-end lg:self-center shrink-0">
                        <div className="flex items-baseline space-x-1 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400">KES</span>
                          <span className="text-lg font-black text-slate-800 tracking-tight">{parseFloat(order.total_price).toLocaleString()}</span>
                        </div>

                        {order.order_status === 'Awaiting WhatsApp' ? (
                          <div className="flex items-center space-x-2">
                            <button
                            onClick={() => handleConfirmOrder(order.id)}
                            disabled={actionLoading}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer disabled:bg-slate-300 flex items-center space-x-1.5"
                            >
                              <BadgeCheck className="h-4 w-4" />
                              <span>Confirm</span>
                              </button>

                              <button
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={actionLoading}
                              className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer disabled:bg-slate-300 flex items-center space-x-1.5"
                              >
                                <LogOut className="h-4 w-4" />
                                <span>Cancel</span>
                                </button>
                                </div>
                                ) : (
                                <button
                                onClick={() => handleMarkAsDelivered(order.id)}
                                disabled={actionLoading}
                                className="bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer disabled:bg-slate-300"
                                >
                                  Mark Delivered</button>
                                )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
