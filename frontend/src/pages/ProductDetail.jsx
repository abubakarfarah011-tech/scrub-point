import { supabase } from '../supabaseClient';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ApiService } from '../services/api';
import { useCart } from '../context/useCart';
import {
  ShoppingBag, ChevronRight, RefreshCw, AlertCircle, ShieldCheck,
  Truck, Scissors, Check, Palette, Info, MessageCircle,
  Star, ArrowRight, Package, ShoppingCart, ClipboardList
} from 'lucide-react';
import ReviewSection from '../components/ReviewSection';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart, cart } = useCart();

  const [product, setProduct] = useState(null);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [successNotice, setSuccessNotice] = useState(false);
  const [customUserMeasurements, setCustomUserMeasurements] = useState('');
  const [whatsAppLoading, setWhatsAppLoading] = useState(false);
  const [cartLimitError, setCartLimitError] = useState('');

  const parseArrayData = (targetField) => {
    if (!targetField) return [];
    if (Array.isArray(targetField)) return targetField;
    if (typeof targetField === 'string') {
      const cleaned = targetField.replace(/[{}]/g, '');
      return cleaned.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  function int(val) {
    return parseInt(val || 0, 10);
  }

  useEffect(() => {
    const loadProductProfileAndSuggestions = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await ApiService.products.getById(id);
        if (res.success && res.data) {
          setProduct(res.data);

          const safeSizes = parseArrayData(res.data.sizes_available).filter(s => s !== "__CUSTOM_MEASUREMENT_ENABLED__");
          const safeColors = parseArrayData(res.data.colors_available);

          if (safeSizes.length > 0 && !safeSizes.some(s => String(s).toUpperCase() === 'NONE')) {
            setSelectedSize(safeSizes[0]);
          } else {
            setSelectedSize('');
          }

          if (safeColors.length > 0 && !safeColors.some(c => String(c).toUpperCase() === 'NONE')) {
            setSelectedColor(safeColors[0]);
          } else {
            setSelectedColor('');
          }

          const catalogRes = await ApiService.products.getAll(1, 12);
          if (catalogRes.success && catalogRes.data) {
            const filterSuggestions = catalogRes.data.filter(p => String(p.id) !== String(id)).slice(0, 4);
            setSuggestedProducts(filterSuggestions);
          }
        } else {
          setError('We could not find this product in our store inventory right now.');
        }
      } catch (err) {
        setError('Network error. Failed to connect to the Scrub Point database.');
      } finally {
        setLoading(false);
      }
    };
    loadProductProfileAndSuggestions();
  }, [id]);


