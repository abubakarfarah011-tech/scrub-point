import { useState } from 'react';
import { X, Trash2, ShoppingBag, MessageSquare } from 'lucide-react';
import { useCart } from '../context/useCart';
import { ApiService } from '../services/api';

export default function CartDrawer({ isOpen, onClose }) {
  const { cart, removeFromCart, clearCart } = useCart();

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  if (!isOpen) return null;

  const cartSubtotal = cart.reduce((total, item) => total + (Number(item.price || 0) * item.quantity), 0);

  const computedTotalItemsSum = cart?.reduce((accum, item) => accum + parseInt(item.quantity || 1, 10), 0) || 0;
  const computedTotalBillPrice = cart?.reduce((accum, item) => accum + (Number(item.price || 0) * parseInt(item.quantity || 1, 10)), 0) || 0;

  const handleSendGroupWhatsAppOrder = async () => {
    if (cart.length === 0 || checkoutLoading) return;

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
          setCheckoutError(`Only ${availableStock} of "${item.name}" are currently available (you selected ${item.quantity}).`);
          setCheckoutLoading(false);
          return;
        }

        let details = `Quantity: ${item.quantity}`;
        if (item.size) details += ` | Size: ${item.size}`;
        if (item.color) details += ` | Color: ${item.color}`;
        if (item.custom_measurements?.trim()) details += ` | Measurements: ${item.custom_measurements.trim()}`;

        let response;
        try {
          response = await ApiService.orders.logWhatsAppClick({
            product_id: item.id,
            product_name: item.name,
            variant_details: details,
            quantity: Number(item.quantity || 1),
            total_price: Number(item.price || 0) * item.quantity
          });
        } catch (err) {
          setCheckoutError(err.message || 'Unable to register your order. Please try again.');
          setCheckoutLoading(false);
          return;
        }

        if (!response.success) {
          setCheckoutError(response.message || `Unable to register your order for "${item.name}".`);
          setCheckoutLoading(false);
          return;
        }

        if (response.data?.order_ref) collectedOrderRefs.push(response.data.order_ref);
      }

      const myRealPhoneNumber = "254116643999";

      let messageString =
  `*NEW ORDER - SCRUB POINT KENYA*\n\n` +
  `*Order Refs:* ${collectedOrderRefs.join(', ') || 'N/A'}\n` +
  `*Items Ordered:* ${cart.length}\n\n`;

cart.forEach((item, index) => {
  const itemSubtotal = Number(item.price || 0) * Number(item.quantity || 1);

  messageString +=
    `*${index + 1}. ${item.name}*\n` +
    `*Quantity:* ${item.quantity}\n`;

  if (item.size) {
    messageString += `*Size:* ${item.size}\n`;
  }

  if (item.color) {
    messageString += `*Color:* ${item.color}\n`;
  }

  if (item.custom_measurements?.trim()) {
    messageString +=
      `*Measurements:* ${item.custom_measurements.trim()}\n`;
  }

  messageString +=
    `*Unit Price:* KES ${Number(item.price || 0).toLocaleString()}\n` +
    `*Subtotal:* KES ${itemSubtotal.toLocaleString()}\n\n`;
});

messageString +=
  `*ORDER TOTAL: KES ${computedTotalBillPrice.toLocaleString()}*\n\n` +
  `Please confirm availability, payment and delivery details.`;

      const encodedMessage = encodeURIComponent(messageString);
      window.open("https://wa.me/" + myRealPhoneNumber + "?text=" + encodedMessage, '_blank');
      clearCart();
      onClose();

    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-800 shadow-2xl flex flex-col h-full border-l border-slate-200 dark:border-slate-700">

          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-5 w-5 text-medical-500" />
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">Your Shopping Bag ({cart.length})</h3>
            </div>
            <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg focus:outline-none cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grow p-6 overflow-y-auto space-y-4 min-h-0">
            {cart.length === 0 ? (
              <div className="text-center py-24 space-y-3">
                <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto" />
                <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase">Your Cart is Empty</h4>
                <p className="text-xs text-slate-400 max-w-50 mx-auto font-medium">Add premium items from our catalog to get started.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700 space-y-4">
                {cart.map((item) => (
                  <div key={item.cart_key} className="flex items-start justify-between gap-4 pt-4 first:pt-0 group">
                    <div className="flex items-start space-x-3.5">
                      <div className="h-16 w-16 bg-slate-50 dark:bg-slate-700 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-600 grid place-items-center shrink-0">
                        {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <div className="text-[9px] text-slate-400 font-bold uppercase">No Pic</div>}
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-snug line-clamp-2 uppercase">{item.name}</h4>
                        <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                          <span className="bg-slate-100 dark:bg-slate-700 border dark:border-slate-600 px-1.5 py-0.5 rounded">Qty: {item.quantity}</span>
                          {item.size && <span className="bg-slate-100 dark:bg-slate-700 border dark:border-slate-600 px-1.5 py-0.5 rounded">Size: {item.size}</span>}
                          {item.color && <span className="bg-slate-100 dark:bg-slate-700 border dark:border-slate-600 px-1.5 py-0.5 rounded">Color: {item.color}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2 shrink-0">
                      <span className="text-sm font-black text-slate-800 dark:text-medical-400">KES {(Number(item.price || 0) * item.quantity).toLocaleString()}</span>
                      <button type="button" onClick={() => removeFromCart(item.cart_key)} className="p-1.5 text-slate-300 hover:text-red-500 rounded transition-colors cursor-pointer" title="Remove Product Line">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {cart.length > 0 && (
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Total Summary Amount:</span>
                <div className="flex items-baseline space-x-0.5">
                  <span className="text-xs font-bold text-slate-400 uppercase">KES</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{cartSubtotal.toLocaleString()}</span>
                </div>
              </div>

              {checkoutError && (
                <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-3 rounded-r-xl text-xs font-bold">
                  {checkoutError}
                </div>
              )}

              <button
                type="button"
                onClick={handleSendGroupWhatsAppOrder}
                disabled={checkoutLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black uppercase text-xs tracking-wider py-4 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer hover:shadow-md"
              >
                <MessageSquare className="h-4 w-4" />
                <span>{checkoutLoading ? 'Verifying & Registering Order...' : 'Send Bulk Order to WhatsApp Chat'}</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}