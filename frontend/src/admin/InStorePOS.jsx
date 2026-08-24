import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import {
  ShoppingCart, User, Phone, CheckCircle, AlertCircle,
  RefreshCw, Trash2, Plus, Minus, Search, Layers, Grid, Tag, Check, Calendar, History
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function InStorePOS() {
  const { admin } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  const [posCart, setPosCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [activeItemSizes, setActiveItemSizes] = useState({});
  const [activeItemColors, setActiveItemColors] = useState({});

  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessNotice] = useState('');
  const [errorMsg, setErrorNotice] = useState('');

  const [salesRecords, setSalesRecords] = useState([]);
  const [salesHistoryLoading, setSalesHistoryLoading] = useState(false);
  const [salesHistoryOpen, setSalesHistoryOpen] = useState(false);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  const parseArrayData = (targetField) => {
    if (!targetField) return [];
    if (Array.isArray(targetField)) return targetField.filter(s => s && String(s).toUpperCase() !== 'NONE');
    if (typeof targetField === 'string') {
      const cleaned = targetField.replace(/[{}]/g, '');
      return cleaned.split(',').map(s => s.trim()).filter(s => s && s.toUpperCase() !== 'NONE' && s.toUpperCase() !== 'NULL');
    }
    return [];
  };

  const fetchAvailableCatalog = useCallback(async () => {
    setLoading(true);
    setErrorNotice('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/products?limit=150&timestamp=` + new Date().getTime());
      const json = await res.json();
      if (json.success) {
        setProducts(json.data || []);
      } else {
        setErrorNotice("Could not synchronize warehouse inventory data models.");
      }
    } catch (err) {
      setErrorNotice("Failed to establish secure backend system database handshakes.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSalesHistory = useCallback(async () => {
    setSalesHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/walk-in-order`, {
        headers: { 'Authorization': 'Bearer ' + admin.token }
      });
      const json = await res.json();
      if (json.success) {
        setSalesRecords(json.data || []);
      }
    } catch (err) {
      setErrorNotice("Failed to load walk-in sales history.");
    } finally {
      setSalesHistoryLoading(false);
    }
  }, [admin.token]);

  useEffect(() => {
  fetchAvailableCatalog();
  fetchSalesHistory();
}, [fetchAvailableCatalog, fetchSalesHistory]);

  const handlePOSItemAttributeChange = (productId, type, value) => {
    if (type === 'size') {
      setActiveItemSizes(prev => ({ ...prev, [productId]: value }));
    } else {
      setActiveItemColors(prev => ({ ...prev, [productId]: value }));
    }
  };

  const handleAddProductToPOSCart = (item) => {
    const totalAvailableUnits = parseInt(item.stock_quantity || 0, 10);
    if (totalAvailableUnits <= 0) {
      alert("This clinical asset is currently sold out in the storehouse repository!");
      return;
    }

    const itemSizes = parseArrayData(item.sizes_available);
    const itemColors = parseArrayData(item.colors_available);

    const chosenSize = activeItemSizes[item.id] || (itemSizes.length > 0 ? itemSizes[0] : null);
    const chosenColor = activeItemColors[item.id] || (itemColors.length > 0 ? itemColors[0] : null);

    if (itemSizes.length > 0 && !chosenSize) {
      alert("Please select a specific size option before loading this garment to invoice!");
      return;
    }
    if (itemColors.length > 0 && !chosenColor) {
      alert("Please select a specific fabric color option before loading this garment to invoice!");
      return;
    }

    const uniqueCartKey = `${item.id}-${chosenSize || 'uni'}-${chosenColor || 'uni'}`;
    const existingIndex = posCart.findIndex(cartItem => cartItem.cart_key === uniqueCartKey);

    if (existingIndex > -1) {
      if (posCart[existingIndex].quantity >= totalAvailableUnits) {
        alert("Cannot append more units than available local warehouse balance limits!");
        return;
      }
      setPosCart(prev => prev.map((c, i) => i === existingIndex ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setPosCart(prev => [...prev, {
        cart_key: uniqueCartKey,
        product_id: item.id,
        name: item.name,
        price: item.is_on_offer ? item.offer_price : item.price,
        quantity: 1,
        size: chosenSize,
        color: chosenColor,
        maxStock: totalAvailableUnits
      }]);
    }
  };

  const handlePOSCheckoutDispatch = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || posCart.length === 0) {
      setErrorNotice("Please fill in walk-in client identifiers and load checkout arrays summary.");
      return;
    }

    setActionLoading(true);
    setErrorNotice('');
    setSuccessNotice('');

    const formattedPayloadItems = posCart.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      size: item.size,
      color: item.color
    }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/walk-in-order`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + admin.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          items: formattedPayloadItems
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessNotice("Over-the-counter walk-in order billed, logged, and stocked out successfully!");
        setPosCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setActiveItemSizes({});
        setActiveItemColors({});
        fetchAvailableCatalog();
        fetchSalesHistory();
      } else {
        setErrorNotice(json.message || "Transaction request rejected by backend systems router configurations.");
      }
    } catch (err) {
      setErrorNotice("Network framework transaction billing routing exception.");
    } finally {
      setActionLoading(false);
    }
  };

  const cartTotalSum = posCart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  const categoriesList = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'All' || p.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const todayDateString = new Date().toISOString().slice(0, 10);
  const recentSales = salesRecords.filter(sale => (sale.created_at || '').slice(0, 10) === todayDateString);
  const historicalSales = salesRecords
    .filter(sale => (sale.created_at || '').slice(0, 10) !== todayDateString)
    .filter(sale => {
      if (!historyStartDate && !historyEndDate) return true;
      const saleDate = (sale.created_at || '').slice(0, 10);
      if (historyStartDate && saleDate < historyStartDate) return false;
      if (historyEndDate && saleDate > historyEndDate) return false;
      return true;
    });
    return (
    <div className="p-4 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans text-slate-700 antialiased select-none">

      {errorMsg && <div className="col-span-full bg-red-50 border-l-4 border-red-500 p-3.5 text-xs text-red-700 font-bold flex items-center space-x-1.5 rounded-r-xl shadow-xs"><AlertCircle className="h-4 w-4 shrink-0" /><span>{errorMsg}</span></div>}
      {successMsg && <div className="col-span-full bg-emerald-50 border-l-4 border-emerald-500 p-3.5 text-xs text-emerald-700 font-bold flex items-center space-x-1.5 rounded-r-xl shadow-xs"><CheckCircle className="h-4 w-4 shrink-0" /><span>{successMsg}</span></div>}

      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col h-155 shadow-xs">
        <div className="pb-3 border-b flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex items-center space-x-2">
            <Grid className="h-4 w-4 text-[#1E3A8A]" />
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-400">Warehouse Storage Logs</h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <Search className="h-3.5 w-3.5 absolute left-2.5 text-slate-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search catalog..." className="bg-slate-50 border text-xs rounded-xl p-1.5 pl-8 w-40 text-slate-800 focus:outline-none" />
            </div>
            <select value={selectedCategoryFilter} onChange={(e) => setSelectedCategoryFilter(e.target.value)} className="bg-slate-50 border text-[11px] font-bold uppercase p-1.5 rounded-xl text-slate-500 focus:outline-none cursor-pointer">
              {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grow flex flex-col items-center justify-center space-y-2"><RefreshCw className="h-6 w-6 animate-spin text-[#1E3A8A]" /><span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Indexing warehouse stocks...</span></div>
        ) : (
          <div className="grow overflow-y-auto mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
            {filteredProducts.map(p => {
              const uStock = parseInt(p.stock_quantity || 0, 10);
              const sizesArray = parseArrayData(p.sizes_available);
              const colorsArray = parseArrayData(p.colors_available);
              const curSize = activeItemSizes[p.id] || (sizesArray.length > 0 ? sizesArray : '');
              const curColor = activeItemColors[p.id] || (colorsArray.length > 0 ? colorsArray : '');

              return (
                <div key={p.id} className={`border p-3 rounded-xl flex flex-col justify-between relative transition-all ${uStock > 0 ? 'bg-slate-50/40 border-slate-200' : 'bg-slate-100/70 border-slate-200 opacity-60'}`}>
                  <div className="space-y-2">
                    <div className="truncate">
                      <h4 className="font-black text-xs text-slate-800 uppercase truncate" title={p.name}>{p.name}</h4>
                      <span className="text-[9px] text-[#1E3A8A] font-black uppercase tracking-wider">KES {Number(p.is_on_offer ? p.offer_price : p.price).toLocaleString()}</span>
                    </div>

                     {(sizesArray.length > 0 || colorsArray.length > 0) && (
                        <div className="grid grid-cols-2 gap-2 pt-1 text-[9px] font-black text-slate-400 uppercase tracking-wide">
                            {sizesArray.length > 0 && (
                                <div className="space-y-0.5">
                                    <span>Size Selection:</span>
                                    <select
                                    value={activeItemSizes[p.id] || sizesArray[0] || ''}
                                    onChange={(e) => handlePOSItemAttributeChange(p.id, 'size', e.target.value)}
                                    className="w-full bg-white border p-1 rounded font-mono font-bold text-slate-700 focus:outline-none cursor-pointer"
                                    >
                                        {sizesArray.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        </div>
                                    )}
                                    {colorsArray.length > 0 && (
                                        <div className="space-y-0.5">
                                            <span>Color Variant:</span>
                                            <select
                                            value={activeItemColors[p.id] || colorsArray[0] || ''}
                                            onChange={(e) => handlePOSItemAttributeChange(p.id, 'color', e.target.value)}
                                            className="w-full bg-white border p-1 rounded font-bold text-slate-700 focus:outline-none cursor-pointer"
                                            >
                                                {colorsArray.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                </div>
                                            )}
                                            </div>
                                        )}

                                    </div>
                                    <div className="mt-4 flex justify-between items-center text-[10px] font-black uppercase border-t border-slate-200/60 pt-2">
                                    <span className={uStock <= 0 ? 'text-red-500 font-bold' : 'text-slate-400 font-bold'}>{uStock <= 0 ? 'Sold Out' : `${uStock} units left`}</span>
                                    {uStock > 0 && (
                                      <button type="button" onClick={() => handleAddProductToPOSCart(p)} className="bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-[9px] px-3 py-1.5 rounded-lg uppercase tracking-wider font-black shadow-2xs transition-colors cursor-pointer focus:outline-none">Add item</button>
                                      )}
                                      </div>
                                      </div>
                                      );
                                      })}
                                      </div>
                                    )}
      </div>
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col h-155 justify-between shadow-xs">
        <form onSubmit={handlePOSCheckoutDispatch} className="space-y-4 grow flex flex-col justify-between">
          <div className="space-y-4 flex flex-col max-h-125">
            <div className="pb-2 border-b font-black text-xs uppercase tracking-wider text-slate-400 flex items-center">
              <ShoppingCart className="h-4 w-4 mr-1.5 text-[#1E3A8A]" />
              <span>Walk-in Checkout Terminal</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold uppercase text-slate-400 tracking-wider">
              <div className="space-y-1">
                <label className="text-[9px] tracking-widest block">Customer Name:</label>
                <div className="relative">
                  <User className="h-3.5 w-3.5 absolute left-2.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Dr. Arthur"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 pl-8 text-slate-800 font-medium normal-case focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] tracking-widest block">Customer Phone:</label>
                <div className="relative">
                  <Phone className="h-3.5 w-3.5 absolute left-2.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 0712345678"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 pl-8 text-slate-800 font-medium focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-xl p-3 bg-slate-50/50 flex flex-col overflow-hidden grow">
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest pb-1 border-b mb-1">
                Invoiced Assets Summary:
              </span>
              <div className="overflow-y-auto divide-y pr-1 text-[11px] font-bold max-h-56">
                {posCart.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                    Trolley invoice array list is empty.
                  </div>
                ) : (
                  posCart.map(c => (
                    <div key={c.cart_key} className="py-2.5 flex items-center justify-between gap-4 animate-fade">
                      <div className="truncate max-w-[55%]">
                        <span className="block font-black text-slate-800 uppercase truncate" title={c.name}>{c.name}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">
                          {c.size ? `Size: ${c.size} ` : ''}{c.color ? `| Color: ${c.color}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0 select-none">
                        <button
                          type="button"
                          onClick={() => setPosCart(prev => prev.map(item => item.cart_key === c.cart_key ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item))}
                          className="p-1 border rounded-lg bg-white shadow-2xs hover:bg-slate-50 cursor-pointer"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="font-mono font-black w-4 text-center text-xs">{c.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setPosCart(prev => prev.map(item => item.cart_key === c.cart_key ? { ...item, quantity: Math.min(item.maxStock, item.quantity + 1) } : item))}
                          className="p-1 border rounded-lg bg-white shadow-2xs hover:bg-slate-50 cursor-pointer"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPosCart(prev => prev.filter(item => item.cart_key !== c.cart_key))}
                          className="text-red-500 pl-1 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-3 mt-auto">
            <div className="flex justify-between items-baseline font-black uppercase tracking-wide">
              <span className="text-[10px] text-slate-400 tracking-wider">Total Invoice Bill:</span>
              <span className="text-base text-[#1E3A8A]">KES {Number(cartTotalSum).toLocaleString()}</span>
            </div>
            <button
              type="submit"
              disabled={actionLoading || posCart.length === 0}
              className="w-full bg-[#1E3A8A] hover:bg-[#1D4ED8] disabled:bg-slate-300 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl cursor-pointer flex items-center justify-center space-x-1.5 focus:outline-none shadow-xs transition-colors"
            >
              {actionLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              <span>Process & Mark Delivered Instantly</span>
            </button>
          </div>
        </form>
      </div>

      <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-5 mt-4 shadow-2xs space-y-3">
        <div className="pb-2 border-b flex items-center justify-between text-slate-700">
          <div className="flex items-center space-x-1.5">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-400">Recent Sales — Today ({recentSales.length})</h3>
          </div>
          <button
            type="button"
            onClick={fetchSalesHistory}
            className="flex items-center space-x-1 text-[9px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${salesHistoryLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[9px] border-b uppercase">
                <th className="p-3">Walk-in Client Details</th>
                <th className="p-3">Items Ordered Summary</th>
                <th className="p-3 text-right">Invoiced Bill</th>
                <th className="p-3">Delivered On</th>
                <th className="p-3 text-center">Fulfillment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-600">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-400 font-bold uppercase tracking-wide text-[9px] bg-slate-50/20 italic">
                    No walk-in sales processed yet today.
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={`recent-sale-row-${sale.id}`} className="hover:bg-slate-50/50 animate-fade">
                    <td className="p-3">
                      <span className="block font-black text-slate-800">{sale.customer_name}</span>
                      <span className="text-[10px] font-mono text-slate-400">📞 {sale.customer_phone}</span>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        {(sale.items_summary || []).map((itm, iIdx) => (
                          <span key={iIdx} className="block text-slate-700 font-medium normal-case">
                            {itm.quantity}x {itm.name} {itm.size ? `(Size: ${itm.size})` : ''} {itm.color ? `(Color: ${itm.color})` : ''}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-black text-[#1E3A8A]">
                      KES {Number(sale.total_price).toLocaleString()}
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px] normal-case">
                      {sale.created_at ? new Date(sale.created_at).toLocaleString('en-KE') : '—'}
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black tracking-widest px-2.5 py-1 rounded-md border border-emerald-200">
                        ✅ SOLD & DELIVERED
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
        <button
          type="button"
          onClick={() => setSalesHistoryOpen(!salesHistoryOpen)}
          className="w-full flex justify-between items-center cursor-pointer focus:outline-none"
        >
          <h3 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center">
            <History className="h-4 w-4 text-slate-400 mr-1.5" />
            <span>Walk-in Sales History ({historicalSales.length})</span>
          </h3>
          <span className="text-[10px] font-black uppercase text-slate-400">{salesHistoryOpen ? 'Hide ▲' : 'Show ▼'}</span>
        </button>

        {salesHistoryOpen && (
          <div className="space-y-4 pt-2 border-t border-dashed border-slate-100">
            <div className="flex flex-wrap gap-3 items-center text-xs font-bold text-slate-500">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>Search sales delivered between:</span>
              <input type="date" value={historyStartDate} onChange={(e) => setHistoryStartDate(e.target.value)} className="bg-slate-50 border p-2 rounded-lg focus:outline-none" />
              <span>and</span>
              <input type="date" value={historyEndDate} onChange={(e) => setHistoryEndDate(e.target.value)} className="bg-slate-50 border p-2 rounded-lg focus:outline-none" />
              {(historyStartDate || historyEndDate) && (
                <button type="button" onClick={() => { setHistoryStartDate(''); setHistoryEndDate(''); }} className="text-[10px] uppercase font-black text-slate-400 hover:text-slate-600 cursor-pointer">Clear</button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[9px] border-b uppercase">
                    <th className="p-3">Walk-in Client Details</th>
                    <th className="p-3">Items Ordered Summary</th>
                    <th className="p-3 text-right">Invoiced Bill</th>
                    <th className="p-3">Delivered On</th>
                    <th className="p-3 text-center">Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-600">
                  {historicalSales.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-10 text-slate-400 font-bold uppercase tracking-wide text-[9px] bg-slate-50/20 italic">
                        No past walk-in sales match this date range.
                      </td>
                    </tr>
                  ) : (
                    historicalSales.map((sale) => (
                      <tr key={`history-sale-row-${sale.id}`} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <span className="block font-black text-slate-800">{sale.customer_name}</span>
                          <span className="text-[10px] font-mono text-slate-400">📞 {sale.customer_phone}</span>
                        </td>
                        <td className="p-3">
                          <div className="space-y-0.5">
                            {(sale.items_summary || []).map((itm, iIdx) => (
                              <span key={iIdx} className="block text-slate-700 font-medium normal-case">
                                {itm.quantity}x {itm.name} {itm.size ? `(Size: ${itm.size})` : ''} {itm.color ? `(Color: ${itm.color})` : ''}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono font-black text-[#1E3A8A]">
                          KES {Number(sale.total_price).toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-[10px] normal-case">
                          {sale.created_at ? new Date(sale.created_at).toLocaleString('en-KE') : '—'}
                        </td>
                        <td className="p-3 text-center">
                          <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black tracking-widest px-2.5 py-1 rounded-md border border-emerald-200">
                            ✅ SOLD & DELIVERED
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}