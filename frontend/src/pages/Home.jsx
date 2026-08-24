import { supabase } from "../supabaseClient";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiService } from '../services/api';
import { useCart } from '../context/useCart';
import {
  Sparkles, ShieldCheck, Truck, MessageSquare, Award, RefreshCw,
  ChevronRight, Star, ShoppingBag, ArrowUpRight, HeartHandshake,
  Layers, CheckCircle, Smartphone, Package, Clock, MessageCircle
} from 'lucide-react';
import ProductCard from '../components/ProductCard';

const CORPORATE_PHONE_NUMBER = "254116643999";

const HERO_BANNER_IMAGE_URL = "https://wfdswuqpyfksxfdnqhss.supabase.co/storage/v1/object/public/site-assets/Screenshot%20from%202026-08-20%2011-32-02.png";

function int(val) {
  return parseInt(val || 0, 10);
}

function isPackageExpired(pkg) {
  if (!pkg.is_time_limited) return false;
  if (!pkg.available_until_date) return false;
  const untilDateTime = new Date(
    `${pkg.available_until_date}T${pkg.available_until_time || '23:59:59'}`
  );
  return new Date() > untilDateTime;
}
function buildPackageWhatsAppUrl(pkg, orderRef) {
  const message = encodeURIComponent(
    `NEW BUNDLE ORDER - SCRUB POINT KENYA\n\n` +
    `Order Ref: ${orderRef || 'N/A'}\n` +
    `Package: ${pkg.name}\n` +
    `Price: KES ${Number(pkg.price).toLocaleString()}\n` +
    `Description: ${pkg.description || 'N/A'}\n\n` +
    `Please let me know how to proceed with payment and delivery details!`
  );
  return `https://wa.me/${CORPORATE_PHONE_NUMBER}?text=${message}`;
}

