import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/useCart';
import { ShieldCheck, ShoppingCart, Trash2, Menu, X, Sun, Moon, MessageCircle } from 'lucide-react';
import { ApiService } from '../services/api';

export default function Navbar() {
  const { cart, removeFromCart, clearCart } = useCart();
  const location = useLocation();
  const [mobileOpen, setMobileMenuOpen] = useState(false);
  const [cartPanelOpen, setCartPanelOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const [themeMode, setThemeMode] = useState(() => {
    const savedLocalTheme = localStorage.getItem('theme');
    if (savedLocalTheme) return savedLocalTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const documentRootNode = document.documentElement;
    const documentBodyNode = document.body;

    if (themeMode === 'dark') {
      documentRootNode.classList.add('dark');
      documentRootNode.style.colorScheme = 'dark';
      documentBodyNode.style.backgroundColor = '#0B192C';
      documentBodyNode.style.color = '#FFFFFF';

      const mainAppContainer = document.querySelector('.min-h-screen');
      if (mainAppContainer) {
        mainAppContainer.style.backgroundColor = '#0B192C';
        mainAppContainer.style.color = '#FFFFFF';
      }

      localStorage.setItem('theme', 'dark');
    } else {
      documentRootNode.classList.remove('dark');
      documentRootNode.style.colorScheme = 'light';
      documentBodyNode.style.backgroundColor = '#FFFFFF';
      documentBodyNode.style.color = '#1E293B';

      const mainAppContainer = document.querySelector('.min-h-screen');
      if (mainAppContainer) {
        mainAppContainer.style.backgroundColor = '#FFFFFF';
        mainAppContainer.style.color = '#1E293B';
      }

      localStorage.setItem('theme', 'light');
    }
  }, [themeMode]);

  const handleToggleThemeEnvironment = () => {
    setThemeMode(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const isActive = (path) => location.pathname === path;

  const computedTotalItemsSum = cart?.reduce((accum, item) => accum + parseInt(item.quantity || 1, 10), 0) || 0;
  const computedTotalBillPrice = cart?.reduce((accum, item) => accum + (Number(item.price || 0) * parseInt(item.quantity || 1, 10)), 0) || 0;

  const handleSendCartWhatsAppOrder = async () => {
    if (!cart || cart.length === 0 || checkoutLoading) return;

    setCheckoutLoading(true);
    setCheckoutError('');

    const collectedOrderRefs = [];

    try {
      for (const item of cart) {
        const isBundlePack = String(item.id).startsWith('package-');

        if (isBundlePack) {
          const numericPackageId = String(item.id).replace('package-', '');
          const response = await ApiService.orders.logWhatsAppClick({
            package_id: numericPackageId,
            product_name: item.name,
            quantity: Number(item.quantity || 1),
            variant_details: `Quantity: ${item.quantity}`,
            total_price: Number(item.price || 0) * item.quantity
          });
          if (!response.success) {
            setCheckoutError(response.message || `Unable to register your order for "${item.name}".`);
            setCheckoutLoading(false);
            return;
          }
          if (response.data?.order_ref) collectedOrderRefs.push(response.data.order_ref);
          continue;
        }

        let latest;
        try {
          latest = await ApiService.products.getById(item.id);
        } catch (err) {
          setCheckoutError(err.message || `Could not verify "${item.name}". Please try again.`);
          setCheckoutLoading(false);
          return;
        }

        if (!latest.success || !latest.data) {
          setCheckoutError(`"${item.name}" could not be found — it may have been removed from the catalog.`);
          setCheckoutLoading(false);
          return;
        }

        const availableStock = Number(latest.data.stock_quantity || 0);
        if (availableStock <= 0) {
          setCheckoutError(`Sorry, "${item.name}" just went out of stock.`);
          setCheckoutLoading(false);
          return;
        }
        if (item.quantity > availableStock) {
          setCheckoutError(`Only ${availableStock} of "${item.name}" are currently available.`);
          setCheckoutLoading(false);
          return;
        }

        let details = `Quantity: ${item.quantity}`;
        if (item.size) details += ` | Size: ${item.size}`;
        if (item.color) details += ` | Color: ${item.color}`;
        if (item.custom_measurements?.trim()) details += ` | Measurements: ${item.custom_measurements.trim()}`;

        const response = await ApiService.orders.logWhatsAppClick({
          product_id: item.id,
          product_name: item.name,
          variant_details: details,
          quantity: Number(item.quantity || 1),
          total_price: Number(item.price || 0) * item.quantity
        });

        if (!response.success) {
          setCheckoutError(response.message || `Unable to register your order for "${item.name}".`);
          setCheckoutLoading(false);
          return;
        }

        if (response.data?.order_ref) collectedOrderRefs.push(response.data.order_ref);
      }

      const corporatePhoneNumber = "254116643999";

      let messageString = `Order Refs: ${collectedOrderRefs.join(', ') || 'N/A'}\n\n` +
                            "Hi Scrub Point, I want to order the following multiple items from your store:\n\n" +
                            "===============================\n";

      cart.forEach((item, index) => {
        messageString += `${index + 1}. 📦 Item: ${item.name}\n` +
                         `   🆔 ID: #${item.id} | 🔢 Qty: ${item.quantity}\n`;
        if (item.size) messageString += `   📏 Size: ${item.size}\n`;
        if (item.color) messageString += `   🎨 Color: ${item.color}\n`;
        if (item.custom_measurements?.trim()) messageString += `   🪡 Custom Fit: ${item.custom_measurements.trim()}\n`;
        messageString += `   💰 Sub-Price: KES ${(Number(item.price || 0) * item.quantity).toLocaleString()}\n` +
                         "-------------------------------\n";
      });

      messageString += `\n💵 Combined Invoice Bill: KES ${computedTotalBillPrice.toLocaleString()}\n\n` +
                       "Please let me know how to proceed with payment and delivery details!";

      const encodedMessage = encodeURIComponent(messageString);
      window.open("https://wa.me/" + corporatePhoneNumber + "?text=" + encodedMessage, '_blank');
      clearCart();
      setCartPanelOpen(false);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <nav className="bg-[#1E3A8A] text-white border-b border-[#1D4ED8] sticky top-0 z-50 shadow-md transition-colors duration-200 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          <Link to="/" className="flex items-center space-x-2 shrink-0 cursor-pointer focus:outline-none">
            <ShieldCheck className="h-5 w-5 text-white animate-pulse" />
            <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-white">
              Scrub Point
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-6 text-[10px] font-black uppercase tracking-widest text-slate-200">
            <Link to="/" className={`hover:text-white transition-colors cursor-pointer ${isActive('/') ? 'text-white border-b-2 border-white pb-1' : ''}`}>Home Center</Link>
            <Link to="/products" className={`hover:text-white transition-colors cursor-pointer ${isActive('/products') ? 'text-white border-b-2 border-white pb-1' : ''}`}>Products Catalog</Link>
            <Link to="/about" className={`hover:text-white transition-colors cursor-pointer ${isActive('/about') ? 'text-white border-b-2 border-white pb-1' : ''}`}>About Us</Link>
            <Link to="/contact" className={`hover:text-white transition-colors cursor-pointer ${isActive('/contact') ? 'text-white border-b-2 border-white pb-1' : ''}`}>Contact & Support</Link>
          </div>

          <div className="flex items-center space-x-2 shrink-0">

            <button
              type="button"
              onClick={handleToggleThemeEnvironment}
              className="p-2 text-slate-200 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer focus:outline-none"
              title={themeMode === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {themeMode === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-200" />}
            </button>

            <button
              type="button"
              onClick={() => setCartPanelOpen(!cartPanelOpen)}
              className="relative p-2.5 text-slate-200 hover:text-white transition-colors cursor-pointer focus:outline-none hover:bg-white/10 rounded-xl"
              title="Toggle Checkout Scrub Point Trolley Drawer"
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              {computedTotalItemsSum > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-red-500 text-white font-black text-[8px] h-3.5 w-3.5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {computedTotalItemsSum}
                </span>
              )}
            </button>

            <button type="button" onClick={() => setMobileMenuOpen(!mobileOpen)} className="md:hidden p-1.5 text-slate-300 hover:text-white focus:outline-none cursor-pointer">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>

      {cartPanelOpen && (
        <div className="absolute right-4 top-16 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 text-slate-800 dark:text-white animate-scale z-50 text-xs font-semibold">
          <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800 mb-3">
            <h4 className="font-black uppercase text-[10px] tracking-wider text-slate-500 flex items-center">
              <ShoppingCart className="h-3.5 w-3.5 mr-1 text-[#1E3A8A] dark:text-sky-400" />
              <span>Scrub Point Trolley Cart</span>
            </h4>
            <button onClick={() => setCartPanelOpen(false)} className="text-slate-400 hover:text-red-500 cursor-pointer"><X className="h-4 w-4" /></button>
          </div>

          {cart && cart.length === 0 ? (
            <p className="text-center py-6 text-slate-400 uppercase text-[10px] tracking-wide font-bold italic">Your shopping trolley is currently empty.</p>
          ) : (
            <div className="space-y-3">
              <div className="max-h-48 overflow-y-auto divide-y dark:divide-slate-800 pr-1">
                {cart.map((item) => (
                  <div key={item.cart_key} className="flex items-center justify-between py-3 border-b border-slate-100 animate-fade">
                    <div className="flex items-center space-x-2.5 truncate max-w-[70%]">
                      <div className="h-10 w-10 border bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                        {item.image_url ? <img src={item.image_url} alt="" className="object-contain h-full w-full" /> : <div className="text-[10px]">📦</div>}
                      </div>
                      <div className="truncate">
                        <h4 className="font-black text-slate-800 uppercase truncate text-[11px]">{item.name}</h4>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide">
                          {item.quantity}x @ KES {Number(item.price).toLocaleString()}
                          {item.size ? ` | Fit: ${item.size}` : ''}
                          {item.color ? ` | Variant: ${item.color}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (item) {
                          const purgeTargetToken = item.cart_key || item.id;
                          removeFromCart(purgeTargetToken);
                        }
                      }}
                      className="p-2 border-2 border-red-100 hover:border-red-500 rounded-xl bg-red-50/40 text-red-500 hover:bg-red-50 hover:scale-105 transition-all cursor-pointer focus:outline-none shrink-0"
                      title="Remove from bucket"
                    >
                      <Trash2 className="h-3.5 w-3.5 pointer-events-none" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t dark:border-slate-800 flex justify-between items-baseline text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span>Trolley Total Sub-Bill:</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">KES {computedTotalBillPrice.toLocaleString()}</span>
              </div>

              {checkoutError && (
                <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-2.5 rounded-r-xl text-[10px] font-bold">
                  {checkoutError}
                </div>
              )}

              <button
                type="button"
                onClick={handleSendCartWhatsAppOrder}
                className="w-full flex items-center justify-center space-x-1.5 text-center bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest py-3 rounded-xl shadow-xs transition-colors mt-2 cursor-pointer focus:outline-none"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>{checkoutLoading ? 'Verifying & Registering...' : 'Conclude Checkout On WhatsApp Now'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {mobileOpen && (
        <div className="md:hidden bg-[#1E3A8A] border-t border-[#1D4ED8] py-4 px-5 flex flex-col space-y-3 text-[10px] font-black uppercase tracking-widest text-slate-300 animate-fade">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className={`py-1 ${isActive('/') ? 'text-white' : ''}`}>Home Center</Link>
          <Link to="/products" onClick={() => setMobileMenuOpen(false)} className={`py-1 ${isActive('/products') ? 'text-white' : ''}`}>Products Catalog</Link>
          <Link to="/about" onClick={() => setMobileMenuOpen(false)} className={`py-1 ${isActive('/about') ? 'text-white' : ''}`}>About Us</Link>
          <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className={`py-1 ${isActive('/contact') ? 'text-white' : ''}`}>Contact & Support</Link>
        </div>
      )}
    </nav>
  );
}