useEffect(() => {
  const singleProductChannel = supabase
    .channel(`product-${id}-realtime`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "products", filter: `id=eq.${id}` },
      (payload) => {
        setProduct(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(singleProductChannel);
  };
}, [id]);

  const getCleanList = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.filter(s => s && String(s).toUpperCase() !== 'NONE' && String(s).toUpperCase() !== 'NULL');
    }
    if (typeof val === 'string') {
      const cleanStr = val.replace(/[{}]/g, '');
      return cleanStr
        .split(',')
        .map(s => s.trim())
        .filter(s => s && String(s).toUpperCase() !== 'NONE' && String(s).toUpperCase() !== 'NULL');
    }
    return [];
  };

  const sanitizeAndExtractNum = (rawVal) => {
    if (rawVal === undefined || rawVal === null || rawVal === '') return 0;
    const pureNumericString = String(rawVal).replace(/[^0-9.]/g, '').trim();
    const parsedOutput = parseFloat(pureNumericString);
    return isNaN(parsedOutput) ? 0 : parsedOutput;
  };

  const triggerWhatsAppOrderRoutingUrl = (orderRef) => {
    if (!product) return '#';

    const corporatePhoneNumber = "254116643999";
    let sizingDetailsTextLine = `*Size Choice:* ${selectedSize || 'Not Selected'}`;

    if (customUserMeasurements.trim() !== '') {
      sizingDetailsTextLine = `*Custom Sizing Parameters:* ${customUserMeasurements}`;
    }

    const originalPriceNum = sanitizeAndExtractNum(product.price || product.Price);
    const offerPriceNum = sanitizeAndExtractNum(
      product.discount_price ||
      product.discounted_price ||
      product.offer_price ||
      product.Offer_Price ||
      product.OFFER_PRICE
    );

    const hasActiveSaleMarkdown = product.is_on_offer === true ||
      String(product.is_on_offer).toLowerCase() === 'true' ||
      String(product.is_on_offer).toUpperCase() === 'YES';

    const displayPrice = (hasActiveSaleMarkdown && offerPriceNum > 0) ? offerPriceNum : originalPriceNum;
    const totalOrderPrice = displayPrice * purchaseQuantity;

    const compiledWhatsAppMessageString = encodeURIComponent(
  `*NEW ORDER - SCRUB POINT KENYA*\n\n` +
  `*Order Ref:* ${orderRef || 'N/A'}\n` +
  `*Product:* ${product.name}\n` +
  `${sizingDetailsTextLine}\n` +
  `*Color:* ${selectedColor || 'Default'}\n` +
  `*Quantity:* ${purchaseQuantity} Set(s)\n` +
  `*Unit Price:* KES ${displayPrice.toLocaleString()}\n` +
  `*Total Price:* KES ${totalOrderPrice.toLocaleString()}\n` +
  `*Description:* ${product.description || 'N/A'}`
);

   return `https://wa.me/${corporatePhoneNumber}?text=${compiledWhatsAppMessageString}`;
  };

  const handleWhatsAppOrder = async () => {
    if (!product || whatsAppLoading) return;

    setWhatsAppLoading(true);

    try {
        const latest = await ApiService.products.getById(product.id);

        if (!latest.success || !latest.data) {
          alert("Unable to verify stock.");
          return;
        }

        if (Number(latest.data.stock_quantity) <= 0) {
          alert("Sorry.\nThis item just went out of stock.");
          return;
        }

        if (purchaseQuantity > Number(latest.data.stock_quantity)) {
          alert(
            `Only ${latest.data.stock_quantity} item(s) are currently available.`
          );
          return;
        }

        const variantDetails = [
            `Size: ${selectedSize || "Default"}`,
            `Color: ${selectedColor || "Default"}`,
            `Quantity: ${purchaseQuantity}`,
            customUserMeasurements
                ? `Measurements: ${customUserMeasurements}`
                : null,
        ]
            .filter(Boolean)
            .join(" | ");

        const orderPayload = {
          product_id: product.id,
          product_name: product.name,
          quantity: purchaseQuantity,
          variant_details: variantDetails,
          total_price: effectiveTotalPrice,
        };

        const response = await ApiService.orders.logWhatsAppClick(orderPayload);

        if (!response.success) {
            alert(response.message || "Unable to register your order.Please try again.");
            return;
        }

        const orderRef = response.data?.order_ref;
        window.open(triggerWhatsAppOrderRoutingUrl(orderRef), "_blank");
    } catch (err) {
        alert(err?.message || "Unable to register your order.Please try again.");
    } finally {
        setWhatsAppLoading(false);
    }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B192C] flex flex-col items-center justify-center space-y-2 text-xs font-black uppercase text-slate-400 tracking-widest animate-pulse">
        <RefreshCw className="h-6 w-6 animate-spin text-[#1E3A8A]" />
        <span>Syncing Our Products Page...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B192C] px-4 flex flex-col items-center justify-center space-y-4 text-xs font-bold text-slate-500 max-w-md mx-auto text-center uppercase">
        <AlertCircle className="h-8 w-8 text-red-500 animate-bounce" />
        <p>{error || 'Product context file index missing.'}</p>
        <Link to="/products" className="bg-[#1E3A8A] text-white px-5 py-2.5 rounded-xl font-black tracking-widest shadow-xs">Return to Depot</Link>
      </div>
    );
  }

  const originalPriceNum = sanitizeAndExtractNum(product.price || product.Price);
  const offerPriceNum = sanitizeAndExtractNum(
    product.discount_price ||
    product.discounted_price ||
    product.offer_price ||
    product.Offer_Price ||
    product.OFFER_PRICE
  );

  const hasActiveSaleMarkdown = product.is_on_offer === true ||
    String(product.is_on_offer).toLowerCase() === 'true' ||
    String(product.is_on_offer).toUpperCase() === 'YES';

  const parsedSizes = parseArrayData(product.sizes_available).filter(s => s !== "__CUSTOM_MEASUREMENT_ENABLED__");
  const parsedColors = parseArrayData(product.colors_available);
  const totalStockCount = int(product.stock_quantity);
  const isOutOfStock = totalStockCount <= 0;
  const hasCustomMeasurementOption = String(product.sizes_available).includes('__CUSTOM_MEASUREMENT_ENABLED__');

  const effectiveUnitPrice = (hasActiveSaleMarkdown && offerPriceNum > 0) ? offerPriceNum : originalPriceNum;
  const effectiveTotalPrice = effectiveUnitPrice * purchaseQuantity;

  const handleAddToCartDispatcher = () => {
    if (isOutOfStock) return;

    const matchingCartKey = `${product.id}-${(parsedSizes.length > 0 ? selectedSize : null) || 'uni'}-${(parsedColors.length > 0 ? selectedColor : null) || 'uni'}`;
    const existingCartItem = cart.find(item => item.cart_key === matchingCartKey);
    const alreadyInCart = existingCartItem ? existingCartItem.quantity : 0;

    if (alreadyInCart + purchaseQuantity > totalStockCount) {
      const remaining = totalStockCount - alreadyInCart;
      if (remaining <= 0) {
        setCartLimitError(`You already have all ${totalStockCount} available units of this item in your cart.`);
      } else {
        setCartLimitError(`Only ${remaining} more can be added — you already have ${alreadyInCart} in your cart.`);
      }
      return;
    }

    setCartLimitError('');

    const checkoutItemPayload = {
      id: product.id,
      name: product.name,
      price: effectiveUnitPrice,
      image_url: product.image_url,
      quantity: purchaseQuantity,
      size: parsedSizes.length > 0 ? selectedSize : null,
      color: parsedColors.length > 0 ? selectedColor : null,
      custom_measurements: hasCustomMeasurementOption ? customUserMeasurements : null,
    };

    addToCart(checkoutItemPayload);
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B192C] text-slate-800 dark:text-slate-100 transition-colors duration-200">

      <div className="bg-white dark:bg-[#1E3A8A]/10 border-b border-slate-200 dark:border-slate-800 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center space-x-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
          <Link to="/" className="hover:text-[#1E3A8A] transition-colors">Home Store</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/products" className="hover:text-[#1E3A8A] transition-colors">Uniform Catalog</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-600 dark:text-slate-200 truncate max-w-45">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex items-center justify-center min-h-75 sm:min-h-105 relative group overflow-hidden">
              {product.image_url ? (
                <img
                src={product.image_url}
                alt={product.name}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="max-h-65 sm:max-h-90 object-contain rounded-2xl group-hover:scale-[1.02] transition-transform duration-300"
                />
              ) : (
                <div className="text-center p-6 text-slate-300 space-y-2">
                  <Package className="h-12 w-12 mx-auto animate-pulse" />
                  <p className="text-[9px] font-black tracking-widest uppercase">No Image Logged</p>
                </div>
              )}

              <div className="absolute top-4 left-4 select-none">
                <span className={`text-[8px] font-black px-2 py-1 rounded-md tracking-widest border uppercase ${
                  isOutOfStock
                    ? 'bg-red-50 text-red-500 border-red-100 dark:bg-red-950/40 dark:border-red-900'
                    : totalStockCount <= 5
                      ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/40 dark:border-amber-900 animate-pulse'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900'
                }`}>
                  {isOutOfStock ? 'Sold Out' : `${totalStockCount} Sets Left`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-bold uppercase tracking-wider text-slate-400">
              <div className="bg-white dark:bg-slate-900/40 border dark:border-slate-800 p-3 rounded-2xl space-y-1">
                <ShieldCheck className="h-4 w-4 text-[#1E3A8A] mx-auto" />
                <p className="text-slate-600 dark:text-slate-300">Premium Textile</p>
              </div>
              <div className="bg-white dark:bg-slate-900/40 border dark:border-slate-800 p-3 rounded-2xl space-y-1">
                <Truck className="h-4 w-4 text-[#1E3A8A] mx-auto" />
                <p className="text-slate-600 dark:text-slate-300">Country Delivery</p>
              </div>
              <div className="bg-white dark:bg-slate-900/40 border dark:border-slate-800 p-3 rounded-2xl space-y-1">
                <ClipboardList className="h-4 w-4 text-[#1E3A8A] mx-auto" />
                <p className="text-slate-600 dark:text-slate-300">MoH Compliant</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">

            <div className="space-y-1">
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md font-black uppercase text-[#1E3A8A] dark:text-sky-400 tracking-wider">
                {product.category || 'General Apparel'}
              </span>
              <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white pt-2 leading-tight">
                {product.name}
              </h1>
            </div>
            <div className="border-y border-dashed border-slate-200 dark:border-slate-800 py-4 select-none">
              {hasActiveSaleMarkdown && offerPriceNum > 0 ? (
                <div className="space-y-1">
                  <div className="text-xl sm:text-2xl font-black text-[#1E3A8A] dark:text-sky-400 flex flex-wrap items-center gap-2">
                    <span className="bg-amber-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-widest font-sans animate-pulse">
                      ⚡ Flash Sale Deal
                    </span>
                    <span>KES {offerPriceNum.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    <span>Original Cost:</span>{' '}
                    <span className="line-through">KES {originalPriceNum.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  <span>KES {originalPriceNum.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center">
                <Info className="h-3.5 w-3.5 mr-1 text-[#1E3A8A]" /> Garment Specifications Summary
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed normal-case max-w-2xl">
                {product.description || 'No descriptive overview parameters logged for this store catalog record sequence.'}
              </p>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">

              {getCleanList(product.sizes_available).filter(s => s !== "__CUSTOM_MEASUREMENT_ENABLED__").length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 block tracking-widest uppercase">
                    Select Fit Size Parameter:
                  </span>
                  <div className="flex flex-wrap gap-2 select-none">
                    {getCleanList(product.sizes_available)
                      .filter(sizeToken => sizeToken !== "__CUSTOM_MEASUREMENT_ENABLED__")
                      .map((size) => (
                        <button
                          key={`size-btn-${size}`}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider border-2 transition-all focus:outline-none cursor-pointer ${
                            selectedSize === size
                              ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                          }`}
                        >
                          {size}
                        </button>
                      ))
                    }
                  </div>
                </div>
              )}

              {getCleanList(product.colors_available).length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 block tracking-widest uppercase">
                    Select Fabric Color Parameter:
                  </span>
                  <div className="flex flex-wrap gap-2 select-none">
                    {getCleanList(product.colors_available).map((color) => (
                      <button
                        key={`color-btn-${color}`}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider border-2 transition-all focus:outline-none cursor-pointer ${
                          selectedColor === color
                            ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasCustomMeasurementOption && (
                <div className="bg-sky-50/60 dark:bg-slate-800/40 border-2 border-dashed border-[#1E3A8A]/30 p-4 rounded-2xl space-y-2.5 mt-2 animate-scale w-full block select-none">
                  <div className="flex items-center space-x-1.5 text-[#1E3A8A] dark:text-sky-400">
                    <Scissors className="h-4 w-4 mr-0.5 text-[#1E3A8A]" />
                    <span className="text-[10px] font-black uppercase tracking-wider block">
                      Or Type Your Custom Sizing Specifications Below:
                    </span>
                  </div>

                  <textarea
                    rows="2"
                    value={customUserMeasurements}
                    onChange={(e) => {
                      setCustomUserMeasurements(e.target.value);
                      if (e.target.value.trim() !== '') {
                        setSelectedSize('Custom Sized');
                      }
                    }}
                    placeholder="Type your shoulder widths, waist dimensions, chest sizes, or preferred garment sleeve length guidelines here using numbers or text..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white normal-case focus:outline-none focus:border-[#1E3A8A] resize-none font-medium"
                  />
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 normal-case">
                    Our production team will custom cut your scrub uniform set to match these exact measurements.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 select-none">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex items-center border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 h-11 shrink-0 w-max mx-auto sm:mx-0">
                  <button type="button" onClick={() => setPurchaseQuantity(prev => Math.max(1, prev - 1))} className="px-3 h-full hover:bg-slate-200 dark:hover:bg-slate-700 font-black text-sm transition-colors focus:outline-none cursor-pointer">-</button>
                  <span className="px-4 text-xs font-mono font-black text-slate-800 dark:text-white">{purchaseQuantity}</span>
                  <button type="button" onClick={() => setPurchaseQuantity(prev => Math.min(totalStockCount || 99, prev + 1))} className="px-3 h-full hover:bg-slate-200 dark:hover:bg-slate-700 font-black text-sm transition-colors focus:outline-none cursor-pointer">+</button>
                </div>

                <div className="flex flex-col items-center sm:items-start justify-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total For {purchaseQuantity} Set(s):</span>
                  <span className="text-lg font-black text-[#1E3A8A] dark:text-sky-400">KES {effectiveTotalPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCartDispatcher}
                  disabled={isOutOfStock}
                  className="w-full h-11 bg-[#1E3A8A] hover:bg-[#1D4ED8] disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2 focus:outline-none cursor-pointer"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>{isOutOfStock ? 'Sold Out' : 'Add Set To Bag'}</span>
                </button>
                <button
                 type="button"
                 onClick={handleWhatsAppOrder}
                 disabled={isOutOfStock || whatsAppLoading}
                 className={`w-full h-11 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2 focus:outline-none ${
                  isOutOfStock || whatsAppLoading
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                  }`}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>
                      {whatsAppLoading ? "Processing..." : "Order Via WhatsApp"}
                      </span>
                      </button>
              </div>

              {cartLimitError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-[10px] font-black uppercase tracking-wider rounded-r-xl flex items-center space-x-2 animate-scale shadow-3xs select-none">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{cartLimitError}</span>
                </div>
              )}
            </div>

            {successNotice && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-r-xl flex items-center space-x-2 animate-scale shadow-3xs select-none">
                <Check className="h-3.5 w-3.5" />
                <span>Uniform item appended to your checkout bag context registry successfully!</span>
              </div>
            )}

          </div>
        </div>

        <div className="pt-12 border-t border-slate-200 dark:border-slate-800 mt-12">
          <ReviewSection />
        </div>
        <div className="pt-12 mt-12 border-t dark:border-slate-800 space-y-4">
          <div className="flex items-center space-x-1.5 border-b border-dashed pb-1.5 dark:border-slate-800 select-none">
            <ShoppingBag className="h-4 w-4 text-[#1E3A8A]" />
            <h2 className="font-black text-xs uppercase tracking-wider text-slate-400">Practitioners Aligned Catalog Recommendations</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {suggestedProducts.map((item) => {
              const baseOrigPrice = parseFloat(item.price || item.Price || 0);
              const promoMarkdownPrice = parseFloat(item.discount_price || item.discounted_price || item.offer_price || 0);
              const hasPromo = item.is_on_offer === true || String(item.is_on_offer).toLowerCase() === 'true';

              return (
                <Link
                  key={`rec-item-card-${item.id}`}
                  to={`/products/${item.id}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 flex flex-col justify-between group hover:shadow-2xs transition-all transform hover:-translate-y-0.5 animate-fade"
                >
                  <div className="space-y-2">
                    <div className="bg-slate-50 dark:bg-slate-800/50 h-28 rounded-xl overflow-hidden flex items-center justify-center p-2 relative">
                      {item.image_url ? (
                      <img
                      src={item.image_url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                      ) : (
                        <Package className="h-6 w-6 text-slate-300" />
                      )}
                    </div>
                    <span className="block font-black text-slate-800 dark:text-white text-[11px] uppercase tracking-wide truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between font-mono text-[10px] font-black border-t pt-2 border-dashed dark:border-slate-800">
                    {hasPromo && promoMarkdownPrice > 0 ? (
                      <div className="flex flex-row items-center gap-1.5">
                        <span className="text-[#1E3A8A] dark:text-sky-400">KES {promoMarkdownPrice.toLocaleString()}</span>
                        <span className="text-[8px] text-slate-400 line-through font-normal">KES {baseOrigPrice.toLocaleString()}</span>
                      </div>
                    ) : (
                      <span className="text-slate-700 dark:text-slate-200">KES {baseOrigPrice.toLocaleString()}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}