export default function Home() {
  const { addToCart, cart } = useCart();

  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [packageOrderSending, setPackageOrderSending] = useState(null);
  const [packageOrderErrors, setPackageOrderErrors] = useState({});

  const loadHomeData = async () => {
    setLoading(true);

    try {
        const productRes = await ApiService.products.getAll(1, 100);
        if (productRes.success) setProducts(productRes.data || []);

        const packageRes = await ApiService.packages.getAll();
        if (packageRes.success) setPackages(packageRes.data || []);

        const reviewRes = await ApiService.reviews.getApproved();
        if (reviewRes.success) setReviews(reviewRes.data || []);
    } catch (err) {
        console.error("Home data compilation skip.");
    } finally {
        setLoading(false);
    }
};

useEffect(() => {
  loadHomeData();

  const productChannel = supabase
    .channel("products-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "products" },
      (payload) => {
        loadHomeData();
      }
    )
    .subscribe();


  const packagesChannel = supabase
    .channel("packages-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "packages" },
      (payload) => {
        loadHomeData();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(productChannel);
    supabase.removeChannel(packagesChannel);
  };
}, []);

useEffect(() => {
  const handleFocus = () => {
    loadHomeData();
  };

  window.addEventListener("focus", handleFocus);

  const intervalId = setInterval(() => {
    loadHomeData();
  }, 600000);

  return () => {
    window.removeEventListener("focus", handleFocus);
    clearInterval(intervalId);
  };
}, []);

  const categoriesList = [...new Set(products.map(p => p.category))].filter(Boolean);
  const featuredListings = products.filter(p => p.is_featured).slice(0, 6);
  const bestSellersListings = products.slice(0, 6);

  const activePackages = packages.filter(pkg => !isPackageExpired(pkg));
  const featuredPackages = activePackages.filter(pkg => pkg.is_featured);
  const homepagePackages = (featuredPackages.length > 0 ? featuredPackages : activePackages).slice(0, 4);

  const highTierReviews = reviews.filter(r => int(r.rating) === 5 || int(r.rating) === 4);

  const handleAddPackageToCart = (pkg) => {
  const packageStock = int(pkg.stock_quantity);
  const cartId = `package-${pkg.id}`;
  const existing = cart.find(item => item.id === cartId);
  const alreadyInCart = existing ? existing.quantity : 0;

  if (packageStock <= 0) {
    setPackageOrderErrors(prev => ({ ...prev, [pkg.id]: 'This package is currently out of stock.' }));
    return;
  }
  if (alreadyInCart + 1 > packageStock) {
    setPackageOrderErrors(prev => ({ ...prev, [pkg.id]: `Only ${packageStock} available — you already have ${alreadyInCart} in your cart.` }));
    return;
  }

  setPackageOrderErrors(prev => ({ ...prev, [pkg.id]: null }));
  addToCart({
    id: cartId,
    type: 'package',
    name: pkg.name,
    price: pkg.price,
    image_url: pkg.image_url,
    quantity: 1,
    components: pkg.products_summary || []
  });
};

  const handlePackageWhatsAppOrder = async (pkg) => {
    if (isPackageExpired(pkg) || packageOrderSending === pkg.id) return;
    setPackageOrderSending(pkg.id);
    setPackageOrderErrors(prev => ({ ...prev, [pkg.id]: null }));

    try {
      const orderRes = await ApiService.orders.logWhatsAppClick({
        package_id: pkg.id,
        product_name: pkg.name,
        quantity: 1,
        variant_details: 'Package bundle',
        total_price: Number(pkg.price)
      });

      if (!orderRes.success) {
        setPackageOrderErrors(prev => ({ ...prev, [pkg.id]: orderRes.message || 'Unable to register your order.' }));
        return;
      }

      window.open(buildPackageWhatsAppUrl(pkg, orderRes.data?.order_ref), '_blank');
    } catch (err) {
      setPackageOrderErrors(prev => ({ ...prev, [pkg.id]: err.message || 'Unable to register your order.' }));
    } finally {
      setPackageOrderSending(null);
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

  return (
    <div className="w-full flex flex-col justify-between transition-colors duration-200">
      <div className="grow">

        <section className="relative w-full min-h-[calc(100vh-72px)] overflow-hidden">

          <img
          src={HERO_BANNER_IMAGE_URL}
          alt="Scrub Point — medical scrubs, stethoscopes, textbooks, and mobility equipment"
          className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-black/30"></div>

          <div className="relative z-10 min-h-[calc(100vh-72px)] flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center space-y-6 text-white">

              <div className="space-y-3">
                <span className="inline-flex text-[9px] font-black uppercase tracking-widest bg-white/20 text-white px-3 py-1.5 rounded-full border border-white/30 backdrop-blur-sm">
                Premium Healthcare Apparel Hub
        </span>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase leading-tight max-w-3xl mx-auto">
          Premium Medical Supplies for Healthcare Professionals
        </h1>

        <p className="text-[11px] sm:text-sm font-semibold max-w-2xl mx-auto uppercase tracking-wide leading-relaxed text-white/90">
          Equipping clinics and dressing practitioners across Kenya with
          anti-microbial uniform scrubs, literature references, and diagnostic gear.
        </p>
      </div>

      <div className="flex justify-center">
        <Link
          to="/products"
          className="bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white font-black text-[10px] uppercase tracking-widest px-7 py-3.5 rounded-xl shadow-lg transition-all flex items-center space-x-1.5 group cursor-pointer focus:outline-none"
        >
          <span>View Store Catalog</span>

          <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

    </div>
  </div>

</section>

        <div className="w-full bg-white border-b border-slate-200/60 py-3 sticky top-0 z-40 shadow-2xs select-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col space-y-2">
            <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center space-x-1">
              <span>Filter Our Shop Inventory Catalog By Categories:</span>
            </div>
            <div className="w-full overflow-x-auto whitespace-nowrap scrollbar-none flex flex-row items-center gap-2 pb-1.5 scroll-smooth snap-x">
              {(categoriesList || []).map((category) => {
                return (
                  <Link
                    key={`category-badge-chip-${category}`}
                    to={`/products?category=${encodeURIComponent(category)}`}
                    className="inline-block px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 border-slate-200/80 bg-slate-50 text-slate-600 hover:border-[#1E3A8A] hover:bg-white snap-start transition-all duration-200 cursor-pointer focus:outline-none shrink-0 transform active:scale-95"
                  >
                    {category === 'All' ? 'View All Gear' : category}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <section className="mt-14 space-y-4 overflow-hidden select-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center justify-center sm:justify-start">
              <Sparkles className="h-4 w-4 text-amber-500 mr-1.5 animate-pulse" />
              <span>Our Featured Products Showcase</span>
            </h2>
          </div>

          <div className="relative w-full flex items-center bg-slate-50/50 py-4 border-y border-slate-100 dark:border-slate-800/60">
            <style>{`
              @keyframes slideMarquee {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee-track {
                display: flex;
                width: max-content;
                gap: 1.5rem;
                animation: slideMarquee 25s linear infinite;
              }
              .animate-marquee-track:hover {
                animation-play-state: paused;
              }
            `}</style>

            <div className="animate-marquee-track px-4">
              {featuredListings.concat(featuredListings).map((item, idx) => (
                <div key={`marquee-item-${idx}`} className="w-50 shrink-0 transform hover:scale-102 transition-transform shadow-xs bg-white dark:bg-slate-900 rounded-2xl p-2 border dark:border-slate-800">
                  <ProductCard item={item} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {homepagePackages.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-4">
            <div className="text-center sm:text-left">
              <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center justify-center sm:justify-start">
                <Package className="h-4 w-4 text-[#1E3A8A] mr-1.5" />
                <span>Special Bundle Packages</span>
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Combo sets - better value than buying items separately</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {homepagePackages.map((pkg) => {
                const expired = isPackageExpired(pkg);
                return (
                  <div
                    key={`home-package-${pkg.id}`}
                    className="bg-white dark:bg-slate-900 border-2 border-[#1E3A8A] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="h-28 bg-slate-50 dark:bg-slate-800 rounded-xl border overflow-hidden flex items-center justify-center">
                        {pkg.image_url ? (
                          <img src={pkg.image_url} alt={pkg.name} className="h-full w-full object-contain" />
                        ) : (
                          <Package className="h-8 w-8 text-slate-300" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="font-black text-xs uppercase text-slate-800 dark:text-white truncate" title={pkg.name}>
                          {pkg.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium normal-case line-clamp-2">
                          {pkg.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-sm font-black text-[#1E3A8A] dark:text-sky-400">
                          KES {Number(pkg.price).toLocaleString()}
                        </span>
                        {pkg.is_time_limited && pkg.available_until_date && (
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center space-x-0.5 ${
                            expired ? 'bg-slate-100 text-slate-400' : 'bg-purple-50 text-purple-600 border border-purple-100'
                          }`}>
                            <Clock className="h-2.5 w-2.5" />
                            <span>{expired ? 'Expired' : `Until ${pkg.available_until_date}`}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <button
                      type="button"
                      onClick={() => handleAddPackageToCart(pkg)}
                      disabled={expired || int(pkg.stock_quantity) <= 0}
                      className={`w-full text-[9px] font-black uppercase tracking-widest py-2 rounded-xl flex items-center justify-center space-x-1 focus:outline-none transition-colors ${
                        expired || int(pkg.stock_quantity) <= 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white cursor-pointer'
                        }`}
                        >
                          <ShoppingBag className="h-3 w-3" />
                          <span>{int(pkg.stock_quantity) <= 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                          </button>

                      <button
                        type="button"
                        onClick={() => handlePackageWhatsAppOrder(pkg)}
                        disabled={expired || packageOrderSending === pkg.id}
                        className={`w-full text-[9px] font-black uppercase tracking-widest py-2 rounded-xl flex items-center justify-center space-x-1 focus:outline-none transition-colors ${
                          expired || packageOrderSending === pkg.id
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                        }`}
                      >
                        <MessageCircle className="h-3 w-3" />
                        <span>{packageOrderSending === pkg.id ? 'Verifying...' : 'Order via WhatsApp'}</span>
                      </button>
                      {packageOrderErrors[pkg.id] && (
                        <p className="text-[8px] text-red-600 font-bold normal-case text-center">{packageOrderErrors[pkg.id]}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-6">
          <div className="text-center space-y-0.5">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Why Choose Scrub Point?</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Engineered to support medical professionals with absolute zero e-commerce friction</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-center text-xs">
            {[
              { title: 'Genuine Medical Equipment', desc: '100% certified clinical models.', icon: <Award className="h-4 w-4 text-[#1E3A8A] dark:text-sky-400" /> },
              { title: 'Affordable Prices', desc: 'Direct savings margins.', icon: <CheckCircle className="h-4 w-4 text-[#1E3A8A] dark:text-sky-400" /> },
              { title: 'Fast Delivery', desc: 'Prompt tracking loops cross Kenya.', icon: <Truck className="h-4 w-4 text-[#1E3A8A] dark:text-sky-400" /> },
              { title: 'Quality Guaranteed', desc: 'Rigorous protective weaves blends.', icon: <ShieldCheck className="h-4 w-4 text-[#1E3A8A] dark:text-sky-400" /> },
              { title: 'WhatsApp Ordering', desc: 'Carts redirecting over instant chat.', icon: <Smartphone className="h-4 w-4 text-[#1E3A8A] dark:text-sky-400" /> }
            ].map((box, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 border-2 border-[#1E3A8A] dark:border-sky-500 rounded-2xl shadow-sm p-5 space-y-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors transform hover:scale-102 duration-200"
              >
                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 grid place-items-center mx-auto shadow-inner">{box.icon}</div>
                <h4 className="font-black uppercase tracking-wider text-[10px] text-slate-800 dark:text-slate-100 leading-tight">{box.title}</h4>
                <p className="text-slate-400 dark:text-slate-400 text-[9px] font-semibold lowercase leading-tight">{box.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 space-y-4 overflow-hidden select-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Our Best Sellers Collection</h2>
          </div>

          <div className="relative w-full flex items-center bg-slate-50/50 py-4 border-y border-slate-100 dark:border-slate-800/60">
            <style>{`
              @keyframes slideMarqueeReverse {
                0% { transform: translateX(-50%); }
                100% { transform: translateX(0%); }
              }
              .animate-marquee-track-reverse {
                display: flex;
                width: max-content;
                gap: 1.5rem;
                animation: slideMarqueeReverse 25s linear infinite;
              }
              .animate-marquee-track-reverse:hover {
                animation-play-state: paused;
              }
            `}</style>

            <div className="animate-marquee-track-reverse px-4">
              {bestSellersListings.concat(bestSellersListings).map((item, idx) => (
                <div key={`b-marquee-item-${idx}`} className="w-50 shrink-0 transform hover:scale-102 transition-transform shadow-xs bg-white dark:bg-slate-900 rounded-2xl p-2 border dark:border-slate-800">
                  <ProductCard item={item} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-14 space-y-6">
          <div className="text-center space-y-0.5">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Customer Reviews</h2>
          </div>

          {highTierReviews.length === 0 ? (
            <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 p-6 border dark:border-slate-800 text-center text-xs font-bold text-slate-400 uppercase tracking-wide py-10 shadow-sm rounded-2xl">
              <p className="mt-2">Clinical appraisals will appear live on your screen shortly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium animate-fade">
              {highTierReviews.slice(0, 3).map((rev, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-2 shadow-xs">
                  <div className="text-amber-400 font-bold tracking-xs">
                    {int(rev.rating) === 5 ? '5 stars' : '4 stars'}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 italic font-medium">"{rev.comment}"</p>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase pt-1">
                    - {rev.reviewer_name || rev.name || 'Anonymous User'